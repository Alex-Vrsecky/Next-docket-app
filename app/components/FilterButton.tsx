import { Button } from '@heroui/react'
import React from 'react'

interface FilterButtonProps {
    name: string;
    onPress: () => void;
}

export default function FilterButton({name, onPress}: FilterButtonProps) {
  return (
    <div className={`${name.length <= 10 ? "w-16 h-10" : "w-20 h-16"} rounded-lg bg-white border border-gray-300 )]`}>
      <Button
        onPress={onPress}
        className="w-full h-full flex flex-col items-center justify-center gap-1 text-black text-[12px] font-bold font-['Inter']"
      >
        {name}
      </Button>
    </div>
  )
}
