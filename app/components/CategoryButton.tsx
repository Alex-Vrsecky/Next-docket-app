import { Button } from "@heroui/react";
import React from "react";
import Image from 'next/image'

interface CategoryButtonProps {
  name: string;
  onPress: () => void;
}

export default function CategoryButton({ name, onPress }: CategoryButtonProps) {
  return (
    <div>
      <div className="w-16 h-16 relative rounded-lg">
        <div className="w-16 h-16 relative rounded-lg bg-white shadow-[0px_0px_4px_1px_rgba(0,0,0,0.25)]">
          <Image
            src="@public/block-brick.svg"
            alt={"image"}
            width={20}
            height={20}
            className="w-full h-full object-contain rounded-lg"
          />

          <Button
            onPress={onPress}
            className="w-full h-full flex items-end justify-center pb-1 text-black text-[9px] font-bold font-['Inter']"
          >
            {name}
          </Button>
        </div>
      </div>
    </div>
  );
}
