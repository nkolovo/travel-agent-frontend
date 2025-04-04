"use client";

import { ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // Import useSearchParams
import { HiArrowNarrowLeft } from "react-icons/hi";
import { HiDocumentText, HiEye, HiPaperAirplane } from "react-icons/hi"; // Import new icons

export default function ItineraryLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
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
        return (
            <div key={key} className="flex items-center space-x-2">
                <strong>{customKey}:</strong> <span>{value}</span>
            </div>
        );
    });

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            {/* Header Section */}
            <header className="p-4 bg-gray-100 shadow-md flex justify-between items-center">
                {/* Left Section: Back to Dashboard Button */}
                <button
                    onClick={() => router.push("/dashboard")}
                    className="flex items-center text-gray-600 hover:text-gray-800 transition-all duration-200"
                >
                    <HiArrowNarrowLeft className="mr-2 text-2xl sm:text-xl md:text-2xl lg:text-3xl" />
                    <span className="text-xl sm:text-lg md:text-xl lg:text-2xl font-medium">Dashboard</span>
                </button>

                {/* Middle Section: Query Parameters (only rendered if queryParams exist) */}
                {queryParams.length > 0 && (
                    <section className="flex-1 flex justify-center space-x-4 text-xl sm:text-lg md:text-xl lg:text-2xl font-medium text-gray-600">
                        {/* Display each query parameter side by side */}
                        {queryParams}
                    </section>
                )}

                {/* Right Section: Action Buttons */}
                <div className="flex space-x-4">
                    {/* PDF Button */}
                    <button
                        className="flex items-center text-gray-600 hover:text-gray-800 transition-all duration-200"
                        title="Generate PDF"
                        onClick={() => console.log("Generate PDF")}
                    >
                        <HiDocumentText className="text-2xl" />
                    </button>

                    {/* Preview Button */}
                    <button
                        className="flex items-center text-gray-600 hover:text-gray-800 transition-all duration-200"
                        title="Preview Itinerary"
                        onClick={() => console.log("Preview Itinerary")}
                    >
                        <HiEye className="text-2xl" />
                    </button>

                    {/* Send Button */}
                    <button
                        className="flex items-center text-gray-600 hover:text-gray-800 transition-all duration-200"
                        title="Send to lead"
                        onClick={() => console.log("Send Itinerary")}
                    >
                        <HiPaperAirplane className="text-2xl" />
                    </button>
                </div>
            </header>

            {/* Page Content */}
            <main className="flex flex-1 min-h-0 overflow-hidden">{children}</main>
        </div>
    );
}
