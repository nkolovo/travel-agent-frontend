import React, { useEffect, useRef, useState } from 'react';
import type { Date } from './types/types';
import { FaFeatherAlt } from 'react-icons/fa';

const MAX_LENGTH = 300;

interface PlannerNoteProps {
  date: Date;
  onSaved: (date: Date) => void; // Keeps the parent's copy of the date in sync with the saved note
}

// A short, client-facing note for the day. It prints handwritten on this day in the At a Glance PDF.
// Remount with key={date.id} so each day starts from its own saved note.
const PlannerNote: React.FC<PlannerNoteProps> = ({ date, onSaved }) => {
  const [text, setText] = useState(date.plannerNote ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const savedText = useRef(date.plannerNote ?? "");
  const latest = useRef({ date, text });
  latest.current = { date, text };

  const save = async () => {
    const { date: current, text: note } = latest.current;
    if (note === savedText.current || !current.id) return;
    setStatus("saving");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/itineraries/update/date`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ ...current, plannerNote: note }),
      });
      if (!res.ok) throw new Error(`Request error: ${res.status}`);
      savedText.current = note;
      setStatus("saved");
      onSaved({ ...current, plannerNote: note });
    } catch (error) {
      console.warn("Error saving planner note", error);
      setStatus("error");
    }
  };

  // Autosave a second after typing stops
  useEffect(() => {
    if (text === savedText.current) return;
    const timeout = setTimeout(save, 1000);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  // Don't lose a half-typed note when switching days
  useEffect(() => () => { save(); },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []);

  return (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
      <div className="flex items-center justify-between text-xs">
        <label htmlFor={`planner-note-${date.id}`} className="flex items-center gap-1.5 font-semibold text-amber-900">
          <FaFeatherAlt className="text-amber-600" />
          Note to client
          <span className="font-normal text-amber-700">· printed handwritten on this day in the At a Glance PDF</span>
        </label>
        <span className={status === "error" ? "text-red-600" : "text-amber-700"}>
          {status === "saving" && "Saving…"}
          {status === "saved" && "Saved"}
          {status === "error" && "Couldn't save, try again"}
        </span>
      </div>
      <textarea
        id={`planner-note-${date.id}`}
        value={text}
        maxLength={MAX_LENGTH}
        rows={2}
        onChange={(e) => { setText(e.target.value); setStatus("idle"); }}
        onBlur={save}
        placeholder="e.g. Skip Oia at sunset. The terrace at your hotel has the same view with none of the crowds."
        className="mt-1 w-full resize-y bg-transparent text-sm text-gray-800 placeholder:text-amber-700/50 outline-none"
      />
      <div className="text-right text-[10px] text-amber-700">{text.length}/{MAX_LENGTH}</div>
    </div>
  );
};

export default PlannerNote;
