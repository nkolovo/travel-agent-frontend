import React, { useEffect, useState } from "react";
import { Item } from "./types/types";
import { FiSearch, FiFilter } from "react-icons/fi"; // Import icons

interface ItemListProps {
  items: Item[]; // List of items (hotels, destinations, etc.)
  onSelectItem: (item: Item) => void; // Callback to handle item selection
}

const ItemList: React.FC<ItemListProps> = ({ items, onSelectItem }) => {
  const [searchTerm, setSearchTerm] = useState(""); // State for search input
  const [selectedLocation, setSelectedLocation] = useState(""); // State for location filter
  const [isFilterOpen, setIsFilterOpen] = useState(false); // Toggle filter dropdown

  // Get unique locations from items
  const uniqueLocations = [...new Set(items.map((item) => item.location))];

  // Filter items based on search term & selected location
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedLocation === "" || item.location === selectedLocation)
  );

  const onAddItemClick = () => {

  }

  return (
    <div className="p-4 bg-white rounded shadow-md">
      <h2 className="text-xl font-semibold mb-3">Item List</h2>
      <button
        onClick={() => onAddItemClick}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Add
      </button>

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
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
          >
            <FiFilter className="text-lg" />
          </button>

          {/* Dropdown for Location Filter */}
          {isFilterOpen && (
            <div className="absolute right-0 mt-2 bg-white border shadow-md rounded w-40 z-10">
              <button
                className={`block w-full text-left px-4 py-2 text-sm ${selectedLocation === "" ? "bg-gray-200" : "hover:bg-gray-100"}`}
                onClick={() => { setSelectedLocation(""); setIsFilterOpen(false); }}
              >
                All Locations
              </button>
              {uniqueLocations.map((location) => (
                <button
                  key={location}
                  className={`block w-full text-left px-4 py-2 text-sm ${selectedLocation === location ? "bg-gray-200" : "hover:bg-gray-100"}`}
                  onClick={() => { setSelectedLocation(location); setIsFilterOpen(false); }}
                >
                  {location}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Item List */}
      <ul className="space-y-2">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onSelectItem(item)}
                className="w-full text-left p-2 border rounded hover:bg-gray-100 transition"
              >
                <h3 className="font-medium">{item.name}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
                <p className="text-xs text-gray-500">{item.location}</p>
              </button>
            </li>
          ))
        ) : (
          <li className="text-gray-500 text-center">No items found</li>
        )}
      </ul>
    </div>
  );
};

export default ItemList;
