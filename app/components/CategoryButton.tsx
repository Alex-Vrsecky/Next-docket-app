import { Button } from "@heroui/react";
import React from "react";
import Image from "next/image";
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
  const content = (
    <Button
      onPress={onPress}
      className="w-20 h-18 flex flex-col items-center justify-center text-black text-[10px] font-bold font-['Inter']"
    >
      <Image
        src="/block-brick.svg"
        alt="image"
        width={20}
        height={20}
        className="w-5 h-5 object-contain"
      />
      {name}
    </Button>
  );

  return (
    <div className="w-20 h-18 rounded-lg bg-white border border-gray-300">
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