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
      className="w-full h-full flex flex-col items-center justify-center text-black text-[9px] font-bold font-['Inter']"
      style={{
        whiteSpace: "normal",
        wordBreak: "keep-all",
        lineHeight: "1.0",
      }}
    >
      <Image
        src="/block-brick.svg"
        alt="image"
        width={20}
        height={20}
        className="w-5 h-5 object-contain break-words"
      />
      <span lang="en">{name}</span>
    </Button>
  );

  return (
    <div className="w-16 h-16 rounded-lg bg-white border border-gray-300 break-words">
      {href ? (
        <Link href={`/${href}`} className="block w-full h-full break-words">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}