'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Loader2, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Shield,
  Building2
} from 'lucide-react'
import { Input } from '@/components/ui/input'

interface Restaurant {
  id: string
  name: string
  code: string
}

interface UserData {
  id: string
  name: string
  email: string
  role: string
  restaurantId: string | null
  restaurant?: Restaurant
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function UsersPage() {
  const { data: session, status } = useSession()
  const [users, setUsers] = useState<UserData[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const userRole = (session?.user as any)?.role

  useEffect(() => {
    if (status === 'authenticated' && userRole === 'GM') {
      fetchUsers()
    }
  }, [status, userRole])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query) ||
        user.restaurant?.name.toLowerCase().includes(query)
      )
      setFilteredUsers(filtered)
    }
  }, [searchQuery, users])

  const fetchUsers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/users')
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Unauthorized. Please login again.')
        } else if (res.status === 403) {
          throw new Error('You do not have permission to access this resource.')
        } else {
          throw new Error('Failed to fetch users')
        }
      }
      const data = await res.json()
      setUsers(data)
      setFilteredUsers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching users:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddUser = () => {
    console.log('Add user clicked')
  }

  const handleEditUser = (userId: string) => {
    console.log('Edit user:', userId)
  }

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      console.log('Delete user:', userId)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'GM':
        return { bg: 'rgba(147, 51, 234, 0.1)', text: 'rgb(147, 51, 234)' }
      case 'ADMIN_PUSAT':
        return { bg: 'rgba(59, 130, 246, 0.1)', text: 'rgb(59, 130, 246)' }
      case 'ADMIN_CABANG':
        return { bg: 'rgba(34, 197, 94, 0.1)', text: 'rgb(34, 197, 94)' }
      case 'STAFF':
        return { bg: 'var(--muted)', text: 'var(--muted-foreground)' }
      default:
        return { bg: 'var(--muted)', text: 'var(--muted-foreground)' }
    }
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? { bg: 'rgba(34, 197, 94, 0.1)', text: 'rgb(34, 197, 94)' }
      : { bg: 'rgba(239, 68, 68, 0.1)', text: 'rgb(239, 68, 68)' }
  }

  if (status === 'loading') {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader2 
          className="h-8 w-8 animate-spin" 
          style={{ color: 'var(--primary)' }}
        />
      </div>
    )
  }

  if (userRole !== 'GM') {
    return (
      <div className="p-6">
        <Card style={{ backgroundColor: 'var(--card)' }}>
          <CardContent className="p-8 text-center">
            <Shield 
              className="h-12 w-12 mx-auto mb-4" 
              style={{ color: 'var(--destructive)' }}
            />
            <h2 
              className="text-xl font-semibold mb-2"
              style={{ color: 'var(--destructive)' }}
            >
              Access Denied
            </h2>
            <p style={{ color: 'var(--muted-foreground)' }}>
              Anda tidak memiliki akses ke halaman Users. Halaman ini hanya dapat diakses oleh General Manager.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 
            className="text-2xl font-bold flex items-center gap-2"
            style={{ color: 'var(--foreground)' }}
          >
            <Users style={{ color: 'var(--primary)' }} />
            Users Management
          </h1>
          <p style={{ color: 'var(--muted-foreground)' }} className="mt-1">
            Kelola pengguna sistem dan akses mereka
          </p>
        </div>
        <Button 
          onClick={handleAddUser} 
          className="sm:w-auto w-full"
          style={{ 
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-foreground)'
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Search and Stats */}
      <Card style={{ backgroundColor: 'var(--card)' }}>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" 
                style={{ color: 'var(--muted-foreground)' }}
              />
              <Input
                placeholder="Search users by name, email, role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                style={{ 
                  backgroundColor: 'var(--input)',
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)'
                }}
              />
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: 'rgb(34, 197, 94)' }}
                />
                <span style={{ color: 'var(--muted-foreground)' }}>
                  {users.filter(u => u.isActive).length} Active
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: 'rgb(239, 68, 68)' }}
                />
                <span style={{ color: 'var(--muted-foreground)' }}>
                  {users.filter(u => !u.isActive).length} Inactive
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card style={{ backgroundColor: 'var(--card)' }}>
          <CardContent className="p-6">
            <div 
              className="flex items-center gap-3"
              style={{ color: 'var(--destructive)' }}
            >
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
            <Button 
              variant="outline" 
              onClick={fetchUsers} 
              className="mt-4"
              style={{ 
                borderColor: 'var(--border)',
                color: 'var(--foreground)'
              }}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card style={{ backgroundColor: 'var(--card)' }}>
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 
                className="h-8 w-8 animate-spin" 
                style={{ color: 'var(--primary)' }}
              />
              <p style={{ color: 'var(--muted-foreground)' }}>Loading users...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      {!isLoading && !error && (
        <Card style={{ backgroundColor: 'var(--card)' }}>
          <CardHeader>
            <CardTitle style={{ color: 'var(--card-foreground)' }} className="text-lg">
              User List
            </CardTitle>
            <CardDescription style={{ color: 'var(--muted-foreground)' }}>
              {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: 'var(--muted)' }}>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th 
                      className="text-left py-3 px-4 text-sm font-medium"
                      style={{ color: 'var(--foreground)' }}
                    >
                      Name
                    </th>
                    <th 
                      className="text-left py-3 px-4 text-sm font-medium"
                      style={{ color: 'var(--foreground)' }}
                    >
                      Email
                    </th>
                    <th 
                      className="text-left py-3 px-4 text-sm font-medium"
                      style={{ color: 'var(--foreground)' }}
                    >
                      Role
                    </th>
                    <th 
                      className="text-left py-3 px-4 text-sm font-medium"
                      style={{ color: 'var(--foreground)' }}
                    >
                      Restaurant
                    </th>
                    <th 
                      className="text-left py-3 px-4 text-sm font-medium"
                      style={{ color: 'var(--foreground)' }}
                    >
                      Status
                    </th>
                    <th 
                      className="text-right py-3 px-4 text-sm font-medium"
                      style={{ color: 'var(--foreground)' }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <Users 
                          className="h-12 w-12 mx-auto mb-4" 
                          style={{ color: 'var(--muted-foreground)', opacity: 0.5 }}
                        />
                        <p style={{ color: 'var(--muted-foreground)' }}>
                          {searchQuery 
                            ? 'No users found matching your search.' 
                            : 'No users found.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const roleColors = getRoleBadgeColor(user.role)
                      const statusColors = getStatusBadge(user.isActive)
                      return (
                        <tr 
                          key={user.id}
                          className="transition-colors"
                          style={{ 
                            borderBottom: '1px solid var(--border)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--accent)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-8 h-8 rounded-full flex items-center justify-center"
                                style={{ 
                                  backgroundColor: 'var(--accent)',
                                  color: 'var(--accent-foreground)'
                                }}
                              >
                                <span className="text-sm font-medium">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span 
                                className="font-medium"
                                style={{ color: 'var(--foreground)' }}
                              >
                                {user.name}
                              </span>
                            </div>
                          </td>
                          <td 
                            className="py-3 px-4"
                            style={{ color: 'var(--muted-foreground)' }}
                          >
                            {user.email}
                          </td>
                          <td className="py-3 px-4">
                            <span 
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: roleColors.bg,
                                color: roleColors.text
                              }}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {user.restaurant ? (
                              <div 
                                className="flex items-center gap-2"
                                style={{ color: 'var(--muted-foreground)' }}
                              >
                                <Building2 className="h-4 w-4" />
                                <span>{user.restaurant.name}</span>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--muted-foreground)', opacity: 0.5 }}>-</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span 
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: statusColors.bg,
                                color: statusColors.text
                              }}
                            >
                              {user.isActive ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3" />
                                  Inactive
                                </>
                              )}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditUser(user.id)}
                                className="h-8 w-8"
                                style={{ color: 'var(--primary)' }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteUser(user.id)}
                                className="h-8 w-8"
                                style={{ color: 'var(--destructive)' }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
