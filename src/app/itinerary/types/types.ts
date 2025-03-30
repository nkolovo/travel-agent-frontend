export interface User {
  id?: number;
  username: string;
  password?: string;  // Typically, this would not be sent to the frontend for security reasons
  role?: Role;  // Role of the user
  itineraries?: Itinerary[];  // List of itineraries associated with the user
}

export interface Role {
  id: number;
  name: string;  // Assuming you have a name or role description in the Role entity
}

export interface Client {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  itineraries?: Itinerary[];  // List of itineraries associated with the client
}

export interface Itinerary {
  id?: number;
  name?: string;
  agent: string,
  createdDate: string;
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
  user: User;
  client: Client;
  dates?: Date[] | null;
}

export interface Date {
  name: string;
  location: string;
  date: string;
}

export interface Item {
  id: number;
  name: string;
  description: string;
  location: string;
}

export interface Activity {
  subheading: string;
  description: string;
}
