export interface User {
  id?: number;
  username: string;
  role?: Role;
  itineraries?: Itinerary[];
}

export interface Role {
  id: number;
  name: string;
}

export interface Client {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  itineraries?: Itinerary[];
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
  netPrice: number;
  status?: string;
  docsSent?: boolean;
  coverImageUrl?: string;
  notes?: string;
  client: string;
  dates?: Date[] | null;
}

export interface Traveler {
  id?: number;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  passportNumber?: string;
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
  retailPrice: number;
  netPrice: number;
  priority?: number;
  imageNames?: string[];
  imageUrls?: string[];
  supplierId?: number;
  supplierCompany?: string;
  supplierName?: string;
  supplierNumber?: string;
  supplierEmail?: string;
  supplierUrl?: string;
  notes?: string;
}

export interface Activity {
  id?: number;
  date: Date;
  item: Item;
  country: string;
  location: string;
  category: string;
  name: string;
  description: string;
  retailPrice: number;
  netPrice: number;
  priority: number;
  pdfName?: string;
  imageNames?: string[];
  imageUrls?: string[];
  supplierId?: number;
  supplierCompany?: string;
  supplierName?: string;
  supplierNumber?: string;
  supplierEmail?: string;
  supplierUrl?: string;
  notes?: string;
}

export interface Supplier {
  id?: number;
  company?: string;
  name?: string;
  number?: string;
  email?: string;
  url?: string;
  deleted: boolean;
}
