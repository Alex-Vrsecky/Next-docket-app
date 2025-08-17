"use client";

import React from "react";
import { usePathname } from "next/navigation";
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
  onEdit,
}: {
  p: ProductInterface;
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
}) {
  const pathname = usePathname();
  const isManage = pathname === "/viewContent";

  const priceText = p.priceWithNote?.trim() || "—";

  return (
    <div className="relative max-w-[380px]">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-[rgb(13,82,87)]">
        {/* Header */}
        <div className="flex items-start gap-4 p-4">
          <div className="relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-xl ring-1 ring-gray-200 bg-gray-50">
            {p.imageSrc ? (
              <Image
                alt={p.Desc || "Product image"}
                src={p.imageSrc}
                fill
                sizes="68px"
                className="object-cover"
              />
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500 truncate">
              IN: {p.productIN || "—"}
            </p>
            <h3 className="mt-1 text-base font-semibold text-gray-900 line-clamp-2">
              {p.Desc || "Unnamed product"}
            </h3>

            <div className="mt-1 flex flex-wrap items-center gap-2">
              {p.category && (
                <span className="inline-flex items-center rounded-full bg-[rgb(13,82,87)] px-2.5 py-0.5 text-xs font-medium text-white">
                  {p.category}
                </span>
              )}
              {p.subCategory && (
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
                  {p.subCategory}
                </span>
              )}
              {p.Length && (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
                  {p.Length}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-100" />

        {/* Body */}
        <div className="px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="mb-0.5 text-xs text-gray-500">Price (approx)</p>
              <p className="text-lg font-semibold tracking-tight">
                {priceText}
              </p>

              {p.Extra && (
                <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                  {p.Extra}
                </p>
              )}
              {p.LengthCoveragePackaging && (
                <p
                  title={p.LengthCoveragePackaging}
                  className="mt-1 cursor-help text-xs text-gray-500 line-clamp-1"
                >
                  {p.LengthCoveragePackaging}
                </p>
              )}
            </div>

            {/* Quick actions (manage only) */}
            {isManage && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => onEdit?.(p.id)}
                  className="rounded-lg bg-[rgb(13,82,87)] px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[rgb(13,82,87)]"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (
                      confirm(
                        `Delete product "${
                          p.productIN || p.id
                        }"? This cannot be undone.`
                      )
                    ) {
                      onDelete(p.productIN);
                    }
                  }}
                  className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="h-px bg-gray-100" />

        {/* Footer */}
        <div className="px-4 pb-4">
          <div className="flex w-full items-center justify-center rounded-xl bg-white p-2 ring-1 ring-gray-200">
            <Barcode
              value={p.productIN || "0000000"}
              height={44}
              width={2}
              fontSize={12}
              background="#ffffff"
              lineColor="#111827"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
