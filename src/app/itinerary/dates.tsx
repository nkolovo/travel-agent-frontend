import React, { useState, useEffect, useRef } from 'react';
import type { Date } from './types/types';
import { FiEdit, FiX, FiCalendar } from 'react-icons/fi';

interface DateListProps {
  itineraryId: number;
  dates: Date[];
  onSelectedDate: (date: Date) => void;
  onNewDayClick: (date: Date) => void;
  onUpdateDates: (dates: Date[]) => void; // New prop for updating the entire list
  onRemoveDate: (date: Date) => void;
}

const DateList: React.FC<DateListProps> = ({ itineraryId, dates, onSelectedDate, onNewDayClick, onUpdateDates, onRemoveDate }) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const dateAdded = useRef<boolean>(false)
  const [prevDates, setPrevDates] = useState<Date[]>(dates.map(date => ({ ...date })))
  const [isAddingDay, setIsAddingDay] = useState<boolean>(false);
  const [addingIndex, setAddingIndex] = useState<number | null>(null);

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

  useEffect(() => {
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
        if (modifiedDate)
          saveChanges(modifiedDate);
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
    updatedDates[index].date = newDate;
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

      {/* Scrollable List */}
      <ul className="flex-1 min-h-0 overflow-y-auto bg-gray-100 p-2">
        {dates.map((date, index) => (
          <li
            key={index}
            aria-disabled={addingIndex === index}
            onClick={() => {
              if (addingIndex !== index) {
                onSelectedDate(date);
                setSelectedDate(date);
              }
            }}
            className={`${addingIndex === index ? 'bg-gray-300 cursor-not-allowed opacity-60' : 'cursor-pointer'} p-2 rounded-lg mt-2 transition-all duration-200 ease-in-out shadow-sm
                        ${selectedDate === date ? 'bg-blue-200' : 'hover:bg-gray-200'}`}
          >
            <div className="flex items-center justify-between w-full space-x-1">
              <div className="flex-1">
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
                    {new Date(date.date + 'T00:00:00').toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
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
                <div 
                  className="inline-flex items-center space-x-1 p-1 rounded-lg cursor-pointer hover:bg-gray-50 focus-within:ring-1 focus-within:ring-blue-500 relative"
                  onClick={(e) => {
                    const input = e.currentTarget.querySelector('input') as HTMLInputElement;
                    input.focus();
                    input.select();
                  }}
                >
                  <FiEdit className="text-gray-500 text-xs flex-shrink-0" />
                  <span className="font-semibold text-sm">{date.name}</span>
                  <input
                    id={`date-input-${index}`}
                    type="text"
                    value={date.name}
                    onChange={(e) => handleNameChange(index, e.target.value)}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer bg-transparent border-none"
                  />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div >
  );
};

export default DateList;
