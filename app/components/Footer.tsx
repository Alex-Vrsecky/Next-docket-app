"use client";

import { useEffect, useState } from "react";

export function Footer() {
  const [year, setYear] = useState(2026);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="w-full bg-gray-100 mt-8 rounded-t-lg">
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row justify-between items-center">
        <p className="text-gray-600 text-sm">
          © {year} Docket App. All rights reserved. <br />{" "}
          <span className="text-xs">
            Developed & Maintained by Alex Vrsecky
          </span>
        </p>
      </div>
    </footer>
  );
}
