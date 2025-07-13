// app/components/ProductCard.tsx
"use client";

import Image from "next/image";
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
}

export default function ProductCard({ p }: { p: ProductInterface }) {
  return (
    <div className="relative shadow-lg rounded-2xl overflow-hidden max-w-[350px]">
      <Card className="max-w-[400px]">
        <CardHeader className="flex gap-3 p-2">
          <Image
            alt="heroui logo"
            height={40}
            radius="sm"
            src={p.imageSrc!}
            width={40}
          />
          <div className="flex flex-col py-2">
            <p className="text-md">IN: {p.productIN}</p>
            <p className="text-lg text-default-500 font-bold">
              {p.subCategory}
            </p>
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
              className=" bg-white w-[200px] text-left"
            >
              <DropdownItem key="desc">
                <span>
                  <p className="text-xs text-gray-600">Desciption:</p>
                  <p>{p.Desc}</p>
                </span>
              </DropdownItem>
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
              <DropdownItem
                key="delete"
                className="text-danger text-xs text-red-500 pt-5 bg-red-100 rounded-xl text-center"
                color="danger"
              >
                Delete file
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
