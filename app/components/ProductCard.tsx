"use client";

import React from "react";
import { usePathname } from "next/navigation"; // ← Top‐level hook
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react";
import Image from "next/image";
import Barcode from "react-barcode";

interface ProductInterface {
  Desc: string;
  Extra: string;
  LengthCoveragePackaging: string;
  category: string;
  id: string;
  imageSrc: string;
  priceWithNote: string;
  productIN: string;
  subCategory: string;
  Length: string;
}

export default function ProductCard({
  p,
  onDelete,
}: {
  p: ProductInterface;
  onDelete: (id: string) => void;
}) {
  const pathname = usePathname();

  return (
    <div className="relative shadow-lg rounded-2xl overflow-hidden max-w-[350px]">
      <Card className="max-w-[400px]">
        <CardHeader className="flex items-start gap-4 p-4">
          <Image
            alt="product image"
            height={60}
            width={60}
            src={p.imageSrc!}
            className="rounded-md object-cover"
          />
          <div className="flex flex-col gap-1">
            <p className="text-sm text-gray-500">IN: {p.productIN}</p>
            <p className="text-base font-semibold text-black">{p.Desc}</p>
            <div>
              <p className="text-xs text-gray-500">Description:</p>
              <p className="text-sm text-gray-700">{p.subCategory}</p>
            </div>
          </div>
        </CardHeader>

        <Divider />

        <CardBody className="flex flex-wrap flex-row justify-center text-sm m-2">
          <Dropdown className="flex justify-center">
            <DropdownTrigger>
              <Button variant="bordered">Open Menu</Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Static Actions"
              className="bg-white w-[200px] text-left"
            >
              <DropdownItem key="desc" />
              <DropdownItem key="cat">
                <span>
                  <p className="text-xs text-gray-600">Category:</p>
                  <p>{p.category}</p>
                </span>
              </DropdownItem>
              <DropdownItem key="subcat">
                <span>
                  <p className="text-xs text-gray-600">Sub Category:</p>
                  <p>{p.subCategory}</p>
                </span>
              </DropdownItem>
              <DropdownItem key="price">
                <span>
                  <p className="text-xs text-gray-600">Price (Rough):</p>
                  <p>{p.priceWithNote}</p>
                </span>
              </DropdownItem>

              {/* always-render, but hide/unhide via CSS */}
              <DropdownItem
                key="delete"
                className={`pt-5 transition-opacity ${
                  pathname === "/viewContent"
                    ? "opacity-100"
                    : "opacity-0 pointer-events-none"
                }`}
                onClick={() => {
                  if (
                    pathname === "/viewContent" &&
                    confirm(`Delete product "${p.productIN}"?`)
                  ) {
                    onDelete(p.id);
                  }
                }}
              >
                <div className="text-xs text-red-500 bg-red-100 rounded-xl text-center py-1">
                  Delete Product
                </div>
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </CardBody>

        <Divider />

        <CardFooter className="flex justify-center px-4">
          <Barcode value={p.productIN} height={40} width={2.5} fontSize={12} />
        </CardFooter>
      </Card>
    </div>
  );
}
