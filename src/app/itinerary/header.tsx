"use client";

import { useEffect, useState, useRef } from "react";
import { FiEdit, FiCamera } from "react-icons/fi"; // Importing icons
import { Itinerary } from "./types/types";

export default function Header({ itineraryId }: { itineraryId: number }) {
  const [itineraryLoaded, setItineraryLoaded] = useState<boolean>(false);
  const [itinerary, setItinerary] = useState<Itinerary>();
  const [coverImage, setCoverImage] = useState<string>("");

  // States to track current values
  const [title, setTitle] = useState<string>("Insert Title Here");
  const [originalTitle, setOriginalTitle] = useState<string>("Insert Title Here"); // For when a user cancels their title edit
  const [tripCost, setTripCost] = useState<number>(0);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Refs to track previous values
  const prevTitle = useRef(title);
  const prevTripCost = useRef(tripCost);
  const prevCoverImage = useRef(coverImage);

  const saveChanges = async () => {
    console.log("Saving changes");
    const updatedData = { itineraryId, title, tripCost, coverImage };
    console.log(updatedData);
    try {
      await fetch("http://localhost:8080/api/itineraries/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(updatedData),
      });
      // Update previous values after a successful save
      prevTitle.current = title;
      prevTripCost.current = tripCost;
      prevCoverImage.current = coverImage;
    } catch (error) {
      console.error("Error saving changes:", error);
    }
  };

  useEffect(() => {
    const fetchItinerary = async () => {
      console.log("From Header: " + itineraryId);
      await fetch(`http://localhost:8080/api/itineraries/${itineraryId}`, {
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
        .then(data => {
          setItineraryLoaded(true);
          console.log(data);
          setItinerary(data)
          setTitle(data.name ?? title)
          setTripCost(data.tripPrice ?? tripCost)
          setCoverImage(data.image ?? coverImage)
        }).catch(error => console.error("Error fetching itinerary:", error))
    }
    if (!itineraryLoaded)
      fetchItinerary()
    const timeout = setTimeout(() => {
      if ( // Check every 1 seconds if changes occurred and save them
        title !== prevTitle.current ||
        tripCost !== prevTripCost.current ||
        coverImage !== prevCoverImage.current
      ) {
        saveChanges();
      }
    }, 2000)
    return () => clearTimeout(timeout); // Cleanup timeout 
  }, [title, tripCost, coverImage])

  const handleCoverImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImage(reader.result as string); // Set the cover image state
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value);
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      // Save the original title when entering edit mode
      setOriginalTitle(title);
    }
  };

  const saveTitle = () => {
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setTitle(originalTitle); // Revert to original title
    setIsEditing(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      saveTitle();
    }
  };

  return (
    <div className="relative w-full h-60 bg-gray-300 rounded-lg overflow-hidden shadow-md">
      {/* Cover Image */}
      {coverImage ? (
        <img
          src={coverImage}
          alt="Cover"
          className="w-full h-full object-cover" // Ensures the image fits the container without cropping
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-400 text-white">
          No Cover Image
        </div>
      )}

      {/* Overlaying Title & Edit/Save/Cancel Buttons */}
      <div className="absolute top-6 left-6 flex items-center space-x-3">
        {isEditing ? (
          // If in edit mode, show an input field
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            onKeyDown={handleKeyDown} // Trigger save on "Enter"
            className="text-white text-3xl font-bold drop-shadow-md bg-transparent border-b-2 border-white focus:outline-none"
          />
        ) : (
          // If in view mode, just display the title
          <h1 className="text-white text-3xl font-bold drop-shadow-md">{title}</h1>
        )}

        {isEditing ? (
          <>
            {/* Show Save and Cancel buttons when editing */}
            <button onClick={saveTitle} className="text-white text-lg hover:text-gray-200">
              Save
            </button>
            <button onClick={cancelEdit} className="text-white text-lg hover:text-gray-200">
              Cancel
            </button>
          </>
        ) : (
          // Show Edit button when not editing
          <button onClick={toggleEditMode}>
            <FiEdit className="text-white text-2xl hover:text-gray-200 transition" />
          </button>
        )}
      </div>

      {/* Total Trip Cost (Under Title) */}
      <p className="absolute top-16 left-6 text-white text-xl drop-shadow-md">
        Total Cost: €{tripCost.toLocaleString()}
      </p>

      {/* Change Cover Photo Button (Bottom Right) */}
      <button
        className="absolute bottom-4 right-4 bg-white bg-opacity-50 p-2 rounded-full hover:bg-opacity-75 transition"
        onClick={() => document.getElementById("cover-image-input")?.click()}
      >
        <FiCamera className="text-gray-700 text-2xl" />
      </button>

      {/* Hidden File Input */}
      <input
        id="cover-image-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleCoverImageChange}
      />
    </div>
  );
}
