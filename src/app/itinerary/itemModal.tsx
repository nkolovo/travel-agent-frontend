import React, { useState, useRef, useEffect, act } from "react";
import type { Activity, Item, Supplier } from "./types/types";
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
    const [countries, setCountries] = useState<string[]>([]);
    const [locations, setLocations] = useState<string[]>([]);
    const [country, setCountry] = useState(item?.country || activity?.country || "Greece"); // Default country if not provided
    const [location, setLocation] = useState(item?.location || activity?.location || "");
    const [locationInput, setLocationInput] = useState(item?.location || activity?.location || "");
    const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
    const [isSelectingFromDropdown, setIsSelectingFromDropdown] = useState(false);
    const [category, setCategory] = useState(item?.category || activity?.category || "Activity");
    const [title, setTitle] = useState(item?.name || activity?.name || "");
    const [description, setDescription] = useState(item?.description || activity?.description || "");
    const [supplierName, setSupplierName] = useState<string | null>(item?.supplierName || activity?.supplierName || null);
    const [supplierContact, setSupplierContact] = useState<string | null>(item?.supplierContact || activity?.supplierContact || null);
    const [supplierUrl, setSupplierUrl] = useState<string | null>(item?.supplierUrl || activity?.supplierUrl || null);
    const [hasSupplier, setHasSupplier] = useState<boolean>(
        Boolean(item?.supplierName || activity?.supplierName)
    );
    const [retailPrice, setRetailPrice] = useState(item?.retailPrice || activity?.retailPrice || 0);
    const [netPrice, setNetPrice] = useState(item?.netPrice || activity?.netPrice || 0);
    const [image, setImage] = useState(item?.imageUrl || activity?.imageUrl || "");
    const [imageName, setImageName] = useState(item?.imageName || activity?.imageName || "");
    const [activeFormats, setActiveFormats] = useState<string[]>([]);
    const titleRef = useRef<HTMLDivElement>(null);
    const notesRef = useRef<HTMLDivElement>(null);
    const supplierNameRef = useRef<HTMLDivElement>(null);
    const supplierContactRef = useRef<HTMLDivElement>(null);
    const supplierUrlRef = useRef<HTMLDivElement>(null);
    const retailPriceRef = useRef<HTMLDivElement>(null);
    const netPriceRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null; // Do not render if isOpen is false

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
        updateActiveFormats();
    };

    // Get countries on mount
    useEffect(() => {
        const fetchCountries = async () => {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/items/countries`, {
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
                .then((data) => {
                    setCountries(data);
                })
                .catch(error => console.error("Error adding dates", error));
        }
        const fetchLocations = async () => {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/items/locations`, {
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
                    setLocations(data);
                })
                .catch(error => console.error("Error fetching locations", error));
        }
        fetchCountries();
        fetchLocations();
    }, []);

    // Add event listener for selection changes
    useEffect(() => {
        if (item || activity) {
            titleRef.current!.innerHTML = item ? item.name : activity!.name;
            notesRef.current!.innerHTML = item ? item.description : activity!.description;
            // Only set supplier ref innerHTML if the refs exist (when hasSupplier is true)
            if (supplierNameRef.current) {
                supplierNameRef.current.innerHTML = item?.supplierName ? item.supplierName ?? "" : activity?.supplierName ?? "";
            }
            if (supplierContactRef.current) {
                supplierContactRef.current.innerHTML = item?.supplierContact ? item.supplierContact ?? "" : activity?.supplierContact ?? "";
            }
            if (supplierUrlRef.current) {
                supplierUrlRef.current.innerHTML = item?.supplierUrl ? item.supplierUrl ?? "" : activity?.supplierUrl ?? "";
            }
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

    const addCountry = async () => {
        const newCountryInput = prompt("Enter new country:");
        if (newCountryInput === null) return; // User clicked cancel
        const newCountry = newCountryInput ? newCountryInput.trim().charAt(0).toUpperCase() + newCountryInput.trim().slice(1).toLowerCase() : "";
        if (newCountry && !countries.includes(newCountry)) {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/items/add/country/${newCountry}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                },
            })
                .then(async res => {
                    if (!res.ok)
                        throw new Error(`Request error: ${res.status}`);
                })
                .catch(error => { console.warn("Error saving new country. ", error) })
            setCountries([...countries, newCountry]);
        }
        else if (newCountryInput && countries.includes(newCountryInput.trim().charAt(0).toUpperCase() + newCountryInput.trim().slice(1).toLowerCase())) {
            window.alert("Country already exists.");
        }
        else {
            window.alert("Please enter country.");
        }
    }

    const addLocation = async () => {
        const newLocationInput = prompt("Enter new location:");
        if (newLocationInput === null) return;
        const newCountryInput = prompt("Enter already existing country for location:");
        if (newCountryInput === null) return;
        const newLocation = newLocationInput ? newLocationInput.trim().charAt(0).toUpperCase() + newLocationInput.trim().slice(1).toLowerCase() : "";
        const newCountry = newCountryInput ? newCountryInput.trim().charAt(0).toUpperCase() + newCountryInput.trim().slice(1).toLowerCase() : "";
        if (newLocation && !locations.includes(newLocation) && newCountry && countries.includes(newCountry)) {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/items/add/location/${newCountry}/${newLocation}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                },
            })
                .then(async res => {
                    if (!res.ok)
                        throw new Error(`Request error: ${res.status}`);
                })
                .catch(error => { console.warn("Error saving new location. ", error) })
            setLocations([...locations, newLocation]);
        }
        else if (newLocationInput && locations.includes(newLocationInput.trim().charAt(0).toUpperCase() + newLocationInput.trim().slice(1).toLowerCase())) {
            window.alert("Location already exists.");
        }
        else if (newCountryInput && !countries.includes(newCountryInput.trim().charAt(0).toUpperCase() + newCountryInput.trim().slice(1).toLowerCase())) {
            window.alert("Country does not exist. Please add the country first.");
        }
        else if (!newCountryInput || !newLocationInput) {
            window.alert("Please enter both country and location.");
        }
    }

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
                supplierName,
                supplierContact,
                supplierUrl,
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
                supplierName,
                supplierContact,
                supplierUrl,
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
                supplierName,
                supplierContact,
                supplierUrl,
                retailPrice,
                netPrice,
                imageName
            } as Item;
        }

        console.log(objectToSave);
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
                            <button
                                key="Add"
                                className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600"
                                onClick={() => addCountry()}
                            >
                                Add Country
                            </button>
                        </div>
                    </div>

                    {/* Location Row */}
                    <div className="modal-row">
                        <span className="modal-row-label">Location</span>
                        <div className="modal-row-content" style={{ display: "flex", alignItems: "center", gap: "1rem", position: "relative" }}>
                            <div style={{ position: "relative", minWidth: "200px" }}>
                                <input
                                    type="text"
                                    value={locationInput}
                                    onChange={(e) => {
                                        setLocationInput(e.target.value);
                                        setIsLocationDropdownOpen(true);
                                    }}
                                    onFocus={() => setIsLocationDropdownOpen(true)}
                                    onBlur={() => {
                                        setTimeout(() => {
                                            setIsLocationDropdownOpen(false);
                                            // Only reset if user isn't actively selecting from dropdown
                                            if (!isSelectingFromDropdown && !locations.includes(locationInput) && location) {
                                                setLocationInput(location);
                                            }
                                            setIsSelectingFromDropdown(false);
                                        }, 150);
                                    }}
                                    placeholder="Type to search locations..."
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${location && locations.includes(location)
                                        ? 'border-green-500 bg-green-50 focus:ring-green-500 text-green-700'
                                        : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                                        }`}
                                />
                                {location && locations.includes(location) && (
                                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 font-bold">
                                        ✓
                                    </span>
                                )}
                                {isLocationDropdownOpen && (
                                    <div
                                        className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                                        onMouseDown={() => setIsSelectingFromDropdown(true)}
                                        onMouseUp={() => setIsSelectingFromDropdown(false)}
                                    >
                                        {locations
                                            .filter(loc => loc.toLowerCase().includes(locationInput.toLowerCase()))
                                            .map((loc) => (
                                                <div
                                                    key={loc}
                                                    className={`px-3 py-2 cursor-pointer hover:bg-gray-100 flex justify-between items-center ${location === loc ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-blue-500' : ''
                                                        }`}
                                                    onClick={() => {
                                                        setLocation(loc);
                                                        setLocationInput(loc);
                                                        setIsLocationDropdownOpen(false);
                                                    }}
                                                >
                                                    <span>{loc}</span>
                                                    {location === loc && (
                                                        <span className="text-blue-500 font-bold">✓</span>
                                                    )}
                                                </div>
                                            ))}
                                        {locations.filter(loc => loc.toLowerCase().includes(locationInput.toLowerCase())).length === 0 && (
                                            <div className="px-3 py-2 text-gray-500 italic">
                                                No locations found
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <button
                                className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600"
                                onClick={() => addLocation()}
                            >
                                Add Location
                            </button>
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
                                onPaste={handlePaste}
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
                                onPaste={handlePaste}
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
                    {/* Supplier Check */}
                    <div className="modal-row">
                        <span className="modal-row-label">Has Supplier</span>
                        <div className="modal-row-content">
                            <input
                                type="checkbox"
                                checked={hasSupplier}
                                onChange={(e) => {
                                    setHasSupplier(e.target.checked);
                                    // Clear supplier fields if unchecked
                                    if (!e.target.checked) {
                                        setSupplierName("");
                                        setSupplierContact("");
                                        setSupplierUrl("");
                                        if (supplierNameRef.current) supplierNameRef.current.innerHTML = "";
                                        if (supplierContactRef.current) supplierContactRef.current.innerHTML = "";
                                        if (supplierUrlRef.current) supplierUrlRef.current.innerHTML = "";
                                    }
                                }}
                                className="mr-2"
                            />
                            <label>Has Supplier</label>
                        </div>
                    </div>

                    {/* Supplier Name Row */}
                    {hasSupplier && (
                        <div className="modal-row">
                            <span className="modal-row-label">Supplier Name</span>
                            <div className="modal-row-content">
                                <div
                                    ref={supplierNameRef}
                                    className="supplier-name-textarea"
                                    contentEditable
                                    suppressContentEditableWarning
                                    onInput={(e) => {
                                        setSupplierName((e.target as HTMLDivElement).innerHTML);
                                    }}
                                >
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Supplier Contact Row */}
                    {hasSupplier && (
                        <div className="modal-row">
                            <span className="modal-row-label">Supplier Contact</span>
                            <div className="modal-row-content">
                                <div
                                    ref={supplierContactRef}
                                    className="supplier-contact-textarea"
                                    contentEditable
                                    suppressContentEditableWarning
                                    onInput={(e) => {
                                        setSupplierContact((e.target as HTMLDivElement).innerHTML);
                                    }}
                                >
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Supplier URL Row */}
                    {hasSupplier && (
                        <div className="modal-row">
                            <span className="modal-row-label">Supplier URL</span>
                            <div className="modal-row-content">
                                <div
                                    ref={supplierUrlRef}
                                    className="supplier-url-textarea"
                                    contentEditable
                                    suppressContentEditableWarning
                                    onInput={(e) => {
                                        setSupplierUrl((e.target as HTMLDivElement).innerHTML);
                                    }}
                                >
                                </div>
                            </div>
                        </div>
                    )}
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