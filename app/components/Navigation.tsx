import Link from "next/link";
import React from "react";

export default function Navigation() {
  return (
    <div className="flex justify-center bg-[rgb(13,82,87)] w-full p-4">
      <ul className="flex items-center gap-5">
        <li className="text-white text-sm sm:text-lg font-semibold hover:bg-white hover:text-[rgb(13,82,87)] rounded-md px-2 py-1">
          <Link href="/">Home</Link>
        </li>
        <li className="text-white text-sm sm:text-lg font-semibold hover:bg-white hover:text-[rgb(13,82,87)] rounded-md px-2 py-1">
          <Link href="/viewContent" className="flex items-center">
            Delete/View/Delete
          </Link>
        </li>
        <li className="text-white text-sm sm:text-lg font-semibold hover:bg-white hover:text-[rgb(13,82,87)] rounded-md px-2 py-1">
          <Link href="/addContent">Add Product</Link>
        </li>
      </ul>
    </div>
  );
}
