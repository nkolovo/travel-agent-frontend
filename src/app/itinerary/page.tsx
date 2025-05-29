"use client"

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

import type { Date, Activity, Item } from "./types/types";

import Header from "./header";
import DateList from "./dates";
import DateSummary from "./summary";
import ItemList from "./items";

export default function ItineraryPage() {
    const searchParams = useSearchParams();
    const [itineraryId, setItineraryId] = useState<number>();
    const [dates, setDates] = useState<Date[]>([])
    const [selectedDate, setSelectedDate] = useState<Date>();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [items, setItems] = useState<Item[]>([]);

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
                    console.log("Fetched items:", items);
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
                    setItineraryId(itinerary.id);
                    itinerary.dates.sort((a: Date, b: Date) => {
                        // Comparing dates (a.date and b.date are strings in ISO format)
                        return new Date(a.date).getTime() - new Date(b.date).getTime();
                    });
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
        fetch(`http://localhost:8080/api/dates/items/${date?.id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
        })
            .then(res => {
                if (!res.ok)
                    throw new Error(`Request error: ${res.status}`);
                return res.json();
            })
            .then(items => {
                setActivities(items.map((item: Item) => ({
                    date: date,
                    item: item,
                    name: item.name,
                    description: item.description
                })));
            })
            .catch(error => {
                console.error("Error fetching items for date:", error);
            })
    }

    const handleNewDayClick = (newDay: Date) => {
        setDates((prevDates) => [...prevDates, newDay]);
    };

    const handleUpdateDates = (updatedDates: Date[]) => {
        setDates(updatedDates);
    };

    const handleRemoveDate = (date: Date) => {
        fetch(`http://localhost:8080/api/itineraries/remove/date/${date.id}/${itineraryId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
        })
            .then(res => {
                if (!res.ok)
                    throw new Error(`Request error: ${res.status}`);
            })
            .then(() => { setDates(dates.filter(d => date.id !== d.id)) })
            .catch(error => console.error("Error saving changes:", error))

    }

    const handleSelectItem = (item: Item) => {
        if (!selectedDate) {
            window.confirm("You have not selected a date for this activity. Please add or select an existing date.");
            return;
        }

        saveItemToDate(item);
        const newActivity: Activity = {
            date: selectedDate,
            item: item,
            name: item.name,
            description: item.description
        };
        setActivities([...activities, newActivity]);
    };

    const saveItemToDate = (item: Item) => {
        console.log("Saving item to date:", item.id, "for date:", selectedDate!.id);
        fetch(`http://localhost:8080/api/dates/add/${selectedDate!.id}/item/${item.id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
        })
            .then(res => {
                if (!res.ok)
                    throw new Error(`Request error: ${res.status}`);
            })
            .catch(error => console.error("Error saving item to date:", error))
    }

    const handleActivityUpdate = (activities: Activity[]) => {
        setActivities(activities);
    }

    const handleItemUpdate = (items: Item[]) => {
        setItems(items);
    }

    return (
        <div className="flex flex-col flex-1 overflow-hidden">
            {itineraryId !== undefined &&
                <div className="itinerary-section flex-1 overflow-hidden">
                    <div className="w-full">
                        <Header itineraryId={itineraryId} />
                    </div>
                    <div className="grid grid-cols-12 gap-4 flex-1 overflow-hidden">
                        <div className="h-[calc(100vh-20rem)] flex flex-col flex-1 overflow-hidden col-span-4 sm:col-span-4 md:col-span-4 lg:col-span-3 xl:col-span-3 2xl:col-span-3">
                            <DateList
                                itineraryId={itineraryId}
                                dates={dates}
                                onSelectedDate={handleDayClick}
                                onNewDayClick={handleNewDayClick}
                                onUpdateDates={handleUpdateDates}
                                onRemoveDate={handleRemoveDate}
                            />
                        </div>

                        <div className="col-span-4 sm:col-span-4 md:col-span-4 lg:col-span-6 xl:col-span-6 2xl:col-span-6 flex flex-col overflow-y-auto">
                            <DateSummary date={selectedDate} activities={activities} onChange={handleActivityUpdate} />
                        </div>

                        <div className="h-[calc(100vh-20rem)] col-span-4 sm:col-span-4 md:col-span-4 lg:col-span-3 xl:col-span-3 2xl:col-span-3 flex flex-col overflow-y-auto">
                            <ItemList items={items} onSelectItem={handleSelectItem} onChange={handleItemUpdate} />
                        </div>
                    </div>
                </div>
            }
        </div>
    );
}
