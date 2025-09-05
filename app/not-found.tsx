"use client"

import Link from "next/link"
import { Home, ArrowLeft, Package } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        {/* Logo */}
        <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
          <Package className="w-8 h-8 text-white" />
        </div>

        <div className="space-y-2">
          <h1 className="text-9xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-gray-700">Page Not Found</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Sorry, we couldn't find the page you're looking for. The page might have been moved, deleted, or you entered
            the wrong URL.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="btn-gradient border-0">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="bg-white/80 hover:bg-white border-pink-200"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>

        <div className="enhanced-card p-6 max-w-md mx-auto">
          <h3 className="font-semibold text-gray-700 mb-2">Quick Links</h3>
          <div className="space-y-2 text-sm">
            <Link href="/products" className="block text-pink-600 hover:text-pink-700 transition-colors">
              → Products Management
            </Link>
            <Link href="/categories" className="block text-pink-600 hover:text-pink-700 transition-colors">
              → Product Categories
            </Link>
            <Link href="/suppliers" className="block text-pink-600 hover:text-pink-700 transition-colors">
              → Suppliers
            </Link>
            <Link href="/reports/incoming" className="block text-pink-600 hover:text-pink-700 transition-colors">
              → Reports
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
