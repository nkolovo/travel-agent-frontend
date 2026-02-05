import React, { useState } from "react";
import { Item } from "./types/types";
import { FiSearch, FiFilter, FiEdit, FiX } from "react-icons/fi"; // Import icons
import ItemModal from "./itemModal"; // Import the modal component
import DOMPurify from "dompurify";

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
  Ferry: { base: "bg-blue-100", hover: "hover:bg-blue-200" },
  Cruise: { base: "bg-blue-100", hover: "hover:bg-blue-200" },
  Info: { base: "bg-yellow-100", hover: "hover:bg-yellow-200" },
};

const ItemList: React.FC<ItemListProps> = ({ items, onSelectItem, onChange }) => {
  const [searchTerm, setSearchTerm] = useState(""); // State for search input
  const [selectedCountry, setSelectedCountry] = useState(""); // State for country filter
  const [selectedLocation, setSelectedLocation] = useState(""); // State for location filter
  const [selectedCategory, setSelectedCategory] = useState(""); // State for category filter
  const [isFilterOpenCountry, setIsFilterOpenCountry] = useState(false); // Toggle country filter dropdown
  const [isFilterOpenLocation, setIsFilterOpenLocation] = useState(false); // Toggle location filter dropdown
  const [isFilterOpenCategory, setIsFilterOpenCategory] = useState(false); // Toggle category filter dropdown

  const [selectedItem, setSelectedItem] = useState<Item | undefined>(); // State for selected item
  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal visibility
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Helper function to truncate long descriptions while preserving HTML formatting
  const truncateDescription = (description: string, maxLength: number = 100): string => {
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

  // Get unique countries & locations from items
  const uniqueCountries = [...new Set(items.map((item) => item.country))];
  const uniqueLocations = [...new Set(items.map((item) => item.location))];
  const uniqueCategories = [...new Set(items.map((item) => item.category))];

  // Filter items based on search term & selected country, location, and category
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCountry === "" || item.country === selectedCountry) &&
    (selectedLocation === "" || item.location === selectedLocation) &&
    (selectedCategory === "" || item.category === selectedCategory)
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
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/items/remove/${item.id}`, {
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
      onChange(items); // Notify parent component of changes
      setSuccessMessage("Item saved successfully");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 5000);
    }
  };

  return (
    <div className="p-2 bg-white rounded shadow-md h-full flex flex-col">
      <h2 className="text-base font-semibold mb-2">Item List</h2>
      <button
        onClick={onAddItemClick}
        className="mb-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
      >
        Add
      </button>

      {/* Render the modal */}
      {isModalOpen && <ItemModal isOpen={isModalOpen} closeModalItem={closeModal} item={selectedItem} />}

      {/* Search Bar & Filter */}
      <div className="relative mb-2 flex items-center">
        {/* Search Icon */}
        <FiSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />

        {/* Search Input */}
        <input
          type="text"
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-7 pr-14 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
        />

        {/* Filter Icons */}
        <div className="relative">
          <button
            onClick={() => setIsFilterOpenCountry(!isFilterOpenCountry)}
            className="absolute right-11 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
            title="Filter by Country"
          >
            <FiFilter className="text-sm" />
          </button>
          <button
            onClick={() => setIsFilterOpenLocation(!isFilterOpenLocation)}
            className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
            title="Filter by Location"
          >
            <FiFilter className="text-sm" />
          </button>
          <button
            onClick={() => setIsFilterOpenCategory(!isFilterOpenCategory)}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
            title="Filter by Category"
          >
            <FiFilter className="text-sm" />
          </button>
          {/* Dropdown for Country Filter */}
          {isFilterOpenCountry && (
            <div className="absolute right-0 mt-2 bg-white border shadow-md rounded w-32 z-10 max-h-32 overflow-y-auto">
              <button
                className={`block w-full text-left px-2 py-1 text-xs ${selectedCountry === "" ? "bg-gray-200" : "hover:bg-gray-100"}`}
                onClick={() => { setSelectedCountry(""); setIsFilterOpenCountry(false); }}
              >
                All Countries
              </button>
              {uniqueCountries.map((country) => (
                <button
                  key={country}
                  className={`block w-full text-left px-2 py-1 text-xs ${selectedCountry === country ? "bg-gray-200" : "hover:bg-gray-100"}`}
                  onClick={() => { setSelectedCountry(country); setIsFilterOpenCountry(false); }}
                >
                  {country}
                </button>
              ))}
            </div>
          )}
          {/* Dropdown for Location Filter */}
          {isFilterOpenLocation && (
            <div className="absolute right-0 mt-2 bg-white border shadow-md rounded w-32 z-10 max-h-32 overflow-y-auto">
              <button
                className={`block w-full text-left px-2 py-1 text-xs ${selectedLocation === "" ? "bg-gray-200" : "hover:bg-gray-100"}`}
                onClick={() => { setSelectedLocation(""); setIsFilterOpenLocation(false); }}
              >
                All Locations
              </button>
              {uniqueLocations.map((location) => (
                <button
                  key={location}
                  className={`block w-full text-left px-2 py-1 text-xs ${selectedLocation === location ? "bg-gray-200" : "hover:bg-gray-100"}`}
                  onClick={() => { setSelectedLocation(location); setIsFilterOpenLocation(false); }}
                >
                  {location}
                </button>
              ))}
            </div>
          )}
          {/* Dropdown for Category Filter */}
          {isFilterOpenCategory && (
            <div className="absolute right-0 mt-2 bg-white border shadow-md rounded w-32 z-10 max-h-32 overflow-y-auto">
              <button
                className={`block w-full text-left px-2 py-1 text-xs ${selectedCategory === "" ? "bg-gray-200" : "hover:bg-gray-100"}`}
                onClick={() => { setSelectedCategory(""); setIsFilterOpenCategory(false); }}
              >
                All Categories
              </button>
              {uniqueCategories.map((category) => (
                <button
                  key={category}
                  className={`block w-full text-left px-2 py-1 text-xs ${selectedCategory === category ? "bg-gray-200" : "hover:bg-gray-100"}`}
                  onClick={() => { setSelectedCategory(category); setIsFilterOpenCategory(false); }}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Item List */}
      <div className="flex-1 overflow-y-auto">
        <ul className="space-y-1">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <li key={item.id}>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onSelectItem(item)}
                    className={`flex-1 text-left p-1 border rounded hover:bg-gray-100 transition 
                      ${categoryColors[item.category]?.base || ""} 
                      ${categoryColors[item.category]?.hover || ""}`}
                  >
                    <h3 className="font-medium text-xs" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.name) }} />
                    <p className="text-xs text-gray-600" dangerouslySetInnerHTML={{ __html: truncateDescription(item.description, 50) }} />
                    <p className="text-xs text-gray-500">{item.location}</p>
                    {item.retailPrice > 0 ?
                      <p className="text-xs text-gray-700">€{item.retailPrice.toLocaleString()}</p>
                      : null
                    }
                  </button>
                  <button
                    onClick={() => onItemEdit(item)}
                    className="text-gray-600 hover:text-blue-600 transition duration-150 p-1"
                    tabIndex={-1}
                  >
                    <FiEdit className="text-xs" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
                        onDeleteItem(item);
                      }
                    }}
                    className="text-red-600 hover:text-red-800 transition duration-150 text-sm p-1"
                    tabIndex={-1}
                  >
                    <FiX />
                  </button>
                </div>
              </li>
            ))
          ) : (
            <li className="text-gray-500 text-center text-xs">No items found</li>
          )}
        </ul>
      </div>
      {showSuccessToast && (
        <div className="toast-notification">
          <span>✓ {successMessage}</span>
        </div>
      )}
    </div>
  );
};

export default ItemList;