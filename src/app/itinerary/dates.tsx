import React, { useState, useEffect, useRef } from 'react';
import type { Date } from './types/types';
import { FiEdit, FiX, FiCalendar } from 'react-icons/fi';
import { Droppable, Draggable } from "@hello-pangea/dnd";

interface DateListProps {
  itineraryId: number;
  dates: Date[];
  selectedDate?: Date;
  onSelectedDate: (date: Date) => void;
  onNewDayClick: (date: Date) => void;
  onUpdateDates: (dates: Date[]) => void; // New prop for updating the entire list
  onRemoveDate: (date: Date) => void;
}

const DateList: React.FC<DateListProps> = ({ itineraryId, dates, selectedDate, onSelectedDate, onNewDayClick, onUpdateDates, onRemoveDate }) => {
  const dateAdded = useRef<boolean>(false)
  const [prevDates, setPrevDates] = useState<Date[]>(dates.map(date => ({ ...date })))
  const [isAddingDay, setIsAddingDay] = useState<boolean>(false);
  const [addingIndex, setAddingIndex] = useState<number | null>(null);
  const skipAutoSave = useRef<boolean>(false);

  const handleDateAdd = async (date: Date) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/itineraries/add/date/${itineraryId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(date),
    })
      .then(res => {
        if (!res.ok)
          throw new Error(`Request error: ${res.status}`);
        return res.json()
      })
      .then((data) => {
        date.id = data.id;
        dateAdded.current = false;
        setAddingIndex(null);
        setIsAddingDay(false);
      })
      .catch(error => console.error("Error adding dates", error));
  }

  const saveChanges = async (date: Date) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/itineraries/update/date`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(date),
    })
      .then(res => {
        if (!res.ok)
          throw new Error(`Request error: ${res.status}`);
        return res.json()
      })
      .catch(error => { console.warn(date), console.warn("Error saving changes to date ", error) })
  }

  const saveMultipleDates = async (datesToSave: Date[]) => {
    // TODO: Replace with your actual bulk update endpoint
    // For now, call individual updates in parallel
    await Promise.all(
      datesToSave.map(date =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/itineraries/update/date`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(date),
        })
          .then(res => {
            if (!res.ok)
              throw new Error(`Request error: ${res.status}`);
            return res.json()
          })
          .catch(error => { 
            console.warn(date); 
            console.warn("Error saving changes to date ", error) 
          })
      )
    );
  }

  useEffect(() => {
    if (skipAutoSave.current) {
      skipAutoSave.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      if (dateAdded.current) {
        handleDateAdd(dates[dates.length - 1])
        setPrevDates(dates.map(date => ({ ...date })));
      }
      // If dates is different than prevDates (if it was updated and hasn't been saved), find the different dates and save them
      if (dates.length === prevDates.length && prevDates !== dates) {
        const modifiedDate = dates.find((newDate, index) => {
          const prevDate = prevDates[index];
          return (
            prevDate.name !== newDate.name ||
            prevDate.location !== newDate.location ||
            prevDate.date !== newDate.date
          );
        });
        if (modifiedDate) {
          saveChanges(modifiedDate);
          setPrevDates(dates.map(date => ({ ...date }))); // Update prevDates after saving
        }
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [dates]);

  const handleNameChange = (index: number, newName: string) => {
    const updatedDates = [...dates];
    updatedDates[index].name = newName;
    onUpdateDates(updatedDates); // Update the entire list
  };

  const handleDateChange = (index: number, newDate: string) => {
    const updatedDates = [...dates];
    const oldDate = updatedDates[index].date;
    updatedDates[index].date = newDate;

    // Check if there are dates after this one
    if (index < dates.length - 1) {
      // Calculate the difference in days
      const oldDateObj = new Date(oldDate);
      const newDateObj = new Date(newDate);
      const daysDiff = Math.round((newDateObj.getTime() - oldDateObj.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff !== 0) {
        // Prompt user if they want to cascade the change
        const shouldCascade = window.confirm(
          `Do you want to shift all following dates by ${Math.abs(daysDiff)} day(s) ${daysDiff > 0 ? 'forward' : 'backward'}?\n\n` +
          `Click "OK" to update all following dates, or "Cancel" to only change this date.`
        );

        if (shouldCascade) {
          // Update all following dates
          const datesToSave: Date[] = [];
          for (let i = index + 1; i < updatedDates.length; i++) {
            const currentDate = new Date(updatedDates[i].date);
            currentDate.setDate(currentDate.getDate() + daysDiff);
            updatedDates[i].date = currentDate.toISOString().split('T')[0];
            datesToSave.push(updatedDates[i]);
          }
          
          // Save the changed date and all cascaded dates
          datesToSave.unshift(updatedDates[index]); // Add the originally changed date
          skipAutoSave.current = true;
          setPrevDates(updatedDates.map(date => ({ ...date })));
          saveMultipleDates(datesToSave);
        }
      }
    }

    onUpdateDates(updatedDates); // Update the entire list
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden mt-2">
      <button
        onClick={() => {
          setAddingIndex(dates.length);
          setIsAddingDay(true);
          dateAdded.current = true;
          onNewDayClick({
            name: "New Day",
            location: "Location",
            date: new Date().toISOString().split("T")[0],
          });
        }}
        disabled={isAddingDay}
        className={`mb-2 px-3 py-1 rounded text-white text-sm ${isAddingDay ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"}`}
      >
        + New Day
      </button>

      {/* Scrollable List with Drag & Drop */}
      <Droppable droppableId="dates" type="DATE">
        {(provided) => (
          <ul 
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex-1 min-h-0 overflow-y-auto bg-gray-100 p-2"
          >
            {dates.map((date, index) => (
              <Draggable 
                key={date.id || `temp-${index}`} 
                draggableId={`date-${date.id}` || `temp-${index}`} 
                index={index}
                isDragDisabled={addingIndex === index}
              >
                {(provided, snapshot) => (
                  <Droppable droppableId={`date-${date.id}`} type="ACTIVITY">
                    {(droppableProvided, droppableSnapshot) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        aria-disabled={addingIndex === index}
                        onClick={() => {
                          if (addingIndex !== index) {
                            onSelectedDate(date);
                          }
                        }}
                        className={`${addingIndex === index ? 'bg-gray-300 cursor-not-allowed opacity-60' : 'cursor-pointer'} p-2 rounded-lg mt-2 transition-all duration-200 ease-in-out shadow-sm
                                    ${droppableSnapshot.isDraggingOver ? 'bg-green-200 ring-2 ring-green-400' : snapshot.isDragging ? 'bg-blue-300 ring-2 ring-blue-400' : selectedDate?.id === date.id ? 'bg-blue-200' : 'hover:bg-gray-200'}`}
                        style={provided.draggableProps.style}
                      >
                        <div 
                          ref={droppableProvided.innerRef}
                          {...droppableProvided.droppableProps}
                        >
                          <div className="flex items-center justify-between w-full space-x-1">
                            <div className="flex-1" {...provided.dragHandleProps}>
                              <div
                                className="text-md rounded-lg cursor-pointer hover:bg-gray-50 focus-within:ring-1 focus-within:ring-blue-500 inline-flex items-center space-x-2 relative"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const input = e.currentTarget.querySelector('input') as HTMLInputElement;
                                  input.focus();
                                  input.showPicker();
                                }}
                              >
                                <FiCalendar className="flex-shrink-0" />
                                <span>
                                  {(() => {
                                    const d = new Date(date.date + 'T00:00:00');
                                    const weekday = d.toLocaleDateString('en-GB', { weekday: 'long' });
                                    const day = d.toLocaleDateString('en-GB', { day: '2-digit' });
                                    const month = d.toLocaleDateString('en-GB', { month: 'long' });
                                    const year = d.toLocaleDateString('en-GB', { year: 'numeric' });
                                    return `${weekday}, ${day} ${month}, ${year}`;
                                  })()}
                                </span>
                                <input
                                  type="date"
                                  value={date.date}
                                  disabled={isAddingDay}
                                  onChange={(e) => handleDateChange(index, e.target.value)}
                                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                />
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm("Are you sure you want to delete this date?")) {
                                  onRemoveDate(date);
                                }
                              }}
                              className="text-red-600 hover:text-red-800 transition duration-150 text-lg flex-shrink-0"
                            >
                              <FiX />
                            </button>
                          </div>

                          <div className="mt-3">
                            <div className="flex items-center space-x-1">
                              <FiEdit className="text-gray-500 text-xs flex-shrink-0" />
                              <input
                                id={`date-input-${index}`}
                                type="text"
                                value={date.name}
                                onChange={(e) => handleNameChange(index, e.target.value)}
                                size={Math.max(date.name.length - 2, 1)}
                                className="font-semibold text-sm bg-transparent border-none outline-none focus:bg-white focus:border focus:border-blue-500 focus:px-1 focus:rounded cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                          {droppableProvided.placeholder}
                        </div>
                      </li>
                    )}
                  </Droppable>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </ul>
        )}
      </Droppable>
    </div >
  );
};

export default DateList;
