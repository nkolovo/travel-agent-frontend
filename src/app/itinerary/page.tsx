"use client"

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

import type { Date, Activity, Item, Itinerary } from "./types/types";

import Header from "./header";
import DateList from "./dates";
import DateSummary from "./summary";
import ItemList from "./items";

export default function ItineraryPage() {
    const searchParams = useSearchParams();
    const [itinerary, setItinerary] = useState<Itinerary>();
    const [itineraryId, setItineraryId] = useState<number>();
    const [dates, setDates] = useState<Date[]>([])
    const [selectedDate, setSelectedDate] = useState<Date>();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const isEditing = itineraryId != null

    useEffect(() => {
        const fetchItems = async () => {
            await fetch('http://localhost:8080/api/items', {
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
                .then(items => {
                    setItems(items);
                })
                .catch(error =>
                    console.error("Error fetching itinerary:", error)
                )
        }

        const fetchItineraryInfo = async () => {
            var id = Number(searchParams.get('id'));
            await fetch(`http://localhost:8080/api/itineraries/${id}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json",
                },
            })
                .then(res => {
                    if (!res.ok)
                        throw new Error(`Request error: ${res.status}`);
                    return res.json()
                })
                .then(itinerary => {
                    setItinerary(itinerary);
                    setItineraryId(itinerary.id);
                    setDates(itinerary.dates);
                })
                .catch(error =>
                    console.error("Error fetching itinerary:", error)
                )
        }

        fetchItineraryInfo();
        fetchItems();
    }, []);

    const handleDayClick = (date: Date) => {
        setSelectedDate(date);
    }

    const handleNewDayClick = (newDay: Date) => {
        setDates((prevDates) => [...prevDates, newDay]); // This adds the new day to the list
    };

    const handleUpdateDates = (updatedDates: Date[]) => {
        setDates(updatedDates); // This updates the whole list of dates
    };

    const handleSelectItem = (item: Item) => {
        const newActivity: Activity = {
            subheading: item.name,
            description: item.description
        };
        setActivities([...activities, newActivity]);
    };

    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            <div className="w-full">
                {itineraryId !== undefined && <Header itineraryId={itineraryId} />}
            </div>
            {/* Use flex-grow to fill remaining space */}
            <div className="grid grid-cols-12 gap-4 flex-1 overflow-hidden">
                {/* Sidebar with DateList - Make it take full height */}
                <div className="flex flex-col col-span-4 sm:col-span-4 md:col-span-4 lg:col-span-3 xl:col-span-3 2xl:col-span-3 flex-1 overflow-hidden">
                    <DateList
                        dates={dates}
                        onSelectedDate={handleDayClick}
                        onNewDayClick={handleNewDayClick}
                        onUpdateDates={handleUpdateDates}
                    />
                </div>

                {/* Middle section - Ensure DateSummary also expands */}
                <div className="col-span-4 sm:col-span-4 md:col-span-4 lg:col-span-6 xl:col-span-6 2xl:col-span-6 flex flex-col flex-1 overflow-hidden">
                    <DateSummary date={selectedDate} activities={activities} />
                </div>

                {/* Right Section - Ensure ItemList expands properly */}
                <div className="col-span-4 sm:col-span-4 md:col-span-4 lg:col-span-3 xl:col-span-3 2xl:col-span-3 flex flex-col flex-1 overflow-hidden">
                    <ItemList items={items} onSelectItem={handleSelectItem} />
                </div>
            </div>
        </div>
    );
}
