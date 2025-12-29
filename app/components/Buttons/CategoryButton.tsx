import { Button } from "@heroui/react";
import React from "react";
import Link from "next/link";

interface CategoryButtonProps {
  name: string;
  onPress: () => void;
  href?: string;
}

export default function CategoryButton({
  name,
  onPress,
  href,
}: CategoryButtonProps) {

  const SPECIAL_NAMES = [
    "treated pine",
    "untreated pine",
    "posts",
    "fencing",
    "sleepers",
    "decking",
  ];

  const content = (
    <Button
      onPress={onPress}
      className={`w-full h-full flex flex-col items-center justify-center font-semibold font-['Inter']`}
      style={{
        whiteSpace: "normal",
        wordBreak: "keep-all",
        lineHeight: "1.0",
      }}
    >
      <span lang="en">{name}</span>
    </Button>
  );

  return (
    <div
      className={`w-16 h-12 rounded-lg border text-[11px] tracking-wide border-gray-300 ${SPECIAL_NAMES.includes(name.toLowerCase()) ? "bg-green-500/10" : "bg-white"}  `}
    >
      {href ? (
        <Link href={`/${href}`} className="block w-full h-full">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}