"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { Itinerary } from "../itinerary/types/types";
import ItemModal from "../itinerary/itemModal";
import SupplierModal from "./supplierModal";

interface DecodedToken {
  sub: string;
}

const columnMapping: Record<string, keyof Itinerary> = {
  "Agent": "agent",
  "Date of Creation": "createdDate",
  "Date Sold": "dateSold",
  "Reservation Number": "reservationNumber",
  "Lead Name": "leadName",
  "Number of Travelers": "numTravelers",
  "Arrival Date": "arrivalDate",
  "Departure Date": "departureDate",
  "Trip Price": "tripPrice",
  "Net Price": "netPrice",
  "Status": "status",
  "Travel Docs Sent": "docsSent",
};

export default function Dashboard() {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [filters, setFilters] = useState({
    reservationNumber: "",
    leadName: ""
  });
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [newItinerary, setNewItinerary] = useState({
    agent: "", // Autofilled from logged-in user
    createdDate: new Date().toISOString().split("T")[0], // Today's date
    editedDate: new Date().toISOString().replace("T", " ").replace("Z", "").split(".")[0], // Today's date
    reservationNumber: "", // To be fetched from the database
    leadName: "",
    numTravelers: 0
  });

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
      try {
        const decoded: DecodedToken = jwtDecode(token);
        setNewItinerary((prev) => ({ ...prev, agent: decoded.sub })); // Autofill agent
      } catch (error) {
        console.error("Invalid token:", error);
      }
    }
    if (token) {
      fetchItineraries();

      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/itineraries/latest-reservation`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.text())  // Use `.text()` to handle plain text
        .then((resNum) => {
          setNewItinerary((prev) => ({ ...prev, reservationNumber: resNum }));
        })
        .catch((err) => console.error("Error fetching reservation number:", err));
    }
  }, [router]);

  const fetchItineraries = async () => {
    let url = `${process.env.NEXT_PUBLIC_API_URL}/api/itineraries`;

    // Add filters if they exist
    if (filters.reservationNumber || filters.leadName) {
      url += `?${new URLSearchParams(Object.entries(filters).filter(([, v]) => v?.trim())).toString()}`;
    }

    fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setItineraries(data);
      })
      .catch((err) => console.error("Error fetching itineraries:", err));
  };

  const handleSort = (column: keyof Itinerary) => {
    const order = sortColumn === column && sortOrder === "asc" ? "desc" : "asc";

    setSortColumn(column);
    setSortOrder(order);

    setItineraries([...itineraries].sort((a, b) => {
      const valueA = a[column];
      const valueB = b[column];

      if (typeof valueA === "string" && typeof valueB === "string") {
        return order === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
      }

      if (typeof valueA === "number" && typeof valueB === "number") {
        return order === "asc" ? valueA - valueB : valueB - valueA;
      }

      if (typeof valueA === "boolean" && typeof valueB === "boolean") {
        return order === "asc" ? Number(valueA) - Number(valueB) : Number(valueB) - Number(valueA);
      }

      // Handle null/undefined values (move them to the end)
      if (valueA == null) return 1;
      if (valueB == null) return -1;

      return 0;
    }));
  };

  const handleFilterChange = (e: { target: { name: any; value: any; }; }) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleFilterResults = async () => {
    fetchItineraries();
  }

  const handleKeyDownFilter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && (filters.reservationNumber.length === 8 || (filters.leadName && filters.reservationNumber.length === 0) || (filters.reservationNumber.length === 0 && filters.leadName) || (!filters.reservationNumber && !filters.leadName)))
      handleFilterResults();
  }

  const handleNewItineraryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewItinerary((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAddItinerary = async () => {
    if (!newItinerary.leadName.trim() || !newItinerary.numTravelers) {
      window.alert("Please enter the Lead Name and Number of Travelers.");
      return;
    }

    const itinerary: Itinerary = {
      agent: newItinerary.agent,
      createdDate: newItinerary.createdDate,
      editedDate: newItinerary.editedDate,
      reservationNumber: newItinerary.reservationNumber,
      leadName: newItinerary.leadName,
      numTravelers: newItinerary.numTravelers,
      tripPrice: 0,
      netPrice: 0,
      status: "Proposal",
      client: newItinerary.leadName,
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/itineraries/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(itinerary),
    });

    if (response.ok) {
      const result = await response.json();
      const itineraryId = result.id;
      const queryString = new URLSearchParams({
        agent: newItinerary.agent,
        createdDate: newItinerary.createdDate,
        reservationNumber: newItinerary.reservationNumber,
        leadName: newItinerary.leadName,
        numTravelers: newItinerary.numTravelers.toString(),
      }).toString();

      router.push(`/itinerary/${itineraryId}?${queryString}`);
    } else {
      console.error("Error creating itinerary");
    }
  };

  const handleKeyDownItinerary = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && (newItinerary.leadName && newItinerary.numTravelers))
      handleAddItinerary();
  }

  const handleEditItinerary = (itinerary: Itinerary) => {
    const queryString = new URLSearchParams({
      agent: itinerary.agent,
      createdDate: itinerary.createdDate,
      reservationNumber: itinerary.reservationNumber,
      leadName: itinerary.leadName,
      numTravelers: itinerary.numTravelers.toString(),
    }).toString();
    router.push(`/itinerary/${itinerary.id}?${queryString}`);
  }

  const openItemModal = () => {
    setIsItemModalOpen(true);
  }

  const openSupplierModal = () => {
    setIsSupplierModalOpen(true);
  }

  const closeItemModal = () => {
    setIsItemModalOpen(false);
  };

  const closeSupplierModal = () => {
    setIsSupplierModalOpen(false);
  };

  return (
    <div>
      {isAuthenticated ? (
        <div className="container mx-auto p-8">
          <h1 className="text-center text-3xl sm:text-4xl font-semibold text-gray-900 tracking-tight mb-6">Dashboard</h1>
          <div className="flex justify-left gap-3 mb-8">
            <button className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600" onClick={() => openItemModal()}>Add Item</button>
            <button className="bg-emerald-500 text-white px-4 py-2 rounded shadow hover:bg-emerald-600" onClick={() => openSupplierModal()}>Add/Edit Supplier</button>
            {/* Render the modal */}
            {isItemModalOpen && <ItemModal isOpen={isItemModalOpen} closeModalItem={closeItemModal} />}
            {/* Render the modal */}
            {isSupplierModalOpen && <SupplierModal isOpen={isSupplierModalOpen} closeModalSupplier={closeSupplierModal} />}
          </div>
          <div className="flex flex-wrap sm:space-y-4 md:space-y-4 justify-between items-center mb-6 p-4 bg-gray-100 rounded-lg shadow-md overflow-x-auto">
            <div className="flex space-x-4">
              <input type="text" id="agent" name="agent" value={newItinerary.agent} readOnly className="p-2 border rounded bg-gray-200" />
              <input type="text" id="createdDate" name="createdDate" value={new Date(newItinerary.createdDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} readOnly className="p-2 border rounded bg-gray-200" />
              <input type="text" id="reservationNumber" name="reservationNumber" value={newItinerary.reservationNumber} readOnly className="p-2 border rounded bg-gray-200" />
              <div className="flex flex-col">
                <input type="text" id="leadName" name="leadName" placeholder="Lead Name" value={newItinerary.leadName} onKeyDown={handleKeyDownItinerary} onChange={handleNewItineraryChange} className="p-2 border rounded" />
                <span className="text-xs text-gray-500 mt-1">Last / First, Middle</span>
              </div>
              <div className="flex flex-col">
                <input type="number" id="numTravelers" name="numTravelers" placeholder="Number of Adults" value={newItinerary.numTravelers} onKeyDown={handleKeyDownItinerary} onChange={handleNewItineraryChange} min="1" className="p-2 border rounded" />
                <span className="text-xs text-gray-500 mt-1">Number of Travelers</span>
              </div>
            </div>
            <button className={`bg-blue-500 text-white px-4 py-2 rounded ${newItinerary.leadName && newItinerary.numTravelers > 0 ? "bg-blue-500 text-white" : "bg-gray-400 cursor-not-allowed"}`} onClick={handleAddItinerary}>Add Itinerary</button>
          </div>

          <div className="mt-10 flex justify-between items-center mb-6 p-4 bg-gray-100 rounded-lg shadow-md">
            <div className="flex space x-4">
              <div className="flex space-x-4">
                <label htmlFor="leadName" className="block text-grey-600 self-center">Search By:</label>
                <input type="text" id="reservationNumber" name="reservationNumber" placeholder="Reservation Number" value={filters.reservationNumber} onKeyDown={handleKeyDownFilter} onChange={handleFilterChange} className="p-2 border rounded" />
                <input type="text" id="leadName" name="leadName" placeholder="Lead Name" value={filters.leadName} onKeyDown={handleKeyDownFilter} onChange={handleFilterChange} className="p-2 border rounded" />
                <button className={`bg-blue-500 text-white px-4 py-2 rounded ${filters.reservationNumber.length === 8 || (filters.leadName && filters.reservationNumber.length === 0) || (filters.reservationNumber.length === 0 && filters.leadName) || (!filters.reservationNumber && !filters.leadName) ? "bg-blue-500 text-white" : "bg-gray-400 cursor-not-allowed"}`} onClick={handleFilterResults}>Search</button>
              </div>
            </div>
          </div>

          <table className="w-full border-collapse border border-gray-300 shadow-md">
            <thead className="bg-gray-200">
              <tr>
                {Object.keys(columnMapping).map((col) => (
                  <th
                    key={col}
                    className="p-2 border cursor-pointer text-sm"
                    onClick={() => handleSort(columnMapping[col])}
                  >
                    {col} {sortColumn === columnMapping[col] ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {itineraries.map((itinerary) => (
                <tr
                  key={itinerary.id}
                  onClick={() => handleEditItinerary(itinerary)}
                  className="hover:bg-gray-100"
                >
                  {Object.keys(columnMapping).map((col) => {
                    const property = columnMapping[col as keyof typeof columnMapping]; // Get the Itinerary property
                    let value = itinerary[property]; // Get the value from the itinerary object

                    // Format values properly
                    if (property === "createdDate" || property === "editedDate" || property === "arrivalDate" || property === "departureDate") {
                      value = value ? new Date(value as string).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : "N/A";
                    }
                    if (property === "tripPrice") {
                      value = value ? `$${value.toLocaleString()}` : "N/A";
                    } if (property === "netPrice") {
                      value = value ? `$${value.toLocaleString()}` : "N/A";
                    } else if (property === "docsSent") {
                      value = value ? "Yes" : "No";
                      return <td key={col} className={`p-2 border text-sm ${value === "Yes" ? 'bg-green-500' : 'bg-red-500 text-white'}`}>{value.toString()}</td>;
                    } else {
                      value = value ?? "N/A";
                    }

                    return <td key={col} className="p-2 border text-sm">{value.toString()}</td>;
                  })}
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      ) : (
        <p>Redirecting...</p>
      )}
    </div>
  );
}
