"use client";

import { ReactNode } from "react";
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
            .then(res => res.blob())
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
            });
    }

    function sendItineraryToLead(): void {
        console.log("Function not implemented.");
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
