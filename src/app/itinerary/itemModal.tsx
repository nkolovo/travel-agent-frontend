import React, { useState, useRef, useEffect } from "react";
import { FaTimes, FaBold, FaItalic, FaLink } from "react-icons/fa";
import "./../styles/itemModal.css"; // Importing CSS for modal styling

interface ItemModalProps {
    isOpen: boolean; // Prop to control modal visibility
    closeModal: () => void; // Function to close the modal
    item?: { name: string; description: string; category: string }; // Optional item for editing
}

const ItemModal: React.FC<ItemModalProps> = ({ isOpen, closeModal, item }) => {
    const [title, setTitle] = useState(item?.name || "");
    const [description, setDescription] = useState(item?.description || "");
    const [category, setCategory] = useState(item?.category || "");
    const [activeFormats, setActiveFormats] = useState<string[]>([]); // Track active formatting buttons
    const notesRef = useRef<HTMLDivElement>(null); // Reference to the contenteditable div
    const titleRef = useRef<HTMLDivElement>(null); // Reference to the contenteditable title div

    if (!isOpen) return null; // Do not render if isOpen is false

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

    return (
        <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{item ? "Edit Item" : "Create Item"}</h2>
                    <FaTimes className="close-icon" onClick={closeModal} />
                </div>

                <div className="modal-body">
                    {/* Category Row */}
                    <div className="modal-row">
                        <span className="modal-row-label">Category</span>
                        <div className="modal-row-content">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    className={`category-button ${category === cat ? "active" : ""}`}
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
                    <button className="modal-button-save" onClick={closeModal}>Save</button>
                    <button className="modal-button-close" onClick={closeModal}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default ItemModal;