"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { FiEdit, FiCamera } from "react-icons/fi";

interface HeaderProps {
  itineraryId: number;
  retailPrice: number;
  netPrice: number;
}

export default function Header({ itineraryId, retailPrice, netPrice }: HeaderProps) {
  const searchParams = useSearchParams();
  const [itineraryLoaded, setItineraryLoaded] = useState<boolean>(false);
  const [coverImage, setCoverImage] = useState<string>("");

  // States to track current values
  const [title, setTitle] = useState<string>("Insert Title Here");
  const [originalTitle, setOriginalTitle] = useState<string>("Insert Title Here");
  const [leadName, setLeadName] = useState<string>(searchParams.get('leadName') || "Lead Name");
  const [originalLeadName, setOriginalLeadName] = useState<string>(leadName);
  const [tripCost, setTripCost] = useState<number>(retailPrice);
  const [netCost, setNetCost] = useState<number>(netPrice);
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [isEditingLeadName, setIsEditingLeadName] = useState<boolean>(false);

  // Refs to track previous values
  const isFirstRender = useRef(true);
  const prevTitle = useRef(title);
  const prevLeadName = useRef(leadName);

  const saveChanges = async () => {
    const updatedData = { itineraryId, title, leadName, tripCost, netCost };
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
      prevLeadName.current = leadName;
    } catch (error) {
      console.error("Error saving changes:", error);
    }
  };

  useEffect(() => {
    if (!isEditingTitle) {
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
          setLeadName(data.leadName ?? leadName)
          setTripCost(data.tripPrice ?? tripCost)
          setNetCost(data.netPrice ?? netCost)
          setCoverImage(data.coverImageUrl ?? "")
          prevTitle.current = data.name ?? title;
          prevLeadName.current = data.leadName ?? leadName;
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
      if (((title !== prevTitle.current) && !isEditingTitle) || ((leadName !== prevLeadName.current) && !isEditingLeadName))
        saveChanges();
    }, 1000);
    return () => clearTimeout(timeout);
  }, [title, leadName, coverImage, isEditingTitle, isEditingLeadName, itineraryLoaded]);

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
    setIsEditingTitle(!isEditingTitle);
    if (!isEditingTitle) {
      // Save the original title when entering edit mode
      setOriginalTitle(title);
    }
  };

  const saveTitle = () => {
    setIsEditingTitle(false);
  };

  const cancelEdit = () => {
    setTitle(originalTitle); // Revert to original title
    setIsEditingTitle(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      saveTitle();
    }
  };

  const handleLeadNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLeadName(event.target.value);
  };

  const toggleEditLeadName = () => {
    setIsEditingLeadName(!isEditingLeadName);
    if (!isEditingLeadName) {
      setOriginalLeadName(leadName);
    }
  };

  const saveLeadName = () => {
    setIsEditingLeadName(false);
  };

  const cancelEditLeadName = () => {
    setLeadName(originalLeadName);
    setIsEditingLeadName(false);
  };

  const handleLeadNameKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      saveLeadName();
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
      <div className="absolute top-3 left-6 flex flex-col space-y-2">
        <div className="flex items-center space-x-2">
          {isEditingTitle ? (
            // If in edit mode, show an input field
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              onKeyDown={handleKeyDown}
              className="text-white text-2xl font-semibold bg-black bg-opacity-60 px-1 rounded w-[600px] border-b-2 border-white focus:outline-none"
            />
          ) : (
            // If in view mode, just display the title
            <h1 className="text-white text-2xl font-semibold bg-black bg-opacity-60 px-1 rounded break-words max-w-[600px] line-clamp-2">{title}</h1>
          )}

          {isEditingTitle ? (
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

        {/* Lead Name - Editable */}
        <div className="flex items-center space-x-2">
          {isEditingLeadName ? (
            <input
              type="text"
              value={leadName}
              onChange={handleLeadNameChange}
              onKeyDown={handleLeadNameKeyDown}
              className="text-white text-lg font-semibold bg-black bg-opacity-60 px-1 rounded w-[400px] border-b-2 border-white focus:outline-none"
            />
          ) : (
            <h2 className="text-white text-lg font-semibold bg-black bg-opacity-60 px-1 rounded break-words">{leadName}</h2>
          )}

          {isEditingLeadName ? (
            <div className="flex space-x-1">
              <button onClick={saveLeadName} className="text-white text-xs hover:text-gray-200 bg-green-600 px-2 py-1 rounded">
                Save
              </button>
              <button onClick={cancelEditLeadName} className="text-white text-xs hover:text-gray-200 bg-red-600 px-2 py-1 rounded">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={toggleEditLeadName}>
              <FiEdit className="text-white text-sm hover:text-gray-200 transition" />
            </button>
          )}
        </div>
      </div>

      {/* Cost Information - Bottom Anchored */}
      <div className="absolute bottom-2 left-6 flex flex-col gap-1 max-w-[calc(100%-8rem)]">
        {/* Retail Price */}
        <p className="text-white text-xs bg-black bg-opacity-60 px-1 rounded whitespace-nowrap w-fit">
          Retail Price: €{tripCost.toLocaleString()}
        </p>

        {/* Net Cost */}
        <p className="text-white text-xs bg-black bg-opacity-60 px-1 rounded whitespace-nowrap w-fit">
          Net Cost: €{netCost.toLocaleString()}
        </p>

        {/* Profit */}
        <p className="text-white text-xs bg-black bg-opacity-60 px-1 rounded whitespace-nowrap w-fit">
          Profit: {tripCost > 0 ? `€${(tripCost - netCost).toLocaleString()} (${parseFloat(((tripCost - netCost) / tripCost * 100).toFixed(2))}%)` : "N/A"}
        </p>
      </div>

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
