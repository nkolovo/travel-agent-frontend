import React, { useState, useEffect } from 'react';
import type { Date } from './types/types';
import { FiEdit } from 'react-icons/fi';

interface DateListProps {
  dates: Date[];
  onSelectedDate: (date: Date) => void;
  onNewDayClick: (date: Date) => void;
  onUpdateDates: (dates: Date[]) => void; // New prop for updating the entire list
}

const DateList: React.FC<DateListProps> = ({ dates, onSelectedDate, onNewDayClick, onUpdateDates }) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const saveChanges = async () => {
    console.log("Saving changes");
    const updatedData = { dates };
    console.log(updatedData);
    try {
      await fetch("http://localhost:8080/api/itineraries/add/itinerary/{itineraryId}", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(updatedData),
      });
    } catch (error) {
      console.error("Error saving changes:", error);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (dates.length > 0) {
        saveChanges();
      }
    }, 2000)
    return () => clearTimeout(timeout); // Cleanup timeout 
  }, [dates])

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
    <div className="flex flex-col flex-1 overflow-hidden mt-2">
      <button
        onClick={() =>
          onNewDayClick({
            name: "New Day",
            location: "Location",
            date: new Date().toISOString().split("T")[0],
          })
        }
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        + New Day
      </button>

      {/* Scrollable List */}
      <ul className="flex-1 overflow-y-auto bg-gray-100 p-4">
        {dates.map((date, index) => (
          <li
            key={index}
            onClick={() => { onSelectedDate(date), setSelectedDate(date) }}
            className={`cursor-pointer p-4 rounded-lg mt-4 transition-all duration-200 ease-in-out shadow-md ${selectedDate === date ? 'bg-blue-200' : 'hover:bg-gray-200'
              }`}
          >
            <div className="flex items-center space-x-4">
              {/* Name with edit icon */}
              <div className="flex items-center space-x-2 w-full">
                {/* Name input */}
                <input
                  id={`date-input-${index}`}
                  type="text"
                  value={date.name}
                  onChange={(e) => handleNameChange(index, e.target.value)}
                  className="bg-transparent border-none font-bold text-xl p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    minWidth: '100px', // Prevent shrinking too small
                    maxWidth: '100%', // Make the input fill available width
                    wordWrap: 'break-word', // Allow wrapping if the text overflows
                    whiteSpace: 'normal', // Allow text to wrap and not be cut off
                    fontSize: 'clamp(0.875rem, 2vw, 1.25rem)', // Adjust font size to stay smaller and responsive
                  }}
                />

                {/* Edit Icon */}
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering the date click
                    document.getElementById(`date-input-${index}`)?.focus(); // Focus on input when icon is clicked
                  }}
                  className="text-gray-600 hover:text-blue-600 transition duration-150"
                >
                  <FiEdit />
                </button>
              </div>
            </div>

            {/* Date field */}
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
    </div >
  );
};

export default DateList;
