import React, { useState } from "react";
import { Item } from "./types/types";
import { FiSearch, FiFilter, FiEdit, FiX } from "react-icons/fi"; // Import icons
import ItemModal from "./itemModal"; // Import the modal component

interface ItemListProps {
  items: Item[]; // List of items (hotels, destinations, etc.)
  onSelectItem: (item: Item) => void; // Callback to handle item selection
  onChange: (items: Item[]) => void; // Callback to handle changes in the item list
}

const categoryColors: Record<string, { base: string; hover: string }> = {
  Activity: { base: "bg-red-100", hover: "hover:bg-red-200" },
  Lodging: { base: "bg-orange-100", hover: "hover:bg-orange-200" },
  Flight: { base: "bg-purple-100", hover: "hover:bg-purple-200" },
  Transportation: { base: "bg-green-100", hover: "hover:bg-green-200" },
  Cruise: { base: "bg-blue-100", hover: "hover:bg-blue-200" },
  Info: { base: "bg-yellow-100", hover: "hover:bg-yellow-200" },
};

const ItemList: React.FC<ItemListProps> = ({ items, onSelectItem, onChange }) => {
  const [searchTerm, setSearchTerm] = useState(""); // State for search input
  const [selectedCountry, setSelectedCountry] = useState(""); // State for country filter
  const [selectedLocation, setSelectedLocation] = useState(""); // State for location filter
  const [isFilterOpenCountry, setIsFilterOpenCountry] = useState(false); // Toggle country filter dropdown
  const [isFilterOpenLocation, setIsFilterOpenLocation] = useState(false); // Toggle location filter dropdown
  const [selectedItem, setSelectedItem] = useState<Item | undefined>(); // State for selected item
  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal visibility

  // Get unique countries & locations from items
  const uniqueCountries = [...new Set(items.map((item) => item.country))];
  const uniqueLocations = [...new Set(items.map((item) => item.location))];

  // Filter items based on search term & selected country & location
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCountry === "" || item.country === selectedCountry) &&
    (selectedLocation === "" || item.location === selectedLocation)
  );

  const onAddItemClick = () => {
    setSelectedItem(undefined); // Clear selected item for new item creation
    setIsModalOpen(true); // Open the modal
  };

  const onItemEdit = (item: Item) => {
    setSelectedItem(item); // Set the selected item for editing
    setIsModalOpen(true); // Open the modal for editing
  };

  const onDeleteItem = async (item: Item) => {
    // Remove the item from the list
    await fetch(`http://localhost:8080/api/items/remove/${item.id}`, {
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
        items = items.filter(i => i.id !== item.id);
        onChange(items); // Notify parent component of changes
      })
      .catch(error => { console.warn(item), console.warn("Error deleting item.", error) })
  }

  const closeModal = (item?: Item) => {
    setIsModalOpen(false); // Close the modal
    if (item) {
      const index = items.findIndex(i => i.id === item.id);
      if (index !== -1) {
        items[index] = item; // Replace existing item
      } else {
        items.push(item); // Add new item
      }
      items.sort((a, b) => a.name.localeCompare(b.name)); // Sort items by name
      onChange(items); // Notify parent component of changes
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow-md h-full flex flex-col">
      <h2 className="text-xl font-semibold mb-3">Item List</h2>
      <button
        onClick={onAddItemClick}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Add
      </button>

      {/* Render the modal */}
      {isModalOpen && <ItemModal isOpen={isModalOpen} closeModalItem={closeModal} item={selectedItem} />}

      {/* Search Bar & Filter */}
      <div className="relative mb-4 flex items-center">
        {/* Search Icon */}
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />

        {/* Search Input */}
        <input
          type="text"
          placeholder="Search Here"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-12 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        {/* Filter Icon */}
        <div className="relative">
          <button
            onClick={() => setIsFilterOpenCountry(!isFilterOpenCountry)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
          >
            <FiFilter className="text-lg" />
          </button>
          <button
            onClick={() => setIsFilterOpenLocation(!isFilterOpenLocation)}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
          >
            <FiFilter className="text-lg" />
          </button>

          {/* Dropdown for Country Filter */}
          {isFilterOpenCountry && (
            <div className="absolute right-0 mt-2 bg-white border shadow-md rounded w-40 z-10">
              <button
                className={`block w-full text-left px-4 py-2 text-sm ${selectedCountry === "" ? "bg-gray-200" : "hover:bg-gray-100"}`}
                onClick={() => { setSelectedCountry(""); setIsFilterOpenCountry(false); }}
              >
                All Countries
              </button>
              {uniqueCountries.map((country) => (
                <button
                  key={country}
                  className={`block w-full text-left px-4 py-2 text-sm ${selectedCountry === country ? "bg-gray-200" : "hover:bg-gray-100"}`}
                  onClick={() => { setSelectedCountry(country); setIsFilterOpenCountry(false); }}
                >
                  {country}
                </button>
              ))}
            </div>
          )}
          {/* Dropdown for Location Filter */}
          {isFilterOpenLocation && (
            <div className="absolute right-0 mt-2 bg-white border shadow-md rounded w-40 z-10">
              <button
                className={`block w-full text-left px-4 py-2 text-sm ${selectedLocation === "" ? "bg-gray-200" : "hover:bg-gray-100"}`}
                onClick={() => { setSelectedLocation(""); setIsFilterOpenLocation(false); }}
              >
                All Locations
              </button>
              {uniqueLocations.map((location) => (
                <button
                  key={location}
                  className={`block w-full text-left px-4 py-2 text-sm ${selectedLocation === location ? "bg-gray-200" : "hover:bg-gray-100"}`}
                  onClick={() => { setSelectedLocation(location); setIsFilterOpenLocation(false); }}
                >
                  {location}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Item List */}
      <div className="flex-1 overflow-y-auto">
        <ul className="space-y-2">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <li key={item.id}>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectItem(item)}
                    className={`flex-1 text-left p-2 border rounded hover:bg-gray-100 transition 
                      ${categoryColors[item.category]?.base || ""} 
                      ${categoryColors[item.category]?.hover || ""}`}
                  >
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                    <p className="text-xs text-gray-500">{item.location}</p>
                  </button>
                  <button
                    onClick={() => onItemEdit(item)}
                    className="text-gray-600 hover:text-blue-600 transition duration-150"
                    tabIndex={-1}
                  >
                    <FiEdit />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
                        onDeleteItem(item);
                      }
                    }}
                    className="text-red-600 hover:text-red-800 transition duration-150 text-2xl"
                    tabIndex={-1}
                  >
                    <FiX />
                  </button>
                </div>
              </li>
            ))
          ) : (
            <li className="text-gray-500 text-center">No items found</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default ItemList;