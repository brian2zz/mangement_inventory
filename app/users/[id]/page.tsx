"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Save, Trash2, Edit, Phone, Mail, MapPin, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/components/auth-provider"

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(false)
  const { hasPermission } = useAuth()

  const [user, setUser] = React.useState({
    id: params.id as string,
    userName: "Admin User",
    email: "admin@inventory.com",
    phone: "+1 (555) 123-4567",
    address: "123 Admin St, City, State 12345",
    role: "admin" as "admin" | "staff" | "viewer",
    status: "Active" as "Active" | "Inactive",
    lastLogin: "2024-01-20 10:30:00",
    createdDate: "2023-01-15",
    department: "IT Administration",
    notes: "System administrator with full access privileges",
  })

  // Check if user has admin permission
  if (!hasPermission("admin")) {
    return (
      <div className="space-y-6 gradient-bg min-h-screen p-6">
        <div className="enhanced-card p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-700 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access user management.</p>
        </div>
      </div>
    )
  }

  const handleSave = async () => {
    setIsLoading(true)
    // Mock save operation
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
    setIsEditing(false)
    alert("User updated successfully!")
  }

  const handleDelete = async () => {
    setIsLoading(true)
    // Mock delete operation
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
    router.push("/users")
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "default"
      case "staff":
        return "secondary"
      case "viewer":
        return "outline"
      default:
        return "secondary"
    }
  }

  return (
    <div className="space-y-6 gradient-bg min-h-screen p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="bg-white/80 hover:bg-white border-pink-200 hover:border-pink-300 transition-all duration-300"
          >
            <ArrowLeft className="h-4 w-4 text-pink-600" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            User Details
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="btn-gradient border-0">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="bg-white/80 hover:bg-white border-pink-200"
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isLoading} className="btn-gradient border-0">
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "Saving..." : "Save"}
              </Button>
            </>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={isLoading}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-0"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white/95 backdrop-blur-sm border-pink-200">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-gray-800">Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-600">
                  This action cannot be undone. This will permanently delete the user account and remove all associated
                  data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white hover:bg-gray-50 border-pink-200">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Role</div>
          <Badge variant={getRoleColor(user.role)} className="mt-1 capitalize">
            {user.role}
          </Badge>
        </div>
        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Status</div>
          <Badge variant={user.status === "Active" ? "default" : "destructive"} className="mt-1">
            {user.status}
          </Badge>
        </div>
        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Last Login</div>
          <div className="text-sm font-medium text-gray-800">{user.lastLogin}</div>
        </div>
        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Member Since</div>
          <div className="text-sm font-medium text-gray-800">{user.createdDate}</div>
        </div>
      </div>

      {/* User Details */}
      <div className="enhanced-card p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">User Information</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="userName" className="text-gray-700 font-medium">
                User Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-pink-400" />
                <Input
                  id="userName"
                  value={user.userName}
                  onChange={(e) => setUser({ ...user, userName: e.target.value })}
                  className="pl-10 gradient-input"
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-pink-400" />
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                  className="pl-10 gradient-input"
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone" className="text-gray-700 font-medium">
                Phone
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-pink-400" />
                <Input
                  id="phone"
                  value={user.phone}
                  onChange={(e) => setUser({ ...user, phone: e.target.value })}
                  className="pl-10 gradient-input"
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="department" className="text-gray-700 font-medium">
                Department
              </Label>
              <Input
                id="department"
                value={user.department}
                onChange={(e) => setUser({ ...user, department: e.target.value })}
                className="gradient-input"
                disabled={!isEditing}
              />
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="role" className="text-gray-700 font-medium">
                Role
              </Label>
              {isEditing ? (
                <Select
                  value={user.role}
                  onValueChange={(value: "admin" | "staff" | "viewer") => setUser({ ...user, role: value })}
                >
                  <SelectTrigger className="gradient-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-sm border-pink-200">
                    <SelectItem value="admin" className="hover:bg-pink-50">
                      Admin
                    </SelectItem>
                    <SelectItem value="staff" className="hover:bg-pink-50">
                      Staff
                    </SelectItem>
                    <SelectItem value="viewer" className="hover:bg-pink-50">
                      Viewer
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-2">
                  <Badge variant={getRoleColor(user.role)} className="capitalize">
                    {user.role}
                  </Badge>
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status" className="text-gray-700 font-medium">
                Status
              </Label>
              {isEditing ? (
                <Select
                  value={user.status}
                  onValueChange={(value: "Active" | "Inactive") => setUser({ ...user, status: value })}
                >
                  <SelectTrigger className="gradient-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-sm border-pink-200">
                    <SelectItem value="Active" className="hover:bg-pink-50">
                      Active
                    </SelectItem>
                    <SelectItem value="Inactive" className="hover:bg-pink-50">
                      Inactive
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-2">
                  <Badge variant={user.status === "Active" ? "default" : "destructive"}>{user.status}</Badge>
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address" className="text-gray-700 font-medium">
                Address
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-pink-400" />
                <Textarea
                  id="address"
                  value={user.address}
                  onChange={(e) => setUser({ ...user, address: e.target.value })}
                  rows={3}
                  className="pl-10 gradient-input resize-none"
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes" className="text-gray-700 font-medium">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={user.notes}
                onChange={(e) => setUser({ ...user, notes: e.target.value })}
                rows={2}
                className="gradient-input resize-none"
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
