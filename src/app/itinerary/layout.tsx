"use client";

import { ReactNode } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation"; // Import useSearchParams
import { HiArrowNarrowLeft } from "react-icons/hi";
import { HiDocumentText, HiEye, HiPaperAirplane } from "react-icons/hi"; // Import new icons

export default function ItineraryLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams(); // Get query params from the URL

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
        console.log("Function not implemented.");
    }

    function generatePdf(): void {
        const itineraryId = params.id;
        if (!itineraryId) {
            console.warn("No itinerary id found");
            return;
        }
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
                        className="flex items-center text-gray-600 hover:text-gray-800 transition-all duration-200 p-1"
                        title="Preview Itinerary"
                        onClick={() => previewItinerary()}
                    >
                        <HiEye className="text-lg" />
                    </button>

                    {/* PDF Button */}
                    <button
                        className="flex items-center text-gray-600 hover:text-gray-800 transition-all duration-200 p-1"
                        title="Generate PDF"
                        onClick={() => generatePdf()}
                    >
                        <HiDocumentText className="text-lg" />
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
