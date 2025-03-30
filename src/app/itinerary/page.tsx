"use client"

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { Date, Activity, Item, Itinerary } from "./types/types";

import Header from "./header";
import DateList from "./dates";
import DateSummary from "./summary";
import ItemList from "./items";
// testing
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
            console.log("Fetching items")
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
            console.log(id);
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
                    console.log(itinerary);
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

    const handleNewDayClick = (date: Date) => {
        const newDate: Date = {
            name: date.name,
            location: date.location,
            date: date.date
        }
        setDates([...dates, newDate]);
    }

    const handleSelectItem = (item: Item) => {
        const newActivity: Activity = {
            subheading: item.name,
            description: item.description
        };
        setActivities([...activities, newActivity]);
    };

    return (
        <div className="p-4">
            <div className="w-full">
                {itineraryId !== undefined && <Header itineraryId={itineraryId} />}
            </div>
            <div className="grid grid-cols-6 gap-4">
                <div className="col-span-1">
                    <DateList dates={dates} onSelectedDate={handleDayClick} onNewDayClick={handleNewDayClick} />
                </div>
                <div className="col-span-3">
                    <DateSummary date={selectedDate} activities={activities} />
                </div>
                <div className="col-span-2">
                    <ItemList items={items} onSelectItem={handleSelectItem} />
                </div>
            </div>

        </div>
    );
}
