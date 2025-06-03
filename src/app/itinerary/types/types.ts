export interface User {
  id?: number;
  username: string;
  password?: string; // Typically, this would not be sent to the frontend for security reasons
  role?: Role; // Role of the user
  itineraries?: Itinerary[]; // List of itineraries associated with the user
}

export interface Role {
  id: number;
  name: string; // Assuming you have a name or role description in the Role entity
}

export interface Client {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  itineraries?: Itinerary[]; // List of itineraries associated with the client
}

export interface Itinerary {
  id?: number;
  name?: string;
  agent: string;
  createdDate: string;
  editedDate: string;
  dateSold?: string;
  reservationNumber: string;
  leadName: string;
  numTravelers: number;
  arrivalDate?: string;
  departureDate?: string;
  tripPrice: number;
  status?: string;
  docsSent?: boolean;
  image?: string | null;
  imageType?: string;
  client: String;
  dates?: Date[] | null;
}

export interface Date {
  id?: number;
  name: string;
  location: string;
  date: string;
}

export interface Item {
  id?: number;
  country: string;
  location: string;
  category: string;
  name: string;
  description: string;
}

export interface Activity {
  id?: number;
  date: Date;
  item: Item;
  name: string;
  description: string;
}
