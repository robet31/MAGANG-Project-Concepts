'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  LayoutDashboard, 
  Upload, 
  BarChart3, 
  History, 
  Settings, 
  LogOut, 
  Pizza,
  Users,
  Building2,
  Bell
} from 'lucide-react'
import { getInitials } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Upload Data', href: '/upload', icon: Upload },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'History', href: '/history', icon: History },
]

const adminNavigation = [
  { name: 'Restoran', href: '/restaurants', icon: Building2 },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const router = useRouter()

  const userRole = (session?.user as any)?.role
  const isAdmin = userRole === 'GM' || userRole === 'ADMIN_PUSAT'
  const isGM = userRole === 'GM'

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push('/login')
  }

  return (
    <div 
      className={cn(
        "flex flex-col h-full bg-sidebar border-r border-sidebar-border",
        className
      )}
      style={{ 
        backgroundColor: 'var(--sidebar)',
        borderColor: 'var(--sidebar-border)'
      }}
    >
      {/* Logo */}
      <div 
        className="flex items-center gap-3 px-6 py-5 border-b"
        style={{ borderColor: 'var(--sidebar-border)' }}
      >
        <div 
          className="p-2 rounded-lg"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          <Pizza 
            className="h-6 w-6" 
            style={{ color: 'var(--primary-foreground)' }}
          />
        </div>
        <div>
          <h1 
            className="font-bold text-lg"
            style={{ color: 'var(--sidebar-foreground)' }}
          >
            Pizza Dashboard
          </h1>
          <p 
            className="text-xs"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Delivery Monitoring
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
              )}
              style={{
                backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? 'var(--primary-foreground)' : 'var(--sidebar-foreground)'
              }}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}

        {isAdmin && (
          <>
            <div className="pt-6 pb-2">
              <p 
                className="px-4 text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--muted-foreground)' }}
              >
                Administration
              </p>
            </div>
            {adminNavigation.map((item) => {
              const isActive = pathname === item.href
              if (item.name === 'Users' && !isGM) return null
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
                  )}
                  style={{
                    backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                    color: isActive ? 'var(--primary-foreground)' : 'var(--sidebar-foreground)'
                  }}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* User section */}
      <div 
        className="px-4 py-4 border-t"
        style={{ borderColor: 'var(--sidebar-border)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src="" />
            <AvatarFallback 
              className="rounded-full"
              style={{ 
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)'
              }}
            >
              {session?.user?.name ? getInitials(session.user.name) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p 
              className="text-sm font-medium truncate"
              style={{ color: 'var(--sidebar-foreground)' }}
            >
              {session?.user?.name}
            </p>
            <p 
              className="text-xs truncate"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {session?.user?.email}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <Bell className="h-5 w-5" />
          </Button>
        </div>
        <Button
          variant="outline"
          className="w-full"
          style={{ 
            borderColor: 'var(--sidebar-border)',
            color: 'var(--sidebar-foreground)'
          }}
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Keluar
        </Button>
      </div>
    </div>
  )
}
