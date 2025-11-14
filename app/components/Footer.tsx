export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full bg-gray-100 mt-8">
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row justify-between items-center">
        <p className="text-gray-600 text-sm">
          © {year} Docket App. All rights reserved. <br />{" "}
          <span className="text-xs">
            Developed & Maintained by Alex Vrsecky
          </span>
        </p>
        <div className="space-x-4 mt-2 sm:mt-0">
          <a href="#" className="text-gray-600 hover:text-gray-800 text-sm">
            Privacy Policy
          </a>
          <a href="#" className="text-gray-600 hover:text-gray-800 text-sm">
            Terms of Service
          </a>
        </div>
      </div>
    </footer>
  );
}