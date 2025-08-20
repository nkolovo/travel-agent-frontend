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
        console.log("Rerendered");
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
        if (date === selectedDate)
            return;
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
            .then(activities => {
                setActivities(activities.map((activity: Activity) => ({
                    date: date,
                    item: activity.item,
                    name: activity.name,
                    description: activity.description,
                    country: activity.country,
                    location: activity.location,
                    category: activity.category,
                    priority: activity.priority,
                })));
            })
            .catch(error => {
                console.error("Error fetching items for date:", error);
            })
    }

    const handleNewDayClick = (newDay: Date) => {
        if (dates.length > 0) {
            const lastDate = dates[dates.length - 1];
            newDay.date = new Date(new Date(lastDate.date).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Set to next day
        }
        setDates((prevDates) => [...prevDates, newDay]);
    };

    const handleUpdateDates = (updatedDates: Date[]) => {
        setDates(updatedDates);
    };

    const handleRemoveDate = (date: Date) => {
        if (date === selectedDate) {
            setSelectedDate(undefined);
            setActivities([]); // Clear activities when date is removed
        }
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

        // if the item already exists in the activities for the selected date, do not add it again
        if (activities.some(activity => activity.item.id === item.id && activity.date.id === selectedDate.id)) {
            window.alert("This item is already added to the selected date.");
            return;
        }

        const newActivity: Activity = {
            date: selectedDate,
            item: item,
            name: item.name,
            description: item.description,
            country: item.country,
            location: item.location,
            category: item.category,
            priority: activities.length > 0
                ? Math.max(...activities.map(a => a.priority ?? 0)) + 1
                : 1,
        };

        item.priority = newActivity.priority; // Update item priority
        saveItemToDate(item);
        setActivities([...activities, newActivity]);
    };

    const saveItemToDate = (item: Item) => {
        fetch(`http://localhost:8080/api/dates/add/${selectedDate!.id}/item/${item.id}/priority/${item.priority}`, {
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

    const saveActivityToDate = (activity: Activity) => {
        fetch(`http://localhost:8080/api/dates/saveDateItem/${activity.date.id}/item/${activity.item.id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(activity),
        })
            .then(res => {
                if (!res.ok)
                    throw new Error(`Request error: ${res.status}`);
            })
            .catch(error => console.error("Error saving item to date:", error))
    }

    const handleActivityUpdate = (acts: Activity[]) => {
        const changedActivity = acts.find(
            act => {
                const original = activities.find(a => a.item.id === act.item.id);
                return original && JSON.stringify(act) !== JSON.stringify(original);
            }
        );

        if (changedActivity) {
            saveActivityToDate(changedActivity);
        }
        setActivities(acts);
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
