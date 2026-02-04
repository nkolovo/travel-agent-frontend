"use client";

import { useEffect, useState, useRef } from "react";
import { FiEdit, FiCamera } from "react-icons/fi";

interface HeaderProps {
  itineraryId: number;
  retailPrice: number;
  netPrice: number;
}

export default function Header({ itineraryId, retailPrice, netPrice }: HeaderProps) {
  const [itineraryLoaded, setItineraryLoaded] = useState<boolean>(false);
  const [coverImage, setCoverImage] = useState<string>("");

  // States to track current values
  const [title, setTitle] = useState<string>("Insert Title Here");
  const [originalTitle, setOriginalTitle] = useState<string>("Insert Title Here");
  const [tripCost, setTripCost] = useState<number>(retailPrice);
  const [netCost, setNetCost] = useState<number>(netPrice);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Refs to track previous values
  const isFirstRender = useRef(true);
  const prevTitle = useRef(title);

  const saveChanges = async () => {
    const updatedData = { itineraryId, title, tripCost, netCost };
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/itineraries/update`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(updatedData),
      });
      // Update previous values after a successful save
      prevTitle.current = title;
    } catch (error) {
      console.error("Error saving changes:", error);
    }
  };

  useEffect(() => {
    if (!isEditing) {
      setTripCost(retailPrice ?? 0);
      setNetCost(netPrice ?? 0);
    }
  }, [retailPrice, netPrice]);

  useEffect(() => {
    const fetchItinerary = async () => {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/itineraries/${itineraryId}`, {
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
          setTitle(data.name ?? title)
          setTripCost(data.tripPrice ?? tripCost)
          setNetCost(data.netPrice ?? netCost)
          setCoverImage(data.coverImageUrl ?? "")
          prevTitle.current = data.name ?? title;
        }).catch(error => console.error("Error fetching itinerary:", error))
    };

    if (!itineraryLoaded) {
      fetchItinerary();
      return;
    }

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      if ((title !== prevTitle.current) && !isEditing)
        saveChanges();
    }, 1000);
    return () => clearTimeout(timeout);
  }, [title, coverImage, isEditing, itineraryLoaded]);

  const handleCoverImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadCoverImage(file);
    }
  };

  const uploadCoverImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/itineraries/${itineraryId}/upload-image`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        }
      );
      if (!response.ok) throw new Error("Image upload failed");
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading image:", error);
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
    <div className="relative w-full h-48 bg-gray-300 rounded-lg overflow-hidden shadow-md">
      {/* Cover Image */}
      {coverImage ? (
        <img
          src={coverImage}
          alt="Cover"
          className="w-full h-full object-cover" // Ensures the image fits the container without cropping
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-400 text-white text-sm">
          No Cover Image
        </div>
      )}

      {/* Overlaying Title & Edit/Save/Cancel Buttons */}
      <div className="absolute top-6 left-6 flex items-center space-x-2">
        {isEditing ? (
          // If in edit mode, show an input field
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            onKeyDown={handleKeyDown}
            className="text-white text-2xl font-bold drop-shadow-md bg-transparent border-b-2 border-white focus:outline-none w-[600px]"
          />
        ) : (
          // If in view mode, just display the title
          <h1 className="text-white text-2xl font-bold drop-shadow-md break-words max-w-[600px] line-clamp-2">{title}</h1>
        )}

        {isEditing ? (
          <div className="flex space-x-1">
            {/* Show Save and Cancel buttons when editing */}
            <button onClick={saveTitle} className="text-white text-xs hover:text-gray-200 bg-green-600 px-2 py-1 rounded">
              Save
            </button>
            <button onClick={cancelEdit} className="text-white text-xs hover:text-gray-200 bg-red-600 px-2 py-1 rounded">
              Cancel
            </button>
          </div>
        ) : (
          // Show Edit button when not editing
          <button onClick={toggleEditMode}>
            <FiEdit className="text-white text-base hover:text-gray-200 transition" />
          </button>
        )}
      </div>

      {/* Total Trip Cost (Bottom Left) */}
      <p className="absolute bottom-10 left-6 text-white text-lg bg-black bg-opacity-70 px-1.5 py-0.5 rounded">
        Total Cost: €{tripCost}
      </p>

      {/* Net Cost (Under Trip Cost) */}
      <p className="absolute bottom-10 left-44 text-white text-lg bg-black bg-opacity-70 px-1.5 py-0.5 rounded">
        Net Cost: €{netCost}
      </p>

      {/* Profit */}
      <p className="absolute bottom-10 left-80 text-white text-lg bg-black bg-opacity-70 px-1.5 py-0.5 rounded">
        Profit: €{tripCost - netCost} ({parseFloat(((tripCost - netCost) / tripCost * 100).toFixed(2))}% of trip cost) {/* and percentage */}
      </p>

      {/* Change Cover Photo Button (Bottom Right) */}
      <button
        className="absolute bottom-2 right-2 bg-white bg-opacity-50 p-1 rounded-full hover:bg-opacity-75 transition"
        onClick={() => document.getElementById("cover-image-input")?.click()}
      >
        <FiCamera className="text-gray-700 text-base" />
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
