'use client';

import type {
  ButtonHTMLAttributes,
  PropsWithChildren,
} from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  PropsWithChildren<unknown>;

export default function Button(props: ButtonProps) {
  return (
    <button
      {...props}
      className="bg-[#0d5257] px-6 py-1 cursor-pointer text-white"
    >
      {props.children}
    </button>
  );
}
