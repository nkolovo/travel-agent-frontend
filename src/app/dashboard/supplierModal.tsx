import React, { useState, useRef, useEffect } from "react";
import type { Supplier } from "./../itinerary/types/types";
import { FaTimes } from "react-icons/fa";
import "./../styles/itemModal.css";

interface ItemModalProps {
    isOpen: boolean; // Prop to control modal visibility
    closeModalSupplier?: (supplier?: Supplier) => void; // Function to close the modal
}

const SupplierModal: React.FC<ItemModalProps> = ({ isOpen, closeModalSupplier }) => {
    const [supplierInput, setSupplierInput] = useState("");
    const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
    const [isSelectingSupplierFromDropdown, setIsSelectingSupplierFromDropdown] = useState(false);
    const [supplierCompanies, setSupplierCompanies] = useState<string[]>([]);
    const [supplierCompany, setSupplierCompany] = useState<string | null>(null);
    const [isManualSupplierEntry, setIsManualSupplierEntry] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const supplierCompanyRef = useRef<HTMLDivElement>(null);
    const supplierNameRef = useRef<HTMLDivElement>(null);
    const supplierNumberRef = useRef<HTMLDivElement>(null);
    const supplierEmailRef = useRef<HTMLDivElement>(null);
    const supplierUrlRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null; // Do not render if isOpen is false

    // Fetch supplier companies when hasSupplier becomes true
    useEffect(() => {
        fetchSupplierCompanies();
    }, []);

    const addSupplier = async () => {
        if (isSaving) return;
        setIsSaving(true);
        const company = supplierInput.trim();
        if (company) {
            const supplierData = {
                company,
                name: supplierNameRef.current?.innerHTML || "",
                number: supplierNumberRef.current?.innerHTML || "",
                email: supplierEmailRef.current?.innerHTML || "",
                url: supplierUrlRef.current?.innerHTML || "",
                deleted: false
            };

            console.log(supplierData);

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
                    setSupplierCompanies([...supplierCompanies, company]);
                    setSupplierInput(company);
                    setSupplierCompany(company);
                })
                .catch(error => { 
                    console.warn("Error saving new supplier. ", error);
                    setIsSaving(false);
                })
            if (closeModalSupplier) {
                setShowSuccessToast(true);
                setTimeout(() => setShowSuccessToast(false), 3000);
                closeModalSupplier();
            }
        } else {
            setIsSaving(false);
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

    const toggleSupplierInputMode = () => {
        setIsManualSupplierEntry((prev) => {
            const next = !prev;
            if (next) {
                setIsSupplierDropdownOpen(false);
                setIsSelectingSupplierFromDropdown(false);
                setSupplierCompany(null);
                setSupplierInput("");
                if (supplierCompanyRef.current) supplierCompanyRef.current.innerHTML = "";
                if (supplierNameRef.current) supplierNameRef.current.innerHTML = "";
                if (supplierNumberRef.current) supplierNumberRef.current.innerHTML = "";
                if (supplierEmailRef.current) supplierEmailRef.current.innerHTML = "";
                if (supplierUrlRef.current) supplierUrlRef.current.innerHTML = "";
            }
            return next;
        });
    }

    return (
        <div className="modal-overlay" onClick={() => closeModalSupplier}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    {isManualSupplierEntry ?
                        <h2>Add Supplier</h2>
                        :
                        <h2>Edit Supplier</h2>
                    }
                    <FaTimes className="close-icon" onClick={() => (closeModalSupplier && closeModalSupplier())} />
                </div>

                <div className="modal-body">

                    {/* Supplier Company Row */}
                    <div className="modal-row">
                        <span className="modal-row-label">Supplier Company</span>
                        <div className="modal-row-content" style={{ display: "flex", alignItems: "center", gap: "1rem", position: "relative" }}>
                            <div style={{ position: "relative", minWidth: "200px" }}>
                                {isManualSupplierEntry ? (
                                    <input
                                        type="text"
                                        value={supplierInput}
                                        onChange={(e) => setSupplierInput(e.target.value)}
                                        placeholder="Enter supplier company..."
                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-500 focus:border-transparent"
                                    />
                                ) : (
                                    <>
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
                                    </>
                                )}
                            </div>
                            <button
                                className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600"
                                onClick={toggleSupplierInputMode}
                            >
                                {isManualSupplierEntry ? "Edit Supplier" : "Add Supplier"}
                            </button>
                        </div>
                    </div>
                    {/* Supplier Name Row */}
                    <div className="modal-row">
                        <span className="modal-row-label">Supplier Name</span>
                        <div className="modal-row-content">
                            <div
                                ref={supplierNameRef}
                                className="supplier-name-textarea"
                                contentEditable
                                suppressContentEditableWarning
                            >
                            </div>
                        </div>
                    </div>
                    {/* Supplier Number Row */}
                    <div className="modal-row">
                        <span className="modal-row-label">Supplier Number</span>
                        <div className="modal-row-content">
                            <div
                                ref={supplierNumberRef}
                                className="supplier-number-textarea"
                                contentEditable
                                suppressContentEditableWarning
                            >
                            </div>
                        </div>
                    </div>
                    {/* Supplier Email Row */}
                    <div className="modal-row">
                        <span className="modal-row-label">Supplier Email</span>
                        <div className="modal-row-content">
                            <div
                                ref={supplierEmailRef}
                                className="supplier-email-textarea"
                                contentEditable
                                suppressContentEditableWarning
                            >
                            </div>
                        </div>
                    </div>
                    {/* Supplier URL Row */}
                    <div className="modal-row">
                        <span className="modal-row-label">Supplier URL</span>
                        <div className="modal-row-content">
                            <div
                                ref={supplierUrlRef}
                                className="supplier-url-textarea"
                                contentEditable
                                suppressContentEditableWarning
                            >
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button 
                        className="modal-button-save" 
                        onClick={addSupplier}
                        disabled={isSaving}
                        style={{ opacity: isSaving ? 0.5 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }}
                    >
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button className="modal-button-close" onClick={() => (closeModalSupplier && closeModalSupplier())}>Close</button>
                </div>
            </div>
            {showSuccessToast && (
                <div className="toast-notification">
                    <span>✓ Supplier saved successfully</span>
                </div>
            )}
        </div>
    );
};

export default SupplierModal;