"use client"

import { useState, useEffect, act } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";

import type { Date, Activity, Item } from "./types/types";

import Header from "./header";
import DateList from "./dates";
import DateSummary from "./summary";
import ItemList from "./items";

export default function ItineraryPage({ id }: { id: string }) {
    const [itineraryId, setItineraryId] = useState<number>();
    const [itineraryTripCost, setItineraryTripCost] = useState<number>(0);
    const [itineraryNetCost, setItineraryNetCost] = useState<number>(0);
    const [itineraryNotes, setItineraryNotes] = useState<string>();
    const [dates, setDates] = useState<Date[]>([])
    const [selectedDate, setSelectedDate] = useState<Date>();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [items, setItems] = useState<Item[]>([]);

    useEffect(() => {
        const fetchItems = async () => {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/items`, {
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
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/itineraries/${id}`, {
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
                    setItineraryTripCost(itinerary.tripPrice);
                    setItineraryNetCost(itinerary.netPrice);
                    setItineraryNotes(itinerary.notes);
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
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dates/items/${date?.id}`, {
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
                    id: activity.id,
                    date: date,
                    item: activity.item,
                    country: activity.country,
                    location: activity.location,
                    category: activity.category,
                    name: activity.name,
                    description: activity.description,
                    supplierCompany: activity.supplierCompany,
                    supplierName: activity.supplierName,
                    supplierNumber: activity.supplierNumber,
                    supplierEmail: activity.supplierEmail,
                    supplierUrl: activity.supplierUrl,
                    retailPrice: activity.retailPrice,
                    netPrice: activity.netPrice,
                    notes: activity.notes,
                    pdfName: activity.pdfName,
                    imageNames: activity.imageNames,
                    imageUrls: activity.imageUrls,
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
            setActivities([]);
        }
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/itineraries/remove/date/${date.id}/${itineraryId}`, {
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

        // If the date was removed, update the itinerary costs if any activities had prices
        const removedActivities = activities.filter(activity => activity.date.id === date.id);
        const totalRetailPrice = removedActivities.reduce((sum, activity) => sum + activity.retailPrice, 0);
        const totalNetPrice = removedActivities.reduce((sum, activity) => sum + activity.netPrice, 0);
        handlePriceChange(-totalRetailPrice, -totalNetPrice);
    }

    const handleSelectItem = async (item: Item) => {
        if (!selectedDate) {
            window.confirm("You have not selected a date for this activity. Please add or select an existing date.");
            return;
        }

        try {
            item.priority = activities.length > 0
                ? Math.max(...activities.map(a => a.priority ?? 0)) + 1
                : 1
            const newActivity: Activity = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dates/add/${selectedDate!.id}/item/${item.id}/priority/${item.priority}`, {
                method: "POST",
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
                .then(res => {
                    return res as Activity;
                });


            if (newActivity.retailPrice > 0 || newActivity.netPrice > 0) {
                handlePriceChange(newActivity.retailPrice, newActivity.netPrice);
            }

            setActivities([...activities, newActivity]);
        } catch (error) {
            console.error("Error saving item to date:", error);
        }
    };

    const saveActivityToDate = (activity: Activity) => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dates/saveDateItem`, {
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
        const origMap = new Map(activities.map(a => [a.id, a]));
        const newMap = new Map(acts.map(a => [a.id, a]));

        // removed = in orig but not in new
        const removed = [...origMap.values()].filter(o => !newMap.has(o.id));
        // added = in new but not in orig
        const added = [...newMap.values()].filter(n => !origMap.has(n.id));
        // changed = in both but different
        const changed = [...newMap.values()].filter(n => {
            const o = origMap.get(n.id);
            return o && JSON.stringify(o) !== JSON.stringify(n);
        });

        // handle removals: subtract their prices
        if (removed.length) {
            const removedRetail = removed.reduce((s, a) => s + (a.retailPrice ?? 0), 0);
            const removedNet = removed.reduce((s, a) => s + (a.netPrice ?? 0), 0);
            if (removedRetail > 0 || removedNet > 0) handlePriceChange(-removedRetail, -removedNet);
        }

        // handle additions: add their prices
        if (added.length) {
            const addedRetail = added.reduce((s, a) => s + (a.retailPrice ?? 0), 0);
            const addedNet = added.reduce((s, a) => s + (a.netPrice ?? 0), 0);
            if (addedRetail > 0 || addedNet > 0) handlePriceChange(addedRetail, addedNet);
        }

        // handle changes: apply per-item delta and persist
        for (const updated of changed) {
            const original = origMap.get(updated.id)!;

            // Calculate price deltas for changed activities
            const retailDelta = (updated.retailPrice ?? 0) - (original.retailPrice ?? 0);
            const netDelta = (updated.netPrice ?? 0) - (original.netPrice ?? 0);
            if (retailDelta !== 0 || netDelta !== 0) {
                handlePriceChange(retailDelta, netDelta);
            }

            // Save if priority changed (rearrangement) or any other field changed
            if (updated.priority !== original.priority || retailDelta !== 0 || netDelta !== 0)
                saveActivityToDate(updated);
        }

        setActivities(acts);
    };

    const handleItemUpdate = (items: Item[]) => {
        setItems(items);
    }

    const handlePriceChange = (tripCost: number, netCost: number) => {
        setItineraryTripCost(prev => prev + tripCost);
        setItineraryNetCost(prev => prev + netCost);
    }

    const handleNotesUpdate = (updatedNotes: string) => {
        setItineraryNotes(updatedNotes);
    }

    const handleDragEnd = (result: DropResult) => {
        const { source, destination, type } = result;

        if (!destination) return;

        // Handle date reordering
        if (type === 'DATE') {
            const reordered = Array.from(dates);
            const [removed] = reordered.splice(source.index, 1);
            reordered.splice(destination.index, 0, removed);

            // Recalculate dates sequentially
            const recalculated: Date[] = [];
            for (let idx = 0; idx < reordered.length; idx++) {
                if (idx === 0) {
                    recalculated.push({ ...reordered[idx] });
                } else {
                    const prevDate = new globalThis.Date(recalculated[idx - 1].date);
                    const nextDate = new globalThis.Date(prevDate);
                    nextDate.setDate(nextDate.getDate() + 1);
                    recalculated.push({
                        ...reordered[idx],
                        date: nextDate.toISOString().split('T')[0]
                    });
                }
            }

            // Update selected date if it moved
            if (selectedDate) {
                const movedDate = recalculated.find(d => d.id === selectedDate.id);
                if (movedDate) {
                    setSelectedDate(movedDate);
                }
            }

            setDates(recalculated);
            return;
        }

        // Handle activity reordering within the same date
        if (type === 'ACTIVITY' && source.droppableId === destination.droppableId) {
            const reordered = Array.from(activities);
            const [removed] = reordered.splice(source.index, 1);
            reordered.splice(destination.index, 0, removed);

            const updated = reordered.map((activity, idx) => ({
                ...activity,
                priority: idx + 1,
            }));

            handleActivityUpdate(updated); // Call handleActivityUpdate to save to backend
            return;
        }

        // Handle activity moving to a different date
        if (type === 'ACTIVITY' && source.droppableId !== destination.droppableId) {
            const activityId = parseInt(result.draggableId);
            const activity = activities.find(a => a.id === activityId);
            
            if (!activity) return;

            // Extract target date ID from droppableId (format: "date-{dateId}")
            const targetDateId = parseInt(destination.droppableId.replace('date-', ''));
            const targetDate = dates.find(d => d.id === targetDateId);
            
            if (!targetDate) return;

            // Remove from current date's activities
            const updatedActivities = activities.filter(a => a.id !== activityId);
            
            // Update the activity's date and save to backend
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dates/move/activity/${activityId}/to/${targetDateId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                },
            })
                .then(res => {
                    if (!res.ok) throw new Error(`Request error: ${res.status}`);
                    return res.text(); // Handle text responses
                })
                .then(() => {
                    setActivities(updatedActivities);
                    // If the target date is selected, refresh its activities
                    if (selectedDate?.id === targetDateId) {
                        handleDayClick(targetDate);
                    }
                })
                .catch(error => console.error("Error moving activity to different date:", error));
        }
    };

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex flex-col flex-1 overflow-hidden">
                {itineraryId !== undefined &&
                    <div className="itinerary-section flex-1 overflow-hidden">
                        <div className="w-full">
                            <Header itineraryId={itineraryId} retailPrice={itineraryTripCost} netPrice={itineraryNetCost} />
                        </div>
                        <div className="grid grid-cols-12 gap-2 flex-1 overflow-hidden">
                            <div className="h-[calc(100vh-15rem)] flex flex-col flex-1 overflow-hidden col-span-3">
                                <DateList
                                    itineraryId={itineraryId}
                                    dates={dates}
                                    selectedDate={selectedDate}
                                    onSelectedDate={handleDayClick}
                                    onNewDayClick={handleNewDayClick}
                                    onUpdateDates={handleUpdateDates}
                                    onRemoveDate={handleRemoveDate}
                                />
                            </div>

                            <div className="h-[calc(100vh-15rem)] flex flex-col flex-1 col-span-6 overflow-y-auto">
                                <DateSummary date={selectedDate} activities={activities} onChange={handleActivityUpdate} notes={itineraryNotes} onNotesUpdate={handleNotesUpdate} />
                            </div>

                            <div className="h-[calc(100vh-15rem)] col-span-3 flex flex-col overflow-y-auto">
                                <ItemList items={items} onSelectItem={handleSelectItem} onChange={handleItemUpdate} />
                            </div>
                        </div>
                    </div>
                }
            </div>
        </DragDropContext>
    );
}
