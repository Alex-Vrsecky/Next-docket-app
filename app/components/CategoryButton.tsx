import { Button } from "@heroui/react";
import React from "react";
import Image from 'next/image'

interface CategoryButtonProps {
  name: string;
  onPress: () => void;
}

export default function CategoryButton({ name, onPress }: CategoryButtonProps) {
  return (
    <div className="w-16 h-16 rounded-lg bg-white border border-gray-300 ">
      <Button
        onPress={onPress}
        className="w-full h-full flex flex-col items-center justify-center gap-1 text-black text-[9px] font-bold font-['Inter']"
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
    </div>
  );
}
