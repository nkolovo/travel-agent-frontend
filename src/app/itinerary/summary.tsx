import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import type { Date } from './types/types';
import { Activity } from './types/types';
import { FaCalendarAlt, FaPlaneArrival, FaPlaneDeparture, FaShip } from "react-icons/fa";
import { FiEdit, FiX } from 'react-icons/fi';
import ItemModal from './itemModal';
import DOMPurify from "dompurify";

interface DateSummaryProps {
  date: Date | undefined; // The selected date
  activities: Activity[]; // List of activities on that date
  onChange: (activities: Activity[]) => void; // Callback to handle changes in the activity list
}

const DateSummary: React.FC<DateSummaryProps> = ({ date, activities, onChange }) => {
  const [selectedActivity, setSelectedActivity] = useState<Activity | undefined>(); // State for selected activity
  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal visibility
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  // Helper function to truncate long descriptions while preserving HTML formatting
  const truncateDescription = (description: string, maxLength: number = 200): string => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = DOMPurify.sanitize(description);
    const textContent = tempDiv.textContent || tempDiv.innerText || "";

    if (textContent.length <= maxLength) {
      return description; // Return original with formatting if short enough
    }

    // Truncate while preserving HTML structure
    let truncatedHTML = '';
    let textLength = 0;

    const traverse = (node: Node): boolean => {
      if (textLength >= maxLength) return false;

      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        const remainingLength = maxLength - textLength;

        if (text.length <= remainingLength) {
          truncatedHTML += text;
          textLength += text.length;
        } else {
          truncatedHTML += text.substring(0, remainingLength);
          textLength = maxLength;
          return false;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        truncatedHTML += `<${element.tagName.toLowerCase()}`;

        // Add attributes
        for (let i = 0; i < element.attributes.length; i++) {
          const attr = element.attributes[i];
          truncatedHTML += ` ${attr.name}="${attr.value}"`;
        }
        truncatedHTML += '>';

        // Process children
        for (let i = 0; i < node.childNodes.length; i++) {
          if (!traverse(node.childNodes[i])) break;
        }

        truncatedHTML += `</${element.tagName.toLowerCase()}>`;
      }

      return true;
    };

    for (let i = 0; i < tempDiv.childNodes.length; i++) {
      if (!traverse(tempDiv.childNodes[i])) break;
    }

    return truncatedHTML + "...";
  };

  const onCustomizeAcivity = (activity: Activity) => {
    setSelectedActivity(activity); // Set the selected activity for editing
    setIsModalOpen(true); // Open the modal
  }

  const onRemoveItemFromDate = async (activity: Activity) => {
    // Remove the item from the list
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dates/remove/activity/${activity.id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then(res => {
        if (!res.ok)
          throw new Error(`Request error: ${res.status}`);
        return res.status
      })
      .then(res => {
        if (res !== 200) {
          throw new Error(`Error deleting item: ${res}`);
        }
        // Remove the item from the local state
        const updated = activities.filter(a => a.id !== activity.id);
        onChange(updated); // Notify parent component of changes
      })
      .catch(error => { console.warn(activity); console.warn("Error deleting item.", error) })
  }

  const closeModal = (activity?: Activity) => {
    setIsModalOpen(false); // Close the modal
    if (activity) {
      const index = activities.findIndex(a => a.id === activity.id);
      if (index !== -1) {
        const updated = [...activities];
        updated[index] = activity; // Replace existing activity
        onChange(updated); // Notify parent component of changes
      }
      setSuccessMessage("Activity saved successfully");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(activities);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    // Update priority based on new order
    const updated = reordered.map((activity, idx) => ({
      ...activity,
      priority: idx + 1,
    }));

    onChange(updated);
  };

  return (
    <div className='mt-2'>

      <div className="flex items-center space-x-4 border-b pb-2 mb-4">
        {/* Date with Calendar Icon */}
        <div className="flex items-center space-x-2 text-lg font-semibold text-gray-700">
          <FaCalendarAlt className="text-blue-500" />
          <span>
            {date?.date
              ? new Date(date.date + "T00:00:00").toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
              : ""}
          </span>
        </div>

        {/* Vertical Divider */}
        <div className="h-6 w-px bg-gray-400"></div>

        {/* Name */}
        <div className="flex items-center space-x-2 text-lg font-semibold text-gray-700">
          {(date?.name.includes("Arrival") || date?.name.includes("Flight")) && <FaPlaneArrival className="text-teal-500" />}
          {date?.name.includes("Departure") && <FaPlaneDeparture className="text-orange-500" />}
          {date?.name.includes("Ferry") && <FaShip className="text-blue-500" />}
          <span>{date?.name}</span>
        </div>
      </div>

      {/* Render the modal */}
      {isModalOpen && <ItemModal isOpen={isModalOpen} closeModalActivity={closeModal} activity={selectedActivity} />}

      <div>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="activities">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex-1 min-h-0 overflow-y-auto"
              >
                {activities.length > 0 ? (
                  activities.map((activity, index) => (
                    <Draggable key={activity.id} draggableId={activity.id!.toString()} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`mb-4 p-4 rounded shadow-sm ${snapshot.isDragging ? 'bg-blue-200 ring-2 ring-blue-300' : 'bg-gray-100'}`}
                          style={{ ...provided.draggableProps.style }}
                        >
                          {/* Heading row: h2 and X button */}
                          <div className="flex items-center justify-between">
                            <h2 className='text-xl font-semibold' dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(activity.name) }} />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm("Are you sure you want to remove this item from this date? This action cannot be undone.")) {
                                  onRemoveItemFromDate(activity);
                                }
                              }}
                              className="text-red-600 hover:text-red-800 transition duration-150 text-2xl"
                              tabIndex={-1}
                            >
                              <FiX />
                            </button>
                          </div>
                          {/* Toolbar and Description row */}
                          <div className="flex items-start gap-2 mt-2">
                            <button
                              onClick={() => onCustomizeAcivity(activity)}
                              className="text-gray-600 hover:text-blue-600 transition duration-150 mt-1"
                              tabIndex={-1}
                            >
                              <FiEdit />
                            </button>
                            <div className="flex flex-col flex-1">
                              {/* Description */}
                              <p className='text-gray-600' dangerouslySetInnerHTML={{ __html: truncateDescription(activity.description) }} />
                            </div>
                            <p className="text-xs text-gray-700">Retail Price: {activity.retailPrice > 0 ? activity.retailPrice : "N/A"}</p>
                            <p className="text-xs text-gray-700">Net Price: {activity.netPrice > 0 ? activity.netPrice : "N/A"}</p>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))
                ) : (
                  <h1>No activities for this date.</h1>
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
      {showSuccessToast && (
        <div className="toast-notification">
          <span>✓ {successMessage}</span>
        </div>
      )}
    </div>
  );
};

export default DateSummary;
