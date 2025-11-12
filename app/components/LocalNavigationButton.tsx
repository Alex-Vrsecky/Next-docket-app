import { Button } from "@heroui/react";
import React from "react";

interface LocalNavigationButtonProps {
    name: string;
    onPress: () => void;
}

export default function LocalNavigationButton({name, onPress}: LocalNavigationButtonProps) {
  return (
    <div>
      <div className="w-40 h-6 relative rounded-lg">
        <div className="w-40 h-6 left-0 top-0 absolute bg-white rounded-lg shadow-[0px_0px_4px_1px_rgba(0,0,0,0.25)]" />
          <Button
            onPress={onPress}
            className="left-[60px] top-[6px] text-center justify-start text-black text-[10px] font-bold font-['Inter']"
          >
            {name}
          </Button>
      </div>
    </div>
  );
}
