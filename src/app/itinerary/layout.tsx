"use client";

import { ReactNode, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation"; // Import useSearchParams
import { HiArrowNarrowLeft } from "react-icons/hi";
import { HiDocumentText, HiEye, HiPaperAirplane } from "react-icons/hi"; // Import new icons

export default function ItineraryLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams(); // Get query params from the URL
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isPreviewingPdf, setIsPreviewingPdf] = useState(false);

    // Define a mapping of query parameter keys to custom display names
    const customNames: Record<string, string> = {
        agent: "Agent",
        createdDate: "Created",
        reservationNumber: "Res. Num",
        leadName: "Lead Name",
        numTravelers: "Persons"
    };

    // Convert query parameters to a readable format with custom keys
    const queryParams = Array.from(searchParams.entries()).map(([key, value]) => {
        if (key == 'id')
            return
        const customKey = customNames[key] || key; // Use custom name if available, otherwise fallback to original key

        // Format createdDate from YYYY-MM-DD to Month Day, Year
        let displayValue = value;
        if (key === 'createdDate' && value) {
            try {
                const date = new Date(value);
                displayValue = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            } catch (error) {
                // If date parsing fails, keep original value
                displayValue = value;
            }
        }

        return (
            <div key={key} className="flex items-center space-x-2">
                <strong>{customKey}:</strong> <span>{displayValue}</span>
            </div>
        );
    });

    function previewItinerary(): void {
        const itineraryId = params.id;
        if (!itineraryId) {
            console.warn("No itinerary id found");
            return;
        }

        setIsPreviewingPdf(true);

        // Open window immediately to avoid popup blocker
        const newWindow = window.open('', '_blank');
        if (!newWindow) {
            alert('Please allow popups for this site to preview PDFs');
            setIsPreviewingPdf(false);
            return;
        }

        // Write loading message to the new window
        newWindow.document.write(`
            <html>
                <head>
                    <title>Generating PDF...</title>
                    <style>
                        body {
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            margin: 0;
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            background: #f5f5f5;
                        }
                        .loader {
                            text-align: center;
                        }
                        .spinner {
                            border: 4px solid #f3f3f3;
                            border-top: 4px solid #3b82f6;
                            border-radius: 50%;
                            width: 50px;
                            height: 50px;
                            animation: spin 1s linear infinite;
                            margin: 0 auto 20px;
                        }
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                        h2 { color: #333; margin: 0; }
                        p { color: #666; margin-top: 10px; }
                    </style>
                </head>
                <body>
                    <div class="loader">
                        <div class="spinner"></div>
                        <h2>Generating PDF...</h2>
                        <p>Please wait while we prepare your itinerary</p>
                    </div>
                </body>
            </html>
        `);

        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/itineraries/generate-pdf/${itineraryId}?preview=true`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
            }
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error('Failed to generate PDF');
                }
                return res.blob();
            })
            .then(blob => {
                // Logic for previewing the PDF
                const url = window.URL.createObjectURL(blob);
                newWindow.location.href = url;
                // Delay revocation to allow the new tab to load the PDF
                setTimeout(() => window.URL.revokeObjectURL(url), 1000);
            })
            .catch(error => {
                console.error('Error previewing PDF:', error);
                newWindow.close();
                alert('Failed to generate PDF. Please try again.');
            })
            .finally(() => {
                setIsPreviewingPdf(false);
            });
    }

    function generatePdf(): void {
        const itineraryId = params.id;
        if (!itineraryId) {
            console.warn("No itinerary id found");
            return;
        }

        setIsGeneratingPdf(true);

        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/itineraries/generate-pdf/${itineraryId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
            }
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error('Failed to generate PDF');
                }
                return res.blob();
            })
            .then(blob => {
                // Logic for downloading the PDF
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `itinerary_${itineraryId}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            })
            .catch(error => {
                console.error('Error generating PDF:', error);
                alert('Failed to generate PDF. Please try again.');
            })
            .finally(() => {
                setIsGeneratingPdf(false);
            });
    }

    async function sendItineraryToLead(): Promise<void> {
        const itineraryId = params.id;
        if (!itineraryId) {
            console.warn("No itinerary id found");
            return;
        }

        try {
            // Show loading state
            const sendButton = document.querySelector('[title="Send to lead"]') as HTMLButtonElement;
            if (sendButton) {
                sendButton.disabled = true;
                sendButton.classList.add('cursor-not-allowed', 'text-blue-500');
            }

            // Generate a shareable PDF URL
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/itineraries/generate-shareable-link/${itineraryId}`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("token")}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to generate shareable link');
            }

            const data = await response.json();
            const shareableUrl = data.shareableUrl;

            // Get travelers to find lead email
            const travelersResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/itineraries/${itineraryId}/travelers`,
                {
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            let leadEmail = '';
            const leadNameParam = searchParams.get('leadName') || '';

            if (travelersResponse.ok) {
                const travelers = await travelersResponse.json();

                // Parse lead name format: "Last Name / First Name, Middle name"
                // Match against travelers with lastName and firstName (which includes middle name)
                if (leadNameParam && travelers.length > 0) {
                    const leadParts = leadNameParam.split(' / ');
                    if (leadParts.length === 2) {
                        const leadLastName = leadParts[0].trim();
                        const leadFirstName = leadParts[1].trim().replace(',', ''); // "First Name, Middle" -> "First Name Middle"

                        // Find matching traveler
                        const matchingTraveler = travelers.find((traveler: any) => {
                            const travelerFullName = `${traveler.firstName || ''}`.trim().replace(',', '');
                            return traveler.lastName?.trim() === leadLastName &&
                                travelerFullName === leadFirstName;
                        });

                        if (matchingTraveler?.email) {
                            leadEmail = matchingTraveler.email;
                        }
                    }
                }
            }

            if (!leadEmail) {
                alert(`Lead email not found. Please ensure the lead traveler has an email address, it can be populated under Manage Travelers. Lead name must be of the syntax "Last Name / First Name, Middle Name" to match correctly. E.g. "Kolovos / Nikolas, Ioannis" or "Leontopoulos / Chris".`);
                throw new Error('Lead email not found');
            }

            const leadName = leadNameParam;

            console.log(localStorage.getItem('agentName'));
            // Fetch agent details if not in localStorage
            if (localStorage.getItem('agentName') == null) {
                const agentUsername = searchParams.get('agent');
                if (agentUsername) {
                    try {
                        const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/username/${agentUsername}`, {
                            headers: {
                                "Authorization": `Bearer ${localStorage.getItem("token")}`
                            }
                        });

                        if (userResponse.ok) {
                            const userData = await userResponse.json();
                            console.log(userData);
                            if (userData.fullName) localStorage.setItem('agentName', userData.fullName);
                            if (userData.email) localStorage.setItem('agentEmail', userData.email);
                            if (userData.phone) localStorage.setItem('agentPhone', userData.phone);
                        }
                    } catch (error) {
                        console.error('Error fetching user details:', error);
                    }
                }
            }

            // Get agent info from localStorage or use defaults
            const agentName = localStorage.getItem('agentName') || searchParams.get('agent') || 'Your Personalized Trip Planner';
            const agentEmail = localStorage.getItem('agentEmail') || 'agent@travelagency.com';
            const agentPhone = localStorage.getItem('agentPhone') || '(555) 123-4567';
            const companyName = 'Personally Travel';

            // Construct email template
            const subject = encodeURIComponent(`Your Travel Itinerary - ${leadName}`);
            const body = encodeURIComponent(`Dear ${leadName.split(' / ')[1]?.split(',')[0].trim() || leadName},

Thank you for choosing ${companyName} for your upcoming travel plans! We're excited to help make your trip memorable.

Your personalized itinerary is ready for review. You can access it anytime using the link below:

${shareableUrl}

Please review the details carefully. If you have any questions or need to make changes, don't hesitate to reach out.

We look forward to serving you!

Best regards,

---
${agentName}
${companyName}
Email: ${agentEmail}
Phone: ${agentPhone}

---
This email and any attachments are confidential and intended solely for the recipient. If you received this in error, please delete it and notify us immediately.
`);

            // Open email client with pre-filled template
            window.location.href = `mailto:${leadEmail}?subject=${subject}&body=${body}`;

            // Reset button state
            if (sendButton) {
                sendButton.disabled = false;
                sendButton.classList.remove('cursor-not-allowed', 'text-blue-500');
            }

        } catch (error) {
            console.error('Error sending itinerary to lead:', error);
            alert('Failed to prepare email. Please try again.');

            // Reset button state
            const sendButton = document.querySelector('[title="Send to lead"]') as HTMLButtonElement;
            if (sendButton) {
                sendButton.disabled = false;
                sendButton.classList.remove('cursor-not-allowed', 'text-blue-500');
            }
        }
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            {/* Header Section */}
            <header className="p-2 bg-gray-100 shadow-md flex justify-between items-center">
                {/* Left Section: Back to Dashboard Button */}
                <button
                    onClick={() => router.push("/dashboard")}
                    className="flex items-center text-gray-600 hover:text-gray-800 transition-all duration-200"
                >
                    <HiArrowNarrowLeft className="mr-2 text-lg" />
                    <span className="text-base font-medium">Dashboard</span>
                </button>

                {/* Middle Section: Query Parameters (only rendered if queryParams exist) */}
                {queryParams.length > 0 && (
                    <section className="flex-1 flex justify-center space-x-3 text-sm font-medium text-gray-600 px-2 overflow-hidden">
                        {/* Display each query parameter side by side */}
                        <div className="flex flex-wrap justify-center items-center gap-2">
                            {queryParams.map((param, index) => (
                                <div key={index} className="flex items-center space-x-1 whitespace-nowrap">
                                    {param}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Right Section: Action Buttons */}
                <div className="flex space-x-2">
                    {/* Preview Button */}
                    <button
                        className={`flex items-center transition-all duration-200 p-1 ${isPreviewingPdf
                            ? 'text-blue-500 cursor-not-allowed'
                            : 'text-gray-600 hover:text-gray-800'
                            }`}
                        title={isPreviewingPdf ? "Previewing Itinerary..." : "Preview Itinerary"}
                        onClick={() => previewItinerary()}
                        disabled={isPreviewingPdf}
                    >
                        {isPreviewingPdf ? (
                            <svg
                                className="animate-spin h-5 w-5"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                        ) : (
                            <HiEye className="text-lg" />
                        )}
                    </button>

                    {/* PDF Button */}
                    <button
                        className={`flex items-center transition-all duration-200 p-1 ${isGeneratingPdf
                            ? 'text-blue-500 cursor-not-allowed'
                            : 'text-gray-600 hover:text-gray-800'
                            }`}
                        title={isGeneratingPdf ? "Generating PDF..." : "Generate PDF"}
                        onClick={() => generatePdf()}
                        disabled={isGeneratingPdf}
                    >
                        {isGeneratingPdf ? (
                            <svg
                                className="animate-spin h-5 w-5"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                        ) : (
                            <HiDocumentText className="text-lg" />
                        )}
                    </button>

                    {/* Send Button */}
                    <button
                        className="flex items-center text-gray-600 hover:text-gray-800 transition-all duration-200 p-1"
                        title="Send to lead"
                        onClick={() => sendItineraryToLead()}
                    >
                        <HiPaperAirplane className="text-lg" />
                    </button>
                </div>
            </header>

            {/* Page Content */}
            <main className="flex flex-1 min-h-0 overflow-hidden">{children}</main>
        </div>
    );
}
