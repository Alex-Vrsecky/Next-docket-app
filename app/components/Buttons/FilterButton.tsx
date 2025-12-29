import { Button } from '@heroui/react'
import React from 'react'

interface FilterButtonProps {
    name: string;
    onPress: () => void;
}

export default function FilterButton({name, onPress}: FilterButtonProps) {
  return (
    <div
      className={`w-[62px] p-1 rounded-lg bg-white border border-gray-300 overflow-hidden`}
    >
      <Button
        onPress={onPress}
        className="!w-full !h-full flex flex-col items-center justify-center text-black text-[10px] font-bold font-['Inter'] !p-1 !min-w-0"
        style={{
          whiteSpace: "normal",
          wordBreak: "break-all",
          lineHeight: "1.1",
        }}
      >
        {name}
      </Button>
    </div>
  );
}