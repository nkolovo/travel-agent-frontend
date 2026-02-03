import React, { useState, useEffect } from "react";
import { FaTimes, FaEdit, FaTrash } from "react-icons/fa";
import { Traveler } from "../itinerary/types/types";
import "./../styles/itemModal.css";

interface TravelerModalProps {
    isOpen: boolean;
    closeModal?: (travelers?: Traveler[]) => void;
    itineraryId: number;
    travelers?: Traveler[];
}

const TravelerModal: React.FC<TravelerModalProps> = ({ isOpen, closeModal, itineraryId, travelers: initialTravelers }) => {
    const [travelers, setTravelers] = useState<Traveler[]>(initialTravelers || []);
    const [selectedTravelerId, setSelectedTravelerId] = useState<number | null>(null);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [passportNumber, setPassportNumber] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    // Fetch travelers when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchTravelers();
        }
    }, [isOpen]);

    const fetchTravelers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/itineraries/${itineraryId}/travelers`, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (res.ok) {
                const data = await res.json();
                setTravelers(data);
            }
        } catch (error) {
            console.warn("Error fetching travelers:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle traveler selection from dropdown
    const handleTravelerSelect = (travelerId: string) => {
        if (travelerId === "new") {
            // Clear form for new traveler
            setSelectedTravelerId(null);
            setFirstName("");
            setLastName("");
            setEmail("");
            setPhone("");
            setPassportNumber("");
        } else {
            // Load selected traveler data
            const id = parseInt(travelerId);
            const traveler = travelers.find(t => t.id === id);
            if (traveler) {
                setSelectedTravelerId(id);
                setFirstName(traveler.firstName || "");
                setLastName(traveler.lastName || "");
                setEmail(traveler.email || "");
                setPhone(traveler.phone || "");
                setPassportNumber(traveler.passportNumber || "");
            }
        }
    };

    if (!isOpen) return null; // Do not render if isOpen is false

    const saveTraveler = async () => {
        if (isSaving) return;

        // Validation
        if (firstName.trim() === "" || lastName.trim() === "") {
            window.alert("Please fill in first name and last name before saving.");
            return;
        }

        setIsSaving(true);

        const travelerData: Traveler = {
            id: selectedTravelerId || undefined,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim() || undefined,
            phone: phone.trim() || undefined,
            passportNumber: passportNumber.trim() || undefined,
        };

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/itineraries/${itineraryId}/traveler`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify(travelerData),
            })
                .then(async res => {
                    if (!res.ok)
                        throw new Error(`Request error: ${res.status}`);
                    const id = await res.json();
                    travelerData.id = id;
                })
                .catch(error => { console.warn("Error saving changes to traveler.", error) })

            // Update the travelers list locally
            setTravelers(prev => {
                const existingIndex = prev.findIndex(t => t.id === travelerData.id);
                if (existingIndex !== -1) {
                    // Update existing traveler
                    const updated = [...prev];
                    updated[existingIndex] = travelerData;
                    return updated;
                } else {
                    // Add new traveler
                    return [...prev, travelerData];
                }
            });

            // Clear form and reset to "Add New"
            setSelectedTravelerId(null);
            setFirstName("");
            setLastName("");
            setEmail("");
            setPhone("");
            setPassportNumber("");

        } catch (error) {
            console.warn("Error saving traveler:", error);
            window.alert("Failed to save traveler. Please try again.");
        } finally {
            setSuccessMessage("Traveler saved successfully");
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 5000);
            setIsSaving(false);
        }
    };

    const deleteTraveler = async (travelerId: number) => {
        if (!window.confirm("Are you sure you want to delete this traveler?")) {
            return;
        }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/itineraries/${itineraryId}/traveler/${travelerId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (!res.ok) {
                throw new Error(`Request error: ${res.status}`);
            }

            // Refresh the travelers list
            setTravelers(prev => prev.filter(t => t.id !== travelerId));

            // Clear form if the deleted traveler was selected
            if (selectedTravelerId === travelerId) {
                setSelectedTravelerId(null);
                setFirstName("");
                setLastName("");
                setEmail("");
                setPhone("");
                setPassportNumber("");
            }
            setSuccessMessage("Traveler deleted successfully");
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 5000);
        } catch (error) {
            console.warn("Error deleting traveler:", error);
            window.alert("Failed to delete traveler. Please try again.");
        }
    };

    const handleClose = () => {
        if (closeModal) {
            closeModal(travelers);
        }
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header">
                    <h2>Manage Travelers</h2>
                    <FaTimes className="close-icon" onClick={handleClose} />
                </div>

                <div className="modal-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {/* Traveler Selector Dropdown */}
                    <div className="modal-row">
                        <span className="modal-row-label">Select Traveler</span>
                        <div className="modal-row-content" style={{ flex: 1 }}>
                            <select
                                className="modal-input"
                                value={selectedTravelerId || "new"}
                                onChange={(e) => handleTravelerSelect(e.target.value)}
                                disabled={isLoading}
                                style={{ width: '100%' }}
                            >
                                <option value="new">+ Add New Traveler</option>
                                {travelers.map((traveler) => (
                                    <option key={traveler.id} value={traveler.id}>
                                        {traveler.firstName} {traveler.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* First Name Row */}
                    <div className="modal-row">
                        <span className="modal-row-label">First Name *</span>
                        <div className="modal-row-content" style={{ flex: 1 }}>
                            <input
                                type="text"
                                className="modal-input"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="Enter first name"
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>

                    {/* Last Name Row */}
                    <div className="modal-row">
                        <span className="modal-row-label">Last Name *</span>
                        <div className="modal-row-content" style={{ flex: 1 }}>
                            <input
                                type="text"
                                className="modal-input"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Enter last name"
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>

                    {/* Email Row */}
                    <div className="modal-row">
                        <span className="modal-row-label">Email</span>
                        <div className="modal-row-content" style={{ flex: 1 }}>
                            <input
                                type="email"
                                className="modal-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter email address"
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>

                    {/* Phone Row */}
                    <div className="modal-row">
                        <span className="modal-row-label">Phone</span>
                        <div className="modal-row-content" style={{ flex: 1 }}>
                            <input
                                type="tel"
                                className="modal-input"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Enter phone number"
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>

                    {/* Passport Number Row */}
                    <div className="modal-row">
                        <span className="modal-row-label">Passport Number</span>
                        <div className="modal-row-content" style={{ flex: 1 }}>
                            <input
                                type="text"
                                className="modal-input"
                                value={passportNumber}
                                onChange={(e) => setPassportNumber(e.target.value)}
                                placeholder="Enter passport number"
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                        <button
                            className="modal-button-save"
                            onClick={saveTraveler}
                            disabled={isSaving}
                            style={{
                                opacity: isSaving ? 0.5 : 1,
                                cursor: isSaving ? 'not-allowed' : 'pointer',
                                flex: 1
                            }}
                        >
                            {isSaving ? 'Saving...' : (selectedTravelerId ? 'Update' : 'Add')} Traveler
                        </button>
                    </div>

                    {/* Travelers List */}
                    {travelers.length > 0 && (
                        <>
                            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #ddd' }} />
                            <h3 style={{ marginBottom: '10px', fontSize: '16px', fontWeight: '600' }}>
                                All Travelers ({travelers.length})
                            </h3>
                            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                                {travelers.map((traveler) => (
                                    <div
                                        key={traveler.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '10px',
                                            marginBottom: '8px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            backgroundColor: selectedTravelerId === traveler.id ? '#b3d9ff' : 'white'
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '600' }}>
                                                {traveler.firstName} {traveler.lastName}
                                            </div>
                                            {(traveler.email || traveler.phone) && (
                                                <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                                                    {traveler.email && <span>{traveler.email}</span>}
                                                    {traveler.email && traveler.phone && <span> • </span>}
                                                    {traveler.phone && <span>{traveler.phone}</span>}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => handleTravelerSelect(traveler.id!.toString())}
                                                style={{
                                                    padding: '6px 10px',
                                                    border: '1px solid #007bff',
                                                    backgroundColor: 'white',
                                                    color: '#007bff',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}
                                                title="Edit traveler"
                                            >
                                                <FaEdit /> Edit
                                            </button>
                                            <button
                                                onClick={() => deleteTraveler(traveler.id!)}
                                                style={{
                                                    padding: '6px 10px',
                                                    border: '1px solid #dc3545',
                                                    backgroundColor: 'white',
                                                    color: '#dc3545',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}
                                                title="Delete traveler"
                                            >
                                                <FaTrash /> Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="modal-button-close" onClick={handleClose}>Close</button>
                </div>

                {showSuccessToast && (
                    <div className="toast-notification">
                        <span>✓ {successMessage}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TravelerModal;