import React from "react";

export default function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> &
    React.PropsWithChildren<unknown>
) {
  // This component can be used to create a button with specific styles or functionality.
  // You can pass props to customize the button's appearance or behavior.
  return (
    <button
      {...props}
      className=" bg-[#0d5257] px-6 py-1 cursor-pointer text-white"
    >
      {props.children}
    </button>
  );
}
