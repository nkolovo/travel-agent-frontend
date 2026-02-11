import React, { useState, useRef, useEffect, act } from "react";
import type { Activity, Item } from "./types/types";
import { FaTimes, FaBold, FaItalic, FaLink } from "react-icons/fa";
import "./../styles/itemModal.css";
import { FiCamera, FiPaperclip, FiX } from "react-icons/fi";

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
    const [supplierInput, setSupplierInput] = useState(item?.supplierName || activity?.supplierName || "");
    const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
    const [isSelectingSupplierFromDropdown, setIsSelectingSupplierFromDropdown] = useState(false);
    const [category, setCategory] = useState(item?.category || activity?.category || "Activity");
    const [title, setTitle] = useState(item?.name || activity?.name || "");
    const [description, setDescription] = useState(item?.description || activity?.description || "");
    const [supplierCompanies, setSupplierCompanies] = useState<string[]>([]);
    const [supplierCompany, setSupplierCompany] = useState<string | null>(item?.supplierCompany || activity?.supplierCompany || null);
    const [supplierName, setSupplierName] = useState<string | null>(item?.supplierName || activity?.supplierName || null);
    const [supplierNumber, setSupplierNumber] = useState<string | null>(item?.supplierNumber || activity?.supplierNumber || null);
    const [supplierEmail, setSupplierEmail] = useState<string | null>(item?.supplierEmail || activity?.supplierEmail || null);
    const [supplierUrl, setSupplierUrl] = useState<string | null>(item?.supplierUrl || activity?.supplierUrl || null);
    const [hasSupplier, setHasSupplier] = useState<boolean>(
        Boolean(item?.supplierName || activity?.supplierName)
    );
    const [retailPrice, setRetailPrice] = useState(item?.retailPrice || activity?.retailPrice || 0);
    const [netPrice, setNetPrice] = useState(item?.netPrice || activity?.netPrice || 0);
    const [notes, setNotes] = useState(item?.notes || activity?.notes || "");
    const [pdfAttachment, setPdfAttachment] = useState<File | string | null>(null);
    const [pdfName, setPdfName] = useState<string>(activity?.pdfName || "");
    const [images, setImages] = useState<string[]>([]);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imageNames, setImageNames] = useState<string[]>(item?.imageNames || activity?.imageNames || []);
    const [activeTitleFormats, setActiveTitleFormats] = useState<string[]>([]);
    const [activeDescriptionFormats, setActiveDescriptionFormats] = useState<string[]>([]);
    const [activeNotesFormats, setActiveNotesFormats] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const titleRef = useRef<HTMLDivElement>(null);
    const descriptionRef = useRef<HTMLDivElement>(null);
    const supplierNameRef = useRef<HTMLDivElement>(null);
    const supplierNumberRef = useRef<HTMLDivElement>(null);
    const supplierEmailRef = useRef<HTMLDivElement>(null);
    const supplierUrlRef = useRef<HTMLDivElement>(null);
    const retailPriceRef = useRef<HTMLDivElement>(null);
    const netPriceRef = useRef<HTMLDivElement>(null);
    const notesRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null; // Do not render if isOpen is false

    const categories = ["Activity", "Lodging", "Flight", "Transportation", "Ferry", "Cruise", "Info"];

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
            case "fontSize":
                if (value) {
                    document.execCommand("fontSize", false, value);
                }
                break;
            case "foreColor":
                if (value) {
                    document.execCommand("foreColor", false, value);
                }
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

    // Helper function to normalize HTML content to use div tags consistently
    const normalizeHtml = (html: string): string => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        // Convert all <p> tags to <div> tags to match manual typing behavior
        const paragraphs = Array.from(tempDiv.querySelectorAll('p'));
        paragraphs.forEach(p => {
            const div = document.createElement('div');
            // Move all children from p to div
            while (p.firstChild) {
                div.appendChild(p.firstChild);
            }
            // If the div is empty or only contains whitespace, add a <br /> for proper spacing
            if (div.textContent?.trim() === '' && !div.querySelector('br')) {
                div.innerHTML = '<br />';
            }
            // Replace p with div
            p.parentNode?.replaceChild(div, p);
        });

        // Normalize <br> tags to <br />
        let cleanedHtml = tempDiv.innerHTML;
        cleanedHtml = cleanedHtml.replace(/<br>/g, '<br />');
        cleanedHtml = cleanedHtml.replace(/&amp;/g, '&#38;');

        return cleanedHtml;
    };

    // Helper function to clean pasted content while preserving basic formatting
    const cleanPastedContent = (html: string): string => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        // Remove all style attributes and unwanted attributes
        const allElements = Array.from(tempDiv.querySelectorAll('*'));
        allElements.forEach(element => {
            element.removeAttribute('style');
            element.removeAttribute('class');
            element.removeAttribute('id');
        });

        // Unwrap SPAN and FONT elements (preserve content but remove the tag)
        const spansAndFonts = Array.from(tempDiv.querySelectorAll('span, font'));
        spansAndFonts.forEach(element => {
            const parent = element.parentNode;
            while (element.firstChild) {
                parent?.insertBefore(element.firstChild, element);
            }
            parent?.removeChild(element);
        });

        // Apply normalization to convert p tags to div tags
        return normalizeHtml(tempDiv.innerHTML);
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
        if (activeElement === titleRef.current) {
            updateActiveFormats(setActiveTitleFormats);
        } else if (activeElement === descriptionRef.current) {
            updateActiveFormats(setActiveDescriptionFormats);
        } else if (activeElement === notesRef.current) {
            updateActiveFormats(setActiveNotesFormats);
        }
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

    // Fetch supplier companies when hasSupplier becomes true
    useEffect(() => {
        if (hasSupplier) {
            fetchSupplierCompanies();
        }
    }, [hasSupplier]);

    // Add event listener for selection changes
    useEffect(() => {
        if (item || activity) {
            titleRef.current!.innerHTML = item ? item.name : activity!.name;
            descriptionRef.current!.innerHTML = item ? item.description : activity!.description;
            // Set supplier input for dropdown
            const existingSupplierCompany = item?.supplierCompany || activity?.supplierCompany || "";
            setSupplierInput(existingSupplierCompany);
            // Only set supplier ref innerHTML if the refs exist (when hasSupplier is true)
            if (supplierNameRef.current) {
                supplierNameRef.current.innerHTML = item?.supplierName ? item.supplierName ?? "" : activity?.supplierName ?? "";
            }
            if (supplierNumberRef.current) {
                supplierNumberRef.current.innerHTML = item?.supplierNumber ? item.supplierNumber ?? "" : activity?.supplierNumber ?? "";
            }
            if (supplierEmailRef.current) {
                supplierEmailRef.current.innerHTML = item?.supplierEmail ? item.supplierEmail ?? "" : activity?.supplierEmail ?? "";
            }
            if (supplierUrlRef.current) {
                supplierUrlRef.current.innerHTML = item?.supplierUrl ? item.supplierUrl ?? "" : activity?.supplierUrl ?? "";
            }
            retailPriceRef.current!.innerHTML = String(item ? item.retailPrice ?? "0" : activity?.retailPrice ?? "0");
            netPriceRef.current!.innerHTML = String(item ? item.netPrice ?? "0" : activity?.netPrice ?? "0");
            if (activity?.pdfName)
                loadPdfFromGCS();
            if (item?.imageNames || activity?.imageNames)
                loadImagesFromGCS();
            notesRef.current!.innerHTML = item ? item.notes ?? "" : activity?.notes ?? "";
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

    const addSupplier = async () => {
        const newSupplierCompanyInput = prompt("Enter supplier company:");
        if (newSupplierCompanyInput === null) return;
        const newSupplierNameInput = prompt("Enter supplier contact name:");
        const newSupplierNumberInput = prompt("Enter supplier contact number:");
        const newSupplierEmailInput = prompt("Enter supplier contact email:");
        const newSupplierUrlInput = prompt("Enter supplier URL:");
        const newSupplierCompany = newSupplierCompanyInput ? newSupplierCompanyInput.trim() : "";
        const newSupplierName = newSupplierNameInput ? newSupplierNameInput.trim() : "";
        const newSupplierNumber = newSupplierNumberInput ? newSupplierNumberInput.trim() : "";
        const newSupplierEmail = newSupplierEmailInput ? newSupplierEmailInput.trim() : "";
        const newSupplierUrl = newSupplierUrlInput ? newSupplierUrlInput.trim() : "";

        if (newSupplierCompany) {
            const supplierData = {
                company: newSupplierCompany,
                name: newSupplierName,
                number: newSupplierNumber,
                email: newSupplierEmail,
                url: newSupplierUrl,
                deleted: false
            };

            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/suppliers/save`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify(supplierData),
            })
                .then(async res => {
                    if (!res.ok)
                        throw new Error(`Request error: ${res.status}`);
                    setSupplierCompanies([...supplierCompanies, newSupplierCompany]);
                    setSupplierInput(newSupplierCompany);
                    setSupplierCompany(newSupplierCompany);
                    setSupplierName(newSupplierName);
                    supplierNameRef.current!.innerHTML = newSupplierName;
                    setSupplierNumber(newSupplierNumber);
                    supplierNumberRef.current!.innerHTML = newSupplierNumber;
                    setSupplierEmail(newSupplierEmail);
                    supplierEmailRef.current!.innerHTML = newSupplierEmail;
                    setSupplierUrl(newSupplierUrl);
                    supplierUrlRef.current!.innerHTML = newSupplierUrl;
                })
                .catch(error => { console.warn("Error saving new supplier. ", error) })
        } else {
            window.alert("Please enter at least the supplier company.");
        }
    }

    const fetchSupplierCompanies = async () => {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/suppliers/all-companies`, {
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
                setSupplierCompanies(data);
            })
            .catch(error => console.error("Error fetching supplier companies", error));
    }

    const fetchFullSupplierDetails = async (company: string) => {
        setSupplierCompany(company);
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/suppliers/company/${company}`, {
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
            .then(supplier => {
                setSupplierName(supplier.name);
                setSupplierNumber(supplier.number);
                setSupplierEmail(supplier.email);
                setSupplierUrl(supplier.url);
                // Update the contentEditable divs
                if (supplierNameRef.current) {
                    supplierNameRef.current.innerHTML = supplier.name;
                }
                if (supplierNumberRef.current) {
                    supplierNumberRef.current.innerHTML = supplier.number;
                }
                if (supplierEmailRef.current) {
                    supplierEmailRef.current.innerHTML = supplier.email;
                }
                if (supplierUrlRef.current) {
                    supplierUrlRef.current.innerHTML = supplier.url;
                }
            })
            .catch(error => console.error("Error fetching supplier details", error));
    }

    const handleSupplierSelection = async (selectedSupplierCompany: string) => {
        setSupplierInput(selectedSupplierCompany);
        setSupplierCompany(selectedSupplierCompany);
        setIsSupplierDropdownOpen(false);
        await fetchFullSupplierDetails(selectedSupplierCompany);
    }

    const saveItem = async () => {
        if (isSaving) return;
        if (!country || !location || !category || !title || !description) {
            window.alert("Please fill in at least country, location, category, title, and description before saving.");
            return;
        }
        setIsSaving(true);

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
                supplierCompany,
                supplierName,
                supplierNumber,
                supplierEmail,
                supplierUrl,
                retailPrice,
                netPrice,
                notes,
                imageNames
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
                supplierCompany,
                supplierName,
                supplierNumber,
                supplierEmail,
                supplierUrl,
                retailPrice,
                netPrice,
                notes,
                pdfName,
                imageNames
            } as Activity;
        } else {
            objectToSave = {
                country,
                location,
                category,
                name: title,
                description,
                supplierCompany,
                supplierName,
                supplierNumber,
                supplierEmail,
                supplierUrl,
                retailPrice,
                netPrice,
                notes,
                imageNames
            } as Item;
        }

        if (isActivity) {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dates/saveDateItem`, {
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
        }
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

        // Upload PDF attachment to backend (only if it's a new File, not an existing URL)
        if (pdfAttachment && pdfAttachment instanceof File) {
            const formData = new FormData();
            formData.append("file", pdfAttachment);

            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/date-items/upload-pdf`,
                    {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${localStorage.getItem("token")}`,
                        },
                        body: formData,
                    }
                );
                if (!response.ok) throw new Error("Could not save PDF");
            } catch (error) {
                console.error("Error uploading PDF:", error);
            }
        }

        // Upload new images to backend (send all files at once)
        if (imageFiles.length > 0) {
            const formData = new FormData();

            // Append all files with the same key name for array handling
            imageFiles.forEach((file, index) => {
                formData.append("files", file);
            });

            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/images/upload-images`,
                    {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${localStorage.getItem("token")}`,
                        },
                        body: formData,
                    }
                );
                if (!response.ok) throw new Error("Could not save images");
            } catch (error) {
                console.error("Error uploading images:", error);
            }
        }

        if (closeModalItem) {
            closeModalItem(objectToSave as Item);
        }
        else if (closeModalActivity) {
            closeModalActivity(objectToSave as Activity);
        }
        setIsSaving(false);
    }

    const handlePdfUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type === "application/pdf") {
            setPdfAttachment(file);
            setPdfName(file.name);
        } else if (file) {
            window.alert("Please select a valid PDF file.");
        }
    }

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            const newFiles: File[] = [];
            const newImages: string[] = [];
            const newImageNames: string[] = [];

            // Process all selected files
            Array.from(files).forEach((file) => {
                newFiles.push(file);
                newImageNames.push(file.name);

                // Create base64 string for display
                const reader = new FileReader();
                reader.onloadend = () => {
                    newImages.push(reader.result as string);
                    // Update state only after all files are processed
                    if (newImages.length === files.length) {
                        setImageFiles(prev => [...prev, ...newFiles]);
                        setImages(prev => [...prev, ...newImages]);
                        setImageNames(prev => [...prev, ...newImageNames]);
                    }
                };
                reader.readAsDataURL(file);
            });
        }
    }

    const handleRemoveImage = (indexToRemove: number) => {
        setImages(prev => prev.filter((_, index) => index !== indexToRemove));
        setImageNames(prev => {
            const imageNameToRemove = prev[indexToRemove];
            if (imageNameToRemove) {
                setImageFiles(existingFiles => existingFiles.filter(file => file.name !== imageNameToRemove));
            }
            return prev.filter((_, index) => index !== indexToRemove);
        });
    }

    const loadPdfFromGCS = async () => {
        const pdfNameToLoad = activity ? activity.pdfName : "";
        if (!pdfNameToLoad) return;
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/date-items/signed-url/${pdfNameToLoad}`, {
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
                setPdfAttachment(signedUrl);
            })
            .catch(error => { console.warn(), console.warn("Error retrieving the pdf. ", error) })
    }

    const loadImagesFromGCS = async () => {
        const imageNames = item ? item.imageNames : activity ? activity.imageNames : [];
        if (imageNames!.length === 0) return;
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/images/multiple-signed-urls`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(imageNames),
        })
            .then(res => {
                if (!res.ok)
                    throw new Error(`Request error: ${res.status}`);
                return res.json();
            })
            .then(signedUrls => {
                setImages([...images, ...signedUrls]);
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
                            <div className="title-toolbar">
                                <select
                                    onChange={(e) => handleFormat("fontSize", titleRef, setActiveTitleFormats, e.target.value)}
                                    style={{ margin: "0 4px", padding: "2px" }}
                                    title="Font Size"
                                >
                                    <option value="">Size</option>
                                    <option value="1">Small</option>
                                    <option value="3">Normal</option>
                                    <option value="5">Large</option>
                                    <option value="7">Huge</option>
                                </select>
                                <input
                                    type="color"
                                    onChange={(e) => handleFormat("foreColor", titleRef, setActiveTitleFormats, e.target.value)}
                                    style={{ margin: "0 4px", width: "40px", height: "24px", cursor: "pointer" }}
                                    title="Font Color"
                                />
                                <button
                                    className={activeTitleFormats.includes("bold") ? "active" : ""}
                                    onClick={() => handleFormat("bold", titleRef, setActiveTitleFormats)}
                                >
                                    <FaBold />
                                </button>
                                <button
                                    className={activeTitleFormats.includes("italic") ? "active" : ""}
                                    onClick={() => handleFormat("italic", titleRef, setActiveTitleFormats)}
                                >
                                    <FaItalic />
                                </button>
                                <button
                                    className={activeTitleFormats.includes("underline") ? "active" : ""}
                                    onClick={() => handleFormat("underline", titleRef, setActiveTitleFormats)}
                                >
                                    <u>U</u>
                                </button>
                                <button
                                    className={activeTitleFormats.includes("strikeThrough") ? "active" : ""}
                                    onClick={() => handleFormat("strikeThrough", titleRef, setActiveTitleFormats)}
                                >
                                    <s>abc</s>
                                </button>
                                <button
                                    className={activeTitleFormats.includes("createLink") ? "active" : ""}
                                    onClick={() => handleFormat("createLink", titleRef, setActiveTitleFormats, prompt("Enter URL") || "")}
                                >
                                    <FaLink />
                                </button>
                                <button
                                    className="highlight-red"
                                    onClick={() => handleFormat("highlight", titleRef, setActiveTitleFormats, "#ffcccc")}
                                    style={{ backgroundColor: "#ffcccc", border: "1px solid #ccc", margin: "0 2px" }}
                                    title="Red Highlight"
                                >
                                    Red
                                </button>
                                <button
                                    className="highlight-yellow"
                                    onClick={() => handleFormat("highlight", titleRef, setActiveTitleFormats, "#ffff99")}
                                    style={{ backgroundColor: "#ffff99", border: "1px solid #ccc", margin: "0 2px" }}
                                    title="Yellow Highlight"
                                >
                                    Yellow
                                </button>
                                <button
                                    className="highlight-blue"
                                    onClick={() => handleFormat("highlight", titleRef, setActiveTitleFormats, "#cce5ff")}
                                    style={{ backgroundColor: "#cce5ff", border: "1px solid #ccc", margin: "0 2px" }}
                                    title="Blue Highlight"
                                >
                                    Blue
                                </button>
                                <button
                                    className="remove-highlight"
                                    onClick={() => handleFormat("removeHighlight", titleRef, setActiveTitleFormats)}
                                    style={{ border: "1px solid #ccc", margin: "0 2px" }}
                                    title="Remove Highlight"
                                >
                                    Remove
                                </button>
                            </div>
                            <div
                                ref={titleRef}
                                className="title-textarea"
                                contentEditable
                                suppressContentEditableWarning
                                onPaste={handlePaste}
                                onInput={(e) => {
                                    // Update the state with the current content
                                    let html = (e.target as HTMLDivElement).innerHTML;
                                    html = normalizeHtml(html);
                                    setTitle(html);
                                }}
                            >
                            </div>
                        </div>
                    </div>
                    {/* Description Row */}
                    <div className="modal-row">
                        <span className="modal-row-label">Description</span>
                        <div className="modal-row-content">
                            <div className="description-toolbar">
                                <select
                                    onChange={(e) => handleFormat("fontSize", descriptionRef, setActiveDescriptionFormats, e.target.value)}
                                    style={{ margin: "0 4px", padding: "2px" }}
                                    title="Font Size"
                                >
                                    <option value="">Size</option>
                                    <option value="1">Small</option>
                                    <option value="3">Normal</option>
                                    <option value="5">Large</option>
                                    <option value="7">Huge</option>
                                </select>
                                <input
                                    type="color"
                                    onChange={(e) => handleFormat("foreColor", descriptionRef, setActiveDescriptionFormats, e.target.value)}
                                    style={{ margin: "0 4px", width: "40px", height: "24px", cursor: "pointer" }}
                                    title="Font Color"
                                />
                                <button
                                    className={activeDescriptionFormats.includes("bold") ? "active" : ""}
                                    onClick={() => handleFormat("bold", descriptionRef, setActiveDescriptionFormats)}
                                >
                                    <FaBold />
                                </button>
                                <button
                                    className={activeDescriptionFormats.includes("italic") ? "active" : ""}
                                    onClick={() => handleFormat("italic", descriptionRef, setActiveDescriptionFormats)}
                                >
                                    <FaItalic />
                                </button>
                                <button
                                    className={activeDescriptionFormats.includes("underline") ? "active" : ""}
                                    onClick={() => handleFormat("underline", descriptionRef, setActiveDescriptionFormats)}
                                >
                                    <u>U</u>
                                </button>
                                <button
                                    className={activeDescriptionFormats.includes("strikeThrough") ? "active" : ""}
                                    onClick={() => handleFormat("strikeThrough", descriptionRef, setActiveDescriptionFormats)}
                                >
                                    <s>abc</s>
                                </button>
                                <button
                                    className={activeDescriptionFormats.includes("createLink") ? "active" : ""}
                                    onClick={() => handleFormat("createLink", descriptionRef, setActiveDescriptionFormats, prompt("Enter URL") || "")}
                                >
                                    <FaLink />
                                </button>
                                <button
                                    className="highlight-red"
                                    onClick={() => handleFormat("highlight", descriptionRef, setActiveDescriptionFormats, "#ffcccc")}
                                    style={{ backgroundColor: "#ffcccc", border: "1px solid #ccc", margin: "0 2px" }}
                                    title="Red Highlight"
                                >
                                    Red
                                </button>
                                <button
                                    className="highlight-yellow"
                                    onClick={() => handleFormat("highlight", descriptionRef, setActiveDescriptionFormats, "#ffff99")}
                                    style={{ backgroundColor: "#ffff99", border: "1px solid #ccc", margin: "0 2px" }}
                                    title="Yellow Highlight"
                                >
                                    Yellow
                                </button>
                                <button
                                    className="highlight-blue"
                                    onClick={() => handleFormat("highlight", descriptionRef, setActiveDescriptionFormats, "#cce5ff")}
                                    style={{ backgroundColor: "#cce5ff", border: "1px solid #ccc", margin: "0 2px" }}
                                    title="Blue Highlight"
                                >
                                    Blue
                                </button>
                                <button
                                    className="remove-highlight"
                                    onClick={() => handleFormat("removeHighlight", descriptionRef, setActiveDescriptionFormats)}
                                    style={{ border: "1px solid #ccc", margin: "0 2px" }}
                                    title="Remove Highlight"
                                >
                                    Remove
                                </button>
                            </div>
                            <div
                                ref={descriptionRef}
                                className="description-textarea"
                                contentEditable
                                suppressContentEditableWarning
                                onPaste={handlePaste}
                                onInput={(e) => {
                                    // Get the HTML content
                                    let html = (e.target as HTMLDivElement).innerHTML;
                                    html = normalizeHtml(html);
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
                                        setSupplierCompany("");
                                        setSupplierInput("");
                                        setSupplierName("");
                                        setSupplierNumber("");
                                        setSupplierEmail("");
                                        setSupplierUrl("");
                                        if (supplierNameRef.current) supplierNameRef.current.innerHTML = "";
                                        if (supplierNumberRef.current) supplierNumberRef.current.innerHTML = "";
                                        if (supplierEmailRef.current) supplierEmailRef.current.innerHTML = "";
                                        if (supplierUrlRef.current) supplierUrlRef.current.innerHTML = "";
                                    }
                                }}
                                className="mr-2"
                            />
                            <label>Has Supplier</label>
                        </div>
                    </div>
                    {/* Supplier Company Row */}
                    {hasSupplier && (
                        <div className="modal-row">
                            <span className="modal-row-label">Supplier Company</span>
                            <div className="modal-row-content" style={{ display: "flex", alignItems: "center", gap: "1rem", position: "relative" }}>
                                <div style={{ position: "relative", minWidth: "200px" }}>
                                    <input
                                        type="text"
                                        value={supplierInput}
                                        onChange={(e) => {
                                            setSupplierInput(e.target.value);
                                            setIsSupplierDropdownOpen(true);
                                        }}
                                        onFocus={() => setIsSupplierDropdownOpen(true)}
                                        onBlur={() => {
                                            setTimeout(() => {
                                                setIsSupplierDropdownOpen(false);
                                                // Only reset if user isn't actively selecting from dropdown
                                                if (!isSelectingSupplierFromDropdown && supplierCompanies && !supplierCompanies.includes(supplierInput) && supplierCompany) {
                                                    setSupplierInput(supplierCompany);
                                                }
                                                setIsSelectingSupplierFromDropdown(false);
                                            }, 150);
                                        }}
                                        placeholder="Type to search suppliers..."
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${supplierCompany && supplierCompanies && supplierCompanies.includes(supplierCompany)
                                            ? 'border-green-500 bg-green-50 focus:ring-green-500 text-green-700'
                                            : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                                            }`}
                                    />
                                    {supplierCompany && supplierCompanies && supplierCompanies.includes(supplierCompany) && (
                                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 font-bold">
                                            ✓
                                        </span>
                                    )}
                                    {isSupplierDropdownOpen && supplierCompanies && (
                                        <div
                                            className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                                            onMouseDown={() => setIsSelectingSupplierFromDropdown(true)}
                                            onMouseUp={() => setIsSelectingSupplierFromDropdown(false)}
                                        >
                                            {supplierCompanies
                                                .filter(supplier => supplier.toLowerCase().includes(supplierInput.toLowerCase()))
                                                .map((supplier) => (
                                                    <div
                                                        key={supplier}
                                                        className={`px-3 py-2 cursor-pointer hover:bg-gray-100 flex justify-between items-center ${supplierCompany === supplier ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-blue-500' : ''
                                                            }`}
                                                        onClick={() => handleSupplierSelection(supplier)}
                                                    >
                                                        <span>{supplier}</span>
                                                        {supplierCompany === supplier && (
                                                            <span className="text-blue-500 font-bold">✓</span>
                                                        )}
                                                    </div>
                                                ))}
                                            {supplierCompanies.filter(supplier => supplier.toLowerCase().includes(supplierInput.toLowerCase())).length === 0 && (
                                                <div className="px-3 py-2 text-gray-500 italic">
                                                    No suppliers found
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <button
                                    className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600"
                                    onClick={() => addSupplier()}
                                >
                                    Add Supplier
                                </button>
                            </div>
                        </div>
                    )}
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
                    {/* Supplier Number Row */}
                    {hasSupplier && (
                        <div className="modal-row">
                            <span className="modal-row-label">Supplier Number</span>
                            <div className="modal-row-content">
                                <div
                                    ref={supplierNumberRef}
                                    className="supplier-number-textarea"
                                    contentEditable
                                    suppressContentEditableWarning
                                    onInput={(e) => {
                                        setSupplierNumber((e.target as HTMLDivElement).innerHTML);
                                    }}
                                >
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Supplier Email Row */}
                    {hasSupplier && (
                        <div className="modal-row">
                            <span className="modal-row-label">Supplier Email</span>
                            <div className="modal-row-content">
                                <div
                                    ref={supplierEmailRef}
                                    className="supplier-email-textarea"
                                    contentEditable
                                    suppressContentEditableWarning
                                    onInput={(e) => {
                                        setSupplierEmail((e.target as HTMLDivElement).innerHTML);
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
                    {/* Notes Row */}
                    <div className="modal-row">
                        <span className="modal-row-label">Notes</span>
                        <div className="modal-row-content">
                            <div className="notes-toolbar">
                                <button
                                    className={activeNotesFormats.includes("bold") ? "active" : ""}
                                    onClick={() => handleFormat("bold", notesRef, setActiveNotesFormats)}
                                >
                                    <FaBold />
                                </button>
                                <button
                                    className={activeNotesFormats.includes("italic") ? "active" : ""}
                                    onClick={() => handleFormat("italic", notesRef, setActiveNotesFormats)}
                                >
                                    <FaItalic />
                                </button>
                                <button
                                    className={activeNotesFormats.includes("underline") ? "active" : ""}
                                    onClick={() => handleFormat("underline", notesRef, setActiveNotesFormats)}
                                >
                                    <u>U</u>
                                </button>
                                <button
                                    className={activeNotesFormats.includes("strikeThrough") ? "active" : ""}
                                    onClick={() => handleFormat("strikeThrough", notesRef, setActiveNotesFormats)}
                                >
                                    <s>abc</s>
                                </button>
                                <button
                                    className={activeNotesFormats.includes("createLink") ? "active" : ""}
                                    onClick={() => handleFormat("createLink", notesRef, setActiveNotesFormats, prompt("Enter URL") || "")}
                                >
                                    <FaLink />
                                </button>
                                <button
                                    className="highlight-red"
                                    onClick={() => handleFormat("highlight", notesRef, setActiveNotesFormats, "#ffcccc")}
                                    style={{ backgroundColor: "#ffcccc", border: "1px solid #ccc", margin: "0 2px" }}
                                    title="Red Highlight"
                                >
                                    Red
                                </button>
                                <button
                                    className="highlight-yellow"
                                    onClick={() => handleFormat("highlight", notesRef, setActiveNotesFormats, "#ffff99")}
                                    style={{ backgroundColor: "#ffff99", border: "1px solid #ccc", margin: "0 2px" }}
                                    title="Yellow Highlight"
                                >
                                    Yellow
                                </button>
                                <button
                                    className="highlight-blue"
                                    onClick={() => handleFormat("highlight", notesRef, setActiveNotesFormats, "#cce5ff")}
                                    style={{ backgroundColor: "#cce5ff", border: "1px solid #ccc", margin: "0 2px" }}
                                    title="Blue Highlight"
                                >
                                    Blue
                                </button>
                                <button
                                    className="remove-highlight"
                                    onClick={() => handleFormat("removeHighlight", notesRef, setActiveNotesFormats)}
                                    style={{ border: "1px solid #ccc", margin: "0 2px" }}
                                    title="Remove Highlight"
                                >
                                    Remove
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
                                    html = normalizeHtml(html);
                                    setNotes(html);
                                }}
                            >
                            </div>
                        </div>
                    </div>
                    {/* PDF Attachment Row */}
                    {activity && (
                        <div className="modal-row">
                            <span className="modal-row-label">PDF Attachment</span>
                            <div
                                className="modal-row-content"
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "flex-start",
                                    gap: "1rem"
                                }}
                            >
                                {/* Upload PDF Button */}
                                <button
                                    onClick={() => document.getElementById("pdf-input")?.click()}
                                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center gap-2"
                                >
                                    <FiPaperclip className="text-lg" /> {pdfAttachment || pdfName ? "Change PDF" : "Upload PDF"}
                                </button>

                                {/* Hidden File Input */}
                                <input
                                    id="pdf-input"
                                    type="file"
                                    accept="application/pdf"
                                    className="hidden"
                                    onChange={handlePdfUpload}
                                />

                                {/* Display current PDF if exists */}
                                {(pdfAttachment || pdfName) && (
                                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                                        📄
                                        {/* Make filename clickable if we have a URL */}
                                        {pdfAttachment && typeof pdfAttachment === 'string' ? (
                                            <a
                                                href={pdfAttachment}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-500 hover:text-blue-700 text-sm underline"
                                            >
                                                {pdfName || "PDF File"}
                                            </a>
                                        ) : (
                                            <span className="text-sm text-gray-700">
                                                {pdfName || (pdfAttachment instanceof File ? pdfAttachment.name : "PDF Attached")}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
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
                                multiple
                                className="hidden"
                                onChange={handleImageUpload}
                            />
                            {/* Show all images below the button if they exist */}
                            {images.length > 0 && (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                                    {images.map((image, index) => (
                                        <div
                                            key={index}
                                            style={{ position: "relative", display: "inline-block" }}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(index)}
                                                aria-label={`Remove image ${index + 1}`}
                                                title="Remove image"
                                                style={{
                                                    position: "absolute",
                                                    top: "6px",
                                                    right: "6px",
                                                    width: "28px",
                                                    height: "28px",
                                                    borderRadius: "9999px",
                                                    background: "rgba(0, 0, 0, 0.6)",
                                                    color: "#fff",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    zIndex: 1
                                                }}
                                            >
                                                <FiX />
                                            </button>
                                            <img
                                                src={image}
                                                alt={`Item ${index + 1}`}
                                                style={{ maxWidth: "400px", maxHeight: "400px", borderRadius: "8px" }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button
                        className="modal-button-save"
                        onClick={saveItem}
                        disabled={isSaving}
                        style={{ opacity: isSaving ? 0.5 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }}
                    >
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button className="modal-button-close" onClick={() => (closeModalItem && closeModalItem()) || (closeModalActivity && closeModalActivity())}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default ItemModal;