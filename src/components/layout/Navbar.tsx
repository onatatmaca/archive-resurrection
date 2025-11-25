"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { Archive, Upload, Search, User, LogOut } from "lucide-react";

export function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="border-b dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <Archive className="w-6 h-6 text-blue-600" />
          <span>Archive Resurrection</span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-6">
          {status === "authenticated" && session ? (
            <>
              <Link
                href="/upload"
                className="flex items-center gap-2 hover:text-blue-600 transition"
              >
                <Upload className="w-4 h-4" />
                <span>Upload</span>
              </Link>
              <Link
                href="/search"
                className="flex items-center gap-2 hover:text-purple-600 transition"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </Link>

              {/* User Menu */}
              <div className="flex items-center gap-3 ml-4 pl-4 border-l dark:border-gray-800">
                {session.user?.image && (
                  <img
                    src={session.user.image}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm">{session.user?.name}</span>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
