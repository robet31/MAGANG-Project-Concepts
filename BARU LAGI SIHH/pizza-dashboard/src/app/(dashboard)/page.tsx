import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  TrendingUp,
  Store
} from 'lucide-react'
import { formatNumber, formatPercentage } from '@/lib/utils'

async function getDashboardStats() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const userRole = (session.user as any).role
  const userRestaurantId = (session.user as any)?.restaurantId

  const whereClause = userRole === 'MANAGER' || userRole === 'STAFF'
    ? { restaurantId: userRestaurantId }
    : userRole === 'ADMIN_PUSAT' || userRole === 'GM'
      ? {}
      : { restaurantId: userRestaurantId }

  const [totalOrders, avgDeliveryTime, onTimeData, delayData, restaurantCount, orderByMonth] = await Promise.all([
    prisma.deliveryData.count({ where: whereClause }),
    prisma.deliveryData.aggregate({
      where: whereClause,
      _avg: { deliveryDuration: true }
    }),
    prisma.deliveryData.groupBy({
      by: ['isDelayed'],
      where: whereClause,
      _count: true
    }),
    prisma.deliveryData.aggregate({
      where: whereClause,
      _avg: { delayMin: true }
    }),
    prisma.restaurant.count({ where: { isActive: true } }),
    prisma.deliveryData.groupBy({
      by: ['orderMonth'],
      where: whereClause,
      _count: true,
      orderBy: { orderMonth: 'asc' }
    })
  ])

  const onTimeCount = onTimeData.find(d => !d.isDelayed)?._count || 0
  const delayedCount = onTimeData.find(d => d.isDelayed)?._count || 0
  const totalWithDelay = onTimeCount + delayedCount
  const onTimeRate = totalWithDelay > 0 ? (onTimeCount / totalWithDelay) * 100 : 0

  return {
    totalOrders,
    avgDeliveryTime: avgDeliveryTime._avg.deliveryDuration || 0,
    onTimeRate,
    avgDelay: delayData._avg.delayMin || 0,
    totalRestaurants: restaurantCount,
    ordersByMonth: orderByMonth.map(m => ({ month: m.orderMonth, count: m._count }))
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  const stats = await getDashboardStats()

  const kpis = [
    {
      title: 'Total Orders',
      value: formatNumber(stats?.totalOrders || 0),
      icon: Package,
      color: 'rgb(72, 148, 199)',
      bgColor: 'rgba(72, 148, 199, 0.1)'
    },
    {
      title: 'Avg Delivery Time',
      value: `${(stats?.avgDeliveryTime || 0).toFixed(0)} min`,
      icon: Clock,
      color: 'rgb(186, 74, 108)',
      bgColor: 'rgba(186, 74, 108, 0.1)'
    },
    {
      title: 'On-Time Rate',
      value: formatPercentage(stats?.onTimeRate || 0),
      icon: CheckCircle2,
      color: 'rgb(37, 147, 110)',
      bgColor: 'rgba(37, 147, 110, 0.1)'
    },
    {
      title: 'Avg Delay',
      value: `${(stats?.avgDelay || 0).toFixed(1)} min`,
      icon: AlertTriangle,
      color: 'rgb(206, 168, 81)',
      bgColor: 'rgba(206, 168, 81, 0.1)'
    }
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 
          className="text-2xl font-bold"
          style={{ color: 'var(--foreground)' }}
        >
          Dashboard
        </h1>
        <p style={{ color: 'var(--muted-foreground)' }}>
          Monitor your pizza delivery performance
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <Card key={kpi.title} style={{ backgroundColor: 'var(--card)' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p 
                    className="text-sm font-medium"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    {kpi.title}
                  </p>
                  <p 
                    className="text-2xl font-bold mt-1"
                    style={{ color: 'var(--card-foreground)' }}
                  >
                    {kpi.value}
                  </p>
                </div>
                <div 
                  className="p-3 rounded-full"
                  style={{ backgroundColor: kpi.bgColor }}
                >
                  <kpi.icon 
                    className="h-6 w-6" 
                    style={{ color: kpi.color }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card style={{ backgroundColor: 'var(--card)' }}>
          <CardHeader className="pb-2">
            <CardTitle 
              className="text-sm font-medium"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Active Restaurants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Store 
                className="h-5 w-5" 
                style={{ color: 'var(--muted-foreground)' }}
              />
              <span 
                className="text-2xl font-bold"
                style={{ color: 'var(--card-foreground)' }}
              >
                {stats?.totalRestaurants || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: 'var(--card)' }}>
          <CardHeader className="pb-2">
            <CardTitle 
              className="text-sm font-medium"
              style={{ color: 'var(--muted-foreground)' }}
            >
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp 
                className="h-5 w-5" 
                style={{ color: 'rgb(37, 147, 110)' }}
              />
              <span 
                className="text-2xl font-bold"
                style={{ color: 'var(--card-foreground)' }}
              >
                {stats?.ordersByMonth[stats.ordersByMonth.length - 1]?.count || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: 'var(--card)' }}>
          <CardHeader className="pb-2">
            <CardTitle 
              className="text-sm font-medium"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Peak Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock 
                className="h-5 w-5" 
                style={{ color: 'rgb(206, 168, 81)' }}
              />
              <span 
                className="text-2xl font-bold"
                style={{ color: 'var(--card-foreground)' }}
              >
                18:00 - 21:00
              </span>
            </div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: 'var(--card)' }}>
          <CardHeader className="pb-2">
            <CardTitle 
              className="text-sm font-medium"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Top Pizza Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package 
                className="h-5 w-5" 
                style={{ color: 'rgb(186, 74, 108)' }}
              />
              <span 
                className="text-2xl font-bold"
                style={{ color: 'var(--card-foreground)' }}
              >
                Medium
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Welcome Message */}
      <Card 
        className="border-0"
        style={{ 
          background: 'linear-gradient(to right, var(--primary), rgb(57, 157, 102))',
          color: 'var(--primary-foreground)'
        }}
      >
        <CardContent className="p-8">
          <h2 className="text-2xl font-bold mb-2">
            Welcome back, {session.user?.name}!
          </h2>
          <p className="opacity-90">
            {(session.user as any)?.role === 'GM' && 'You have full access to all restaurants and analytics.'}
            {(session.user as any)?.role === 'ADMIN_PUSAT' && 'You can manage and view data from all restaurants.'}
            {(session.user as any)?.role === 'MANAGER' && 'You can view and manage your restaurant data.'}
            {(session.user as any)?.role === 'STAFF' && 'You can view your restaurant data and upload new data.'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
