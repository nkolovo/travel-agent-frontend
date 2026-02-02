"use client";

import { useEffect, useState, useRef } from "react";
import { FiEdit, FiCamera } from "react-icons/fi";
import NotesModal from "./notesModal";

interface HeaderProps {
  itineraryId: number;
  retailPrice: number;
  netPrice: number;
  notes: string | undefined;
  onNotesUpdate?: (notes: string) => void;
}

export default function Header({ itineraryId, retailPrice, netPrice, notes, onNotesUpdate }: HeaderProps) {
  const [itineraryLoaded, setItineraryLoaded] = useState<boolean>(false);
  const [coverImage, setCoverImage] = useState<string>("");

  // States to track current values
  const [title, setTitle] = useState<string>("Insert Title Here");
  const [originalTitle, setOriginalTitle] = useState<string>("Insert Title Here");
  const [tripCost, setTripCost] = useState<number>(retailPrice);
  const [netCost, setNetCost] = useState<number>(netPrice);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Refs to track previous values
  const isFirstRender = useRef(true);
  const prevTitle = useRef(title);

  const saveChanges = async () => {
    const updatedData = { itineraryId, title, tripCost, netCost };
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/itineraries/update`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(updatedData),
      });
      // Update previous values after a successful save
      prevTitle.current = title;
    } catch (error) {
      console.error("Error saving changes:", error);
    }
  };

  useEffect(() => {
    if (!isEditing) {
      setTripCost(retailPrice ?? 0);
      setNetCost(netPrice ?? 0);
    }
  }, [retailPrice, netPrice]);

  useEffect(() => {
    const fetchItinerary = async () => {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/itineraries/${itineraryId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      })
        .then(res => {
          if (!res.ok)
            throw new Error(`Request error: ${res.status}`);
          return res.json()
        })
        .then(data => {
          setItineraryLoaded(true);
          setTitle(data.name ?? title)
          setTripCost(data.tripPrice ?? tripCost)
          setNetCost(data.netPrice ?? netCost)
          setCoverImage(data.coverImageUrl ?? "")
          prevTitle.current = data.name ?? title;
        }).catch(error => console.error("Error fetching itinerary:", error))
    };

    if (!itineraryLoaded) {
      fetchItinerary();
      return;
    }

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      if ((title !== prevTitle.current) && !isEditing)
        saveChanges();
    }, 1000);
    return () => clearTimeout(timeout);
  }, [title, coverImage, isEditing, itineraryLoaded]);

  const handleCoverImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadCoverImage(file);
    }
  };

  const uploadCoverImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/itineraries/${itineraryId}/upload-image`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        }
      );
      if (!response.ok) throw new Error("Image upload failed");
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value);
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      // Save the original title when entering edit mode
      setOriginalTitle(title);
    }
  };

  const saveTitle = () => {
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setTitle(originalTitle); // Revert to original title
    setIsEditing(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      saveTitle();
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
  }

  const closeModal = (updatedNotes?: string) => {
    setIsModalOpen(false);
    if (updatedNotes && onNotesUpdate) {
      onNotesUpdate(updatedNotes);
      setSuccessMessage("Notes saved successfully");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 5000);
    }
  }

  return (
    <div className="relative w-full h-32 bg-gray-300 rounded-lg overflow-hidden shadow-md">
      {/* Render the modal */}
      {isModalOpen && <NotesModal isOpen={isModalOpen} closeModal={closeModal} notes={notes} itineraryId={itineraryId} />}
      {/* Cover Image */}
      {coverImage ? (
        <img
          src={coverImage}
          alt="Cover"
          className="w-full h-full object-cover" // Ensures the image fits the container without cropping
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-400 text-white text-sm">
          No Cover Image
        </div>
      )}

      {/* Overlaying Title & Edit/Save/Cancel Buttons */}
      <div className="absolute top-2 left-4 flex items-center space-x-2">
        {isEditing ? (
          // If in edit mode, show an input field
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            onKeyDown={handleKeyDown}
            className="text-white text-lg font-bold drop-shadow-md bg-transparent border-b-2 border-white focus:outline-none max-w-[300px]"
          />
        ) : (
          // If in view mode, just display the title
          <h1 className="text-white text-lg font-bold drop-shadow-md break-words max-w-[300px]">{title}</h1>
        )}

        {isEditing ? (
          <div className="flex space-x-1">
            {/* Show Save and Cancel buttons when editing */}
            <button onClick={saveTitle} className="text-white text-xs hover:text-gray-200 bg-green-600 px-2 py-1 rounded">
              Save
            </button>
            <button onClick={cancelEdit} className="text-white text-xs hover:text-gray-200 bg-red-600 px-2 py-1 rounded">
              Cancel
            </button>
          </div>
        ) : (
          // Show Edit button when not editing
          <button onClick={toggleEditMode}>
            <FiEdit className="text-white text-base hover:text-gray-200 transition" />
          </button>
        )}
      </div>

      {/* Total Trip Cost (Under Title) */}
      <p className="absolute top-9 left-4 text-white text-sm drop-shadow-md">
        Total Cost: €{tripCost}
      </p>

      {/* Net Cost (Under Trip Cost) */}
      <p className="absolute top-14 left-4 text-white text-sm drop-shadow-md">
        Net Cost: €{netCost}
      </p>

      <button className="absolute top-20 left-4 bg-purple-500 text-white px-4 py-2 rounded shadow hover:bg-purple-600" onClick={() => openModal()}>Notes</button>

      {/* Change Cover Photo Button (Bottom Right) */}
      <button
        className="absolute bottom-2 right-2 bg-white bg-opacity-50 p-1 rounded-full hover:bg-opacity-75 transition"
        onClick={() => document.getElementById("cover-image-input")?.click()}
      >
        <FiCamera className="text-gray-700 text-base" />
      </button>

      {/* Hidden File Input */}
      <input
        id="cover-image-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleCoverImageChange}
      />
      {showSuccessToast && (
        <div className="toast-notification">
          <span>✓ {successMessage}</span>
        </div>
      )}
    </div>
  );
}
