import Link from "next/link";

export default function Navigation() {
  return (
    <div>
      <ul className="flex gap-4">
        <li>
          <Link href="/">Home</Link>
        </li>
        <li>
          <Link href="/viewContent">Delete/View Content</Link>
        </li>
        <li>
          <Link href="/addContent">Add Content</Link>
        </li>
      </ul>
    </div>
  );
}
