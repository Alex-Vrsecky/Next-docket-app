"use client";

import { useState } from "react";
import { ClipboardList } from "lucide-react";
import { signInAnonymously } from "firebase/auth";
import { auth } from "@/app/firebase/firebaseInit";
import { createUser } from "@/app/database/firebaseService";
import { useRouter } from "next/navigation";

export default function Page() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Sign in anonymously (or use email auth if you prefer)
      const userCredential = await signInAnonymously(auth);
      const uid = userCredential.user.uid;

      // Create/update user document in Firestore
      await createUser(uid, firstName, lastName);

      // Store user info in localStorage (optional)
      localStorage.setItem(
        "user",
        JSON.stringify({ uid, firstName, lastName })
      );

      // Redirect to main app
      router.push("/");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Sign in error:", err);
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-[rgb(13,82,87)] text-white">
            <ClipboardList className="h-6 w-6" />
          </div>
          <span className="text-3xl font-bold tracking-tight text-gray-900">
            Docket<span className="text-[rgb(13,82,87)]">App</span>
          </span>
        </div>

        {/* Sign In Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome</h1>
          <p className="text-gray-600 mb-6">Enter your name to continue</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First Name */}
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name"
                required
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[rgb(13,82,87)] focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            {/* Last Name */}
            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your last name"
                required
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[rgb(13,82,87)] focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[rgb(13,82,87)] text-white font-semibold py-3 px-4 rounded-lg hover:bg-[rgb(10,65,69)] transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          © {new Date().getFullYear()} Docket App
        </p>
      </div>
    </div>
  );
}