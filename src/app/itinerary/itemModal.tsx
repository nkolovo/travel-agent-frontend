import React, { useState, useRef, useEffect, act } from "react";
import type { Activity, Item } from "./types/types"; // Importing Item type for TypeScript
import { FaTimes, FaBold, FaItalic, FaLink } from "react-icons/fa";
import "./../styles/itemModal.css";
import { FiCamera } from "react-icons/fi";

interface ItemModalProps {
    isOpen: boolean; // Prop to control modal visibility
    closeModalItem?: (item?: Item) => void; // Function to close the modal
    closeModalActivity?: (activity?: Activity) => void; // Function to close the modal
    item?: Item; // Optional item for editing
    activity?: Activity; // Optional activity for editing
}

const ItemModal: React.FC<ItemModalProps> = ({ isOpen, closeModalItem, closeModalActivity, item, activity }) => {
    const [country, setCountry] = useState(item?.country || activity?.country || "Greece"); // Default country if not provided
    const [location, setLocation] = useState(item?.location || activity?.location || "");
    const [category, setCategory] = useState(item?.category || activity?.category || "Activity");
    const [title, setTitle] = useState(item?.name || activity?.name || "");
    const [description, setDescription] = useState(item?.description || activity?.description || "");
    const [retailPrice, setRetailPrice] = useState(item?.retailPrice || activity?.retailPrice || 0);
    const [netPrice, setNetPrice] = useState(item?.netPrice || activity?.netPrice || 0);
    const [image, setImage] = useState(item?.imageUrl || activity?.imageUrl || "");
    const [imageName, setImageName] = useState(item?.imageName || activity?.imageName || "");
    const [activeFormats, setActiveFormats] = useState<string[]>([]);
    const notesRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLDivElement>(null);
    const retailPriceRef = useRef<HTMLDivElement>(null);
    const netPriceRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null; // Do not render if isOpen is false

    const countries = ["Greece", "Italy", "Spain", "France"];
    const locations = ["Athens", "Mykonos", "Ios", "Paros", "Naxos", "Crete"];
    const categories = ["Activity", "Lodging", "Flight", "Transportation", "Cruise", "Info"];

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
        if (item || activity) {
            titleRef.current!.innerHTML = item ? item.name : activity!.name;
            notesRef.current!.innerHTML = item ? item.description : activity!.description;
            retailPriceRef.current!.innerHTML = String(item ? item.retailPrice ?? "0" : activity?.retailPrice ?? "0");
            netPriceRef.current!.innerHTML = String(item ? item.netPrice ?? "0" : activity?.netPrice ?? "0");
            if (item?.imageName || activity?.imageName)
                loadImageFromGCS();

        }
        document.addEventListener("selectionchange", handleSelectionChange);
        return () => {
            document.removeEventListener("selectionchange", handleSelectionChange);
        };
    }, []);

    const saveItem = async () => {
        if (!location || !category || !title || !description) {
            window.alert("Please fill in all fields before saving.");
            return;
        }

        let objectToSave: Item | Activity;
        let isActivity = false;
        if (item && !activity) { // If editing an existing item
            objectToSave = {
                ...item,
                country,
                location,
                category,
                name: title,
                description,
                retailPrice,
                netPrice,
                imageName
            } as Item;
        } else if (activity && !item) { // If editing an existing activity
            isActivity = true;
            objectToSave = {
                ...activity,
                country,
                location,
                category,
                name: title,
                description,
                retailPrice,
                netPrice,
                imageName
            } as Activity;
        } else {
            objectToSave = {
                country,
                location,
                category,
                name: title,
                description,
                retailPrice,
                netPrice,
                imageName
            } as Item;
        }

        if (isActivity)
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dates/saveDateItem/${activity!.date.id}/item/${activity!.item.id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify(objectToSave),
            })
                .then(async res => {
                    if (!res.ok)
                        throw new Error(`Request error: ${res.status}`);
                })
                .catch(error => { console.warn(objectToSave), console.warn("Error saving changes to activity. ", error) })
        else
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/items/save`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify(objectToSave),
            })
                .then(async res => {
                    if (!res.ok)
                        throw new Error(`Request error: ${res.status}`);
                    const id = await res.json();
                    objectToSave.id = id;
                })
                .catch(error => { console.warn(objectToSave), console.warn("Error saving changes to item ", error) })

        if (closeModalItem)
            closeModalItem(objectToSave as Item);
        else if (closeModalActivity)
            closeModalActivity(objectToSave as Activity);
    }

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string); // Set the cover image state
            };
            reader.readAsDataURL(file);
            setImageName(file.name);
        }
    }

    const loadImageFromGCS = async () => {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/images/signed-url/${imageName}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
        })
            .then(res => {
                if (!res.ok)
                    throw new Error(`Request error: ${res.status}`);
                return res.text();
            })
            .then(signedUrl => {
                setImage(signedUrl);
            })
            .catch(error => { console.warn(), console.warn("Error retrieving the image. ", error) })
    }

    return (
        <div className="modal-overlay" onClick={() => closeModalItem}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{item ? "Edit Item" : activity ? "Edit Item for Date" : "Create Item"}</h2>
                    <FaTimes className="close-icon" onClick={() => (closeModalItem && closeModalItem()) || (closeModalActivity && closeModalActivity())} />
                </div>

                <div className="modal-body">
                    {/* Country Row (only visible by Chris and I) */}
                    <div className="modal-row">
                        <span className="modal-row-label">Country</span>
                        <div className="modal-row-content">
                            {countries.map((cntry) => (
                                <button
                                    key={cntry}
                                    className={`enum-button ${country === cntry ? "active" : ""}`}
                                    onClick={() => setCountry(cntry)}
                                >
                                    {cntry}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Location Row */}
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
                                    // Update the state with the current content
                                    let html = (e.target as HTMLDivElement).innerHTML;
                                    html = html.replace("&amp;", "&#38;");
                                    setTitle(html);
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
                                    // Get the HTML content
                                    let html = (e.target as HTMLDivElement).innerHTML;
                                    html = html.replace(/<br>/g, "<br />");
                                    html = html.replace("&amp;", "&#38;");
                                    setDescription(html);
                                }}
                            >
                            </div>
                        </div>
                    </div>
                    {/* Retail Price Row */}
                    <div className="modal-row">
                        <span className="modal-row-label">Retail Price</span>
                        <div className="modal-row-content">
                            <div
                                ref={retailPriceRef}
                                className="retail-price-textarea"
                                contentEditable
                                suppressContentEditableWarning
                                onInput={(e) => {
                                    setRetailPrice(Number((e.target as HTMLDivElement).innerHTML));
                                }}
                            >
                            </div>
                        </div>
                    </div>
                    {/* Net Price Row */}
                    <div className="modal-row">
                        <span className="modal-row-label">Net Price</span>
                        <div className="modal-row-content">
                            <div
                                ref={netPriceRef}
                                className="net-price-textarea"
                                contentEditable
                                suppressContentEditableWarning
                                onInput={(e) => {
                                    setNetPrice(Number((e.target as HTMLDivElement).innerHTML));
                                }}
                            >
                            </div>
                        </div>
                    </div>
                    {/* Image Row */}
                    <div className="modal-row">
                        <span className="modal-row-label">Image</span>
                        <div
                            className="modal-row-content"
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                                gap: "1rem"
                            }}
                        >
                            {/* Add/Change Item/Activity Photo Button */}
                            <button onClick={() => document.getElementById("item-image-input")?.click()}>
                                <FiCamera className="text-gray-700 text-2xl" />
                            </button>

                            {/* Hidden File Input */}
                            <input
                                id="item-image-input"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                            />
                            {/* Show image below the button if it exists */}
                            {image && (
                                <img
                                    src={image}
                                    alt="Item"
                                    style={{ maxWidth: "900px", maxHeight: "900px", borderRadius: "8px" }}
                                />
                            )}
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="modal-button-save" onClick={saveItem}>Save</button>
                    <button className="modal-button-close" onClick={() => (closeModalItem && closeModalItem()) || (closeModalActivity && closeModalActivity())}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default ItemModal;