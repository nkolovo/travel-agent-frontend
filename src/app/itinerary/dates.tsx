import React, { useState, useEffect, useRef } from 'react';
import type { Date } from './types/types';
import { FiEdit, FiX } from 'react-icons/fi';

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

  const handleDateAdd = async (date: Date) => {
    await fetch(`http://localhost:8080/api/itineraries/add/date/${itineraryId}`, {
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
      })
      .catch(error => console.error("Error adding dates", error));
  }

  const saveChanges = async (date: Date) => {
    await fetch(`http://localhost:8080/api/itineraries/update/date`, {
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
          dateAdded.current = true;
          onNewDayClick({
            name: "New Day",
            location: "Location",
            date: new Date().toISOString().split("T")[0],
          });
        }}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        + New Day
      </button>

      {/* Scrollable List */}
      <ul className="flex-1 min-h-0 overflow-y-auto bg-gray-100 p-4">
        {dates.map((date, index) => (
          <li
            key={index}
            onClick={() => { onSelectedDate(date), setSelectedDate(date) }}
            className={`cursor-pointer p-4 rounded-lg mt-4 transition-all duration-200 ease-in-out shadow-md ${selectedDate === date ? 'bg-blue-200' : 'hover:bg-gray-200'}`}
          >
            <div className="flex items-center justify-between w-full space-x-2">
              <div className="flex items-center space-x-2 flex-grow">
                <input
                  id={`date-input-${index}`}
                  type="text"
                  value={date.name}
                  onChange={(e) => handleNameChange(index, e.target.value)}
                  className="bg-transparent border-none font-bold text-xl p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    minWidth: '50px',
                    wordWrap: 'break-word',
                    whiteSpace: 'normal',
                    fontSize: 'clamp(0.875rem, 2vw, 1.25rem)',
                  }}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    document.getElementById(`date-input-${index}`)?.focus();
                  }}
                  className="text-gray-600 hover:text-blue-600 transition duration-150"
                >
                  <FiEdit />
                </button>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm("Are you sure you want to delete this date?")) {
                    onRemoveDate(date);
                  }
                }}
                className="text-red-600 hover:text-red-800 transition duration-150 text-2xl"
              >
                <FiX />
              </button>
            </div>

            <div className="mt-2">
              <input
                type="date"
                value={date.date}
                onChange={(e) => handleDateChange(index, e.target.value)}
                className="bg-transparent border-none w-full p-2 rounded-lg mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DateList;
