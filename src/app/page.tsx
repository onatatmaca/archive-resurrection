import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { FileText, Upload, Search, Sparkles, Grid, Clock } from "lucide-react";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Hero Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Archive Resurrection
        </h1>
        <p className="text-base text-gray-600 dark:text-gray-400 mb-4">
          AI-powered team archive and intelligent knowledge retrieval
        </p>

        {session ? (
          <div className="flex gap-2 justify-center flex-wrap">
            <Link
              href="/browse"
              className="bg-blue-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-blue-700 transition flex items-center gap-1.5"
            >
              <Grid className="w-4 h-4" />
              Browse Archive
            </Link>
            <Link
              href="/upload"
              className="bg-green-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-green-700 transition flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" />
              Upload File
            </Link>
            <Link
              href="/timeline"
              className="bg-orange-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-orange-700 transition flex items-center gap-1.5"
            >
              <Clock className="w-4 h-4" />
              Timeline
            </Link>
            <Link
              href="/search"
              className="bg-purple-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-purple-700 transition flex items-center gap-1.5"
            >
              <Search className="w-4 h-4" />
              Search
            </Link>
          </div>
        ) : (
          <Link
            href="/api/auth/signin"
            className="bg-blue-600 text-white px-6 py-2 text-sm rounded-lg hover:bg-blue-700 transition inline-block"
          >
            Sign In to Get Started
          </Link>
        )}
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-4 gap-3 max-w-6xl mx-auto">
        <div className="p-4 border rounded-lg dark:border-gray-700">
          <FileText className="w-8 h-8 text-blue-600 mb-2" />
          <h3 className="text-base font-semibold mb-1">File Archive</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Upload and organize documents, photos, and archives with smart tagging
          </p>
        </div>

        <div className="p-4 border rounded-lg dark:border-gray-700">
          <Clock className="w-8 h-8 text-orange-600 mb-2" />
          <h3 className="text-base font-semibold mb-1">Timeline View</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Visualize your archive chronologically with fuzzy dates and event clustering
          </p>
        </div>

        <div className="p-4 border rounded-lg dark:border-gray-700">
          <Search className="w-8 h-8 text-purple-600 mb-2" />
          <h3 className="text-base font-semibold mb-1">Semantic Search</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Find content by meaning, not just keywords. AI-powered search coming soon
          </p>
        </div>

        <div className="p-4 border rounded-lg dark:border-gray-700">
          <Sparkles className="w-8 h-8 text-pink-600 mb-2" />
          <h3 className="text-base font-semibold mb-1">AI Insights</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Get instant answers with AI-generated summaries and citations (coming soon)
          </p>
        </div>
      </div>

      {/* Recent Items Section (when logged in) */}
      {session && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-3">Recent Archives</h2>
          <div className="text-center text-gray-500 py-8 border rounded-lg dark:border-gray-700">
            <p className="text-sm">No archives yet. Upload your first document to get started!</p>
          </div>
        </div>
      )}
    </div>
  );
}
