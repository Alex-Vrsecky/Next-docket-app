// types/index.ts
export interface Product {
  id: string;
  name: string;
  description?: string;
  quantity?: number;
  // Add other product fields as needed
}

export interface SavedList {
  id: string;
  name: string;
  products: Product[];
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  uid: string;
  firstName: string;
  lastName: string;
  email?: string;
}