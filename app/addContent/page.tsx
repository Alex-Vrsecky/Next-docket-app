import React from "react";
import AddCategory from "./AddCategory";
import AddSubCategory from "./AddSubCategory";
import AddProduct from "./AddProduct";
import Button from "../components/Button";
import Navigation from "../components/Navigation";

export default function AddNewContent() {
  return (
    <div className="flex flex-col gap-20 items-center justify-items-center min-h-screen p-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <Navigation />
      <h1>Add New Content</h1>
      <div className="flex flex-col gap-6">
        <AddCategory />
        <AddSubCategory />
        <AddProduct />
        {/* <Button>Add All</Button> */}
      </div>
    </div>
  );
}
