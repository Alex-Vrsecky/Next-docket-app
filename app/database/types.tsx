// types/index.ts
export interface Product {
  id: string;
  name: string;
  description?: string;
  quantity?: number;
  length: string;
  productIN: string;
}

export interface SavedList {
  id: string;
  name: string;
  products: ProductItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  uid: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface ProductItem {
  productId: string;
  productIN: string;
  productDesc: string;
  category: string;
  subCategory: string;
  Length: string;
  quantity: number;
  addedAt: string;
  note?: string;
}