import React, { useState, useRef, useEffect } from "react";
import { FaTimes, FaBold, FaItalic, FaLink } from "react-icons/fa";
import "./../styles/itemModal.css";

interface NotesModalProps {
    isOpen: boolean; // Prop to control modal visibility
    closeModal?: (notes?: string) => void; // Function to close the modal
    notes?: string; // Optional item for editing
    itineraryId: number; // ID of the itinerary
}

const NotesModal: React.FC<NotesModalProps> = ({ isOpen, closeModal, notes, itineraryId }) => {
    const [text, setText] = useState(notes || "");
    const textRef = useRef<HTMLDivElement>(null);
    const [activeNotesFormats, setActiveNotesFormats] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null; // Do not render if isOpen is false

    const handleFormat = (command: string, targetRef: React.RefObject<HTMLDivElement | null>, setActiveFormats: React.Dispatch<React.SetStateAction<string[]>>, value?: string) => {
        // Ensure the contentEditable div is focused
        if (targetRef.current) {
            targetRef.current.focus();
        }

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);

        // Execute the command
        switch (command) {
            case "bold":
                document.execCommand("bold");
                break;
            case "italic":
                document.execCommand("italic");
                break;
            case "underline":
                document.execCommand("underline");
                break;
            case "strikeThrough":
                document.execCommand("strikeThrough");
                break;
            case "createLink":
                const link = document.createElement("a");
                link.href = value || "#";
                link.textContent = window.getSelection()?.toString() || "Link";
                if (range) {
                    range.deleteContents();
                    range.insertNode(link);
                }
                break;
            case "highlight":
                document.execCommand("hiliteColor", false, value || "yellow");
                break;
            case "removeHighlight":
                document.execCommand("hiliteColor", false, "transparent");
                break;
            default:
                break;
        }

        updateActiveFormats(setActiveFormats); // Update the active formats after applying the command
    };

    // Function to update the active formats based on the current selection
    const updateActiveFormats = (setActiveFormats: React.Dispatch<React.SetStateAction<string[]>>) => {
        const formats = [];
        if (document.queryCommandState("bold")) formats.push("bold");
        if (document.queryCommandState("italic")) formats.push("italic");
        if (document.queryCommandState("underline")) formats.push("underline");
        if (document.queryCommandState("strikeThrough")) formats.push("strikeThrough");
        if (document.queryCommandState("createLink")) formats.push("createLink");
        setActiveFormats(formats);
    };

    // Helper function to clean pasted content while preserving basic formatting
    const cleanPastedContent = (html: string): string => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        // Remove all style attributes and font-related elements
        const allElements = tempDiv.querySelectorAll('*');
        allElements.forEach(element => {
            element.removeAttribute('style');
            element.removeAttribute('class');
            element.removeAttribute('id');

            // Remove font-related tags but preserve content
            if (['FONT', 'SPAN'].includes(element.tagName) &&
                !['B', 'I', 'U', 'STRONG', 'EM'].includes(element.tagName)) {
                const parent = element.parentNode;
                while (element.firstChild) {
                    parent?.insertBefore(element.firstChild, element);
                }
                element.remove();
            }
        });

        return tempDiv.innerHTML;
    };

    // Handle paste events for content cleaning
    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();

        const clipboardData = e.clipboardData;
        const pastedData = clipboardData.getData('text/html') || clipboardData.getData('text/plain');

        if (pastedData) {
            const cleanedContent = cleanPastedContent(pastedData);
            document.execCommand('insertHTML', false, cleanedContent);
        }
    };

    // Event listener for selection changes
    const handleSelectionChange = () => {
        // Update active formats for the currently focused field
        const activeElement = document.activeElement;
        if (activeElement === textRef.current) {
            updateActiveFormats(setActiveNotesFormats);
        }
    };

    // Add event listener for selection changes
    useEffect(() => {
        if (notes) {
            textRef.current!.innerHTML = notes || "";
        }
        document.addEventListener("selectionchange", handleSelectionChange);
        return () => {
            document.removeEventListener("selectionchange", handleSelectionChange);
        };
    }, []);

    const saveNotes = async () => {
        if (isSaving) return;
        if (text.trim() === "" || text === "<br>" || text === "<div><br></div>") {
            window.alert("Please fill in the notes before saving.");
            return;
        }
        setIsSaving(true);

        notes = text;

        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/itineraries/${itineraryId}/notes/save`, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain",
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
            body: notes,
        })
            .then(async res => {
                if (!res.ok)
                    throw new Error(`Request error: ${res.status}`);
            })
            .catch(error => { console.warn(notes), console.warn("Error saving changes to item ", error) })

        if (closeModal) {
            closeModal(notes);
        }
        setIsSaving(false);
    }

    return (
        <div className="modal-overlay" onClick={() => closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{notes ? "Edit Notes" : "Create Notes"}</h2>
                    <FaTimes className="close-icon" onClick={() => closeModal && closeModal()} />
                </div>

                <div className="modal-body">
                    {/* Notes Row */}
                    <div className="modal-row">
                        <span className="modal-row-label">Notes</span>
                        <div className="modal-row-content">
                            <div className="notes-toolbar">
                                <button
                                    className={activeNotesFormats.includes("bold") ? "active" : ""}
                                    onClick={() => handleFormat("bold", textRef, setActiveNotesFormats)}
                                >
                                    <FaBold />
                                </button>
                                <button
                                    className={activeNotesFormats.includes("italic") ? "active" : ""}
                                    onClick={() => handleFormat("italic", textRef, setActiveNotesFormats)}
                                >
                                    <FaItalic />
                                </button>
                                <button
                                    className={activeNotesFormats.includes("underline") ? "active" : ""}
                                    onClick={() => handleFormat("underline", textRef, setActiveNotesFormats)}
                                >
                                    <u>U</u>
                                </button>
                                <button
                                    className={activeNotesFormats.includes("strikeThrough") ? "active" : ""}
                                    onClick={() => handleFormat("strikeThrough", textRef, setActiveNotesFormats)}
                                >
                                    <s>abc</s>
                                </button>
                                <button
                                    className={activeNotesFormats.includes("createLink") ? "active" : ""}
                                    onClick={() => handleFormat("createLink", textRef, setActiveNotesFormats, prompt("Enter URL") || "")}
                                >
                                    <FaLink />
                                </button>
                                <button
                                    className="highlight-red"
                                    onClick={() => handleFormat("highlight", textRef, setActiveNotesFormats, "#ffcccc")}
                                    style={{ backgroundColor: "#ffcccc", border: "1px solid #ccc", margin: "0 2px" }}
                                    title="Red Highlight"
                                >
                                    Red
                                </button>
                                <button
                                    className="highlight-yellow"
                                    onClick={() => handleFormat("highlight", textRef, setActiveNotesFormats, "#ffff99")}
                                    style={{ backgroundColor: "#ffff99", border: "1px solid #ccc", margin: "0 2px" }}
                                    title="Yellow Highlight"
                                >
                                    Yellow
                                </button>
                                <button
                                    className="highlight-blue"
                                    onClick={() => handleFormat("highlight", textRef, setActiveNotesFormats, "#cce5ff")}
                                    style={{ backgroundColor: "#cce5ff", border: "1px solid #ccc", margin: "0 2px" }}
                                    title="Blue Highlight"
                                >
                                    Blue
                                </button>
                                <button
                                    className="remove-highlight"
                                    onClick={() => handleFormat("removeHighlight", textRef, setActiveNotesFormats)}
                                    style={{ border: "1px solid #ccc", margin: "0 2px" }}
                                    title="Remove Highlight"
                                >
                                    Remove
                                </button>
                            </div>
                            <div
                                ref={textRef}
                                className="notes-textarea"
                                contentEditable
                                suppressContentEditableWarning
                                onPaste={handlePaste}
                                onInput={(e) => {
                                    // Get the HTML content
                                    let html = (e.target as HTMLDivElement).innerHTML;
                                    html = html.replace(/<br>/g, "<br />");
                                    html = html.replace("&amp;", "&#38;");
                                    setText(html);
                                }}
                            >
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button
                        className="modal-button-save"
                        onClick={saveNotes}
                        disabled={isSaving}
                        style={{ opacity: isSaving ? 0.5 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }}
                    >
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button className="modal-button-close" onClick={() => closeModal && closeModal()}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default NotesModal;