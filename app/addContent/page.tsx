import React from "react";
import AddProduct from "./AddProduct";
import Navigation from "../components/Navigation";

export default function AddNewContent() {
  return (
    <div className="flex flex-col gap-20 items-center justify-items-center min-h-screen p-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <Navigation />
      <h1>Add New Content</h1>
      <div className="flex flex-col gap-6">
        <AddProduct />
        {/* <Button>Add All</Button> */}
      </div>
    </div>
  );
}
