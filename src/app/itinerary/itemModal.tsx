import React, { useState, useRef, useEffect } from "react";
import type { Item } from "./types/types"; // Importing Item type for TypeScript
import { FaTimes, FaBold, FaItalic, FaLink } from "react-icons/fa";
import "./../styles/itemModal.css"; // Importing CSS for modal styling

interface ItemModalProps {
    isOpen: boolean; // Prop to control modal visibility
    closeModal: (item?: Item) => void; // Function to close the modal
    item?: Item; // Optional item for editing
}

const ItemModal: React.FC<ItemModalProps> = ({ isOpen, closeModal, item }) => {
    const [location, setLocation] = useState(item?.location || "Greece"); // Default location if not provided
    const [title, setTitle] = useState(item?.name || "");
    const [description, setDescription] = useState(item?.description || "");
    const [category, setCategory] = useState(item?.category || "");
    const [activeFormats, setActiveFormats] = useState<string[]>([]); // Track active formatting buttons
    const notesRef = useRef<HTMLDivElement>(null); // Reference to the contenteditable div
    const titleRef = useRef<HTMLDivElement>(null); // Reference to the contenteditable title div

    if (!isOpen) return null; // Do not render if isOpen is false

    const locations = ["Greece"]; // List of locations, can be expanded later
    const categories = ["Activity", "Lodging", "Flight", "Transportation", "Cruise", "Info"];

    // Function to execute formatting commands
    const handleFormat = (command: string, value?: string) => {
        // Ensure the contentEditable div is focused
        if (notesRef.current) {
            notesRef.current.focus();
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
            default:
                break;
        }

        updateActiveFormats(); // Update the active formats after applying the command
    };

    // Function to update the active formats based on the current selection
    const updateActiveFormats = () => {
        const formats = [];
        if (document.queryCommandState("bold")) formats.push("bold");
        if (document.queryCommandState("italic")) formats.push("italic");
        if (document.queryCommandState("underline")) formats.push("underline");
        if (document.queryCommandState("strikeThrough")) formats.push("strikeThrough");
        if (document.queryCommandState("createLink")) formats.push("createLink");
        setActiveFormats(formats);
    };

    // Event listener for selection changes
    const handleSelectionChange = () => {
        updateActiveFormats();
    };

    // Add event listener for selection changes
    useEffect(() => {
        document.addEventListener("selectionchange", handleSelectionChange);
        return () => {
            document.removeEventListener("selectionchange", handleSelectionChange);
        };
    }, []);

    const saveItem = async () => {
        if (!location || !category || !title || !description) {
            console.warn("Please fill in all fields before saving.");
            return;
        }

        console.log("Saving item");
        if (item) {
            console.log("Preexisting item found, updating...");
            item.category = category;
            item.name = title;
            item.description = description;
        }
        else {
            console.log("No preexisting item found, creating new item...");
            item = {
                location: location,
                category: category,
                name: title,
                description: description
            } as Item; // Create a new item object if not editing
        }
        console.log("Item to save:", item);
        await fetch(`http://localhost:8080/api/items/save`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(item),
        })
            .then(res => {
                if (!res.ok)
                    throw new Error(`Request error: ${res.status}`);
                return res.json()
            })
            .then(item_id => {
                item!.id = item_id;
            })
            .catch(error => { console.warn(item), console.warn("Error saving changes to item ", error) })

        console.log("Item saved:", item);
        closeModal(item); // Close the modal after saving
    }

    return (
        <div className="modal-overlay" onClick={() => closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{item ? "Edit Item" : "Create Item"}</h2>
                    <FaTimes className="close-icon" onClick={() => closeModal()} />
                </div>

                <div className="modal-body">
                    {/* Location Row (only visible by Chris and I) */}
                    <div className="modal-row">
                        <span className="modal-row-label">Location</span>
                        <div className="modal-row-content">
                            {locations.map((loc) => (
                                <button
                                    key={loc}
                                    className={`enum-button ${location === loc ? "active" : ""}`}
                                    onClick={() => setLocation(loc)}
                                >
                                    {loc}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Category Row */}
                    <div className="modal-row">
                        <span className="modal-row-label">Category</span>
                        <div className="modal-row-content">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    className={`enum-button ${category === cat ? "active" : ""}`}
                                    onClick={() => setCategory(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Title Row */}
                    <div className="modal-row">
                        <span className="modal-row-label">Title</span>
                        <div className="modal-row-content">
                            <div
                                ref={titleRef}
                                className="title-textarea"
                                contentEditable
                                suppressContentEditableWarning
                                onInput={(e) => {
                                    // Update the description state with the current content
                                    setTitle((e.target as HTMLDivElement).innerText);
                                }}
                            >
                            </div>
                        </div>
                    </div>

                    {/* Notes Row */}
                    <div className="modal-row">
                        <span className="modal-row-label">Notes</span>
                        <div className="modal-row-content">
                            <div className="notes-toolbar">
                                <button
                                    className={activeFormats.includes("bold") ? "active" : ""}
                                    onClick={() => handleFormat("bold")}
                                >
                                    <FaBold />
                                </button>
                                <button
                                    className={activeFormats.includes("italic") ? "active" : ""}
                                    onClick={() => handleFormat("italic")}
                                >
                                    <FaItalic />
                                </button>
                                <button
                                    className={activeFormats.includes("underline") ? "active" : ""}
                                    onClick={() => handleFormat("underline")}
                                >
                                    <u>U</u>
                                </button>
                                <button
                                    className={activeFormats.includes("strikeThrough") ? "active" : ""}
                                    onClick={() => handleFormat("strikeThrough")}
                                >
                                    <s>abc</s>
                                </button>
                                <button
                                    className={activeFormats.includes("createLink") ? "active" : ""}
                                    onClick={() => handleFormat("createLink", prompt("Enter URL") || "")}
                                >
                                    <FaLink />
                                </button>
                            </div>
                            <div
                                ref={notesRef}
                                className="notes-textarea"
                                contentEditable
                                suppressContentEditableWarning
                                onInput={(e) => {
                                    // Update the description state with the current content
                                    setDescription((e.target as HTMLDivElement).innerText);
                                }}
                            >
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="modal-button-save" onClick={saveItem}>Save</button>
                    <button className="modal-button-close" onClick={() => closeModal()}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default ItemModal;