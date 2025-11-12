import { Button } from "@heroui/react";
import React from "react";

interface LocalNavigationButtonProps {
  name: string;
  onPress: () => void;
  isActive?: boolean;
}

export default function LocalNavigationButton({
  name,
  onPress,
  isActive = false,
}: LocalNavigationButtonProps) {
  return (
    <div
      className="w-full h-6 rounded-lg border border-gray-300 "
      style={{ backgroundColor: isActive ? "#0D5257" : "white" }}
    >
      <Button
        onPress={onPress}
        className="w-full h-full flex items-center justify-center text-[10px] font-bold font-['Inter']"
        style={{ color: isActive ? "#FFFFFF" : "black" }}
      >
        {name}
      </Button>
    </div>
  );
}