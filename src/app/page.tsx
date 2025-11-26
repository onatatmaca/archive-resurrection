import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { FileText, Upload, Search, Sparkles, Grid, BookOpen } from "lucide-react";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Archive Resurrection
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          AI-powered team archive and intelligent knowledge retrieval
        </p>

        {session ? (
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/browse"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Grid className="w-5 h-5" />
              Browse Archive
            </Link>
            <Link
              href="/upload"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Upload File
            </Link>
            <Link
              href="/wiki/new"
              className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition flex items-center gap-2"
            >
              <BookOpen className="w-5 h-5" />
              New Wiki Page
            </Link>
            <Link
              href="/search"
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              Search
            </Link>
          </div>
        ) : (
          <Link
            href="/api/auth/signin"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition inline-block"
          >
            Sign In to Get Started
          </Link>
        )}
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
        <div className="p-6 border rounded-lg dark:border-gray-700">
          <FileText className="w-12 h-12 text-blue-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">File Archive</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Upload and organize documents, photos, and archives with smart tagging
          </p>
        </div>

        <div className="p-6 border rounded-lg dark:border-gray-700">
          <BookOpen className="w-12 h-12 text-orange-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Wiki Pages</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Create collaborative knowledge pages with markdown support and internal linking
          </p>
        </div>

        <div className="p-6 border rounded-lg dark:border-gray-700">
          <Search className="w-12 h-12 text-purple-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Semantic Search</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Find content by meaning, not just keywords. AI-powered search coming soon
          </p>
        </div>

        <div className="p-6 border rounded-lg dark:border-gray-700">
          <Sparkles className="w-12 h-12 text-pink-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">AI Insights</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Get instant answers with AI-generated summaries and citations (coming soon)
          </p>
        </div>
      </div>

      {/* Recent Items Section (when logged in) */}
      {session && (
        <div className="mt-16">
          <h2 className="text-3xl font-bold mb-6">Recent Archives</h2>
          <div className="text-center text-gray-500 py-12 border rounded-lg dark:border-gray-700">
            <p>No archives yet. Upload your first document to get started!</p>
          </div>
        </div>
      )}
    </div>
  );
}
