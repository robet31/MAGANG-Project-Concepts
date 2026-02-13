'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart } from '@/components/charts/bar-chart'
import { LineChart } from '@/components/charts/line-chart'
import { PieChart } from '@/components/charts/pie-chart'
import { Loader2 } from 'lucide-react'

interface Restaurant {
  id: string
  name: string
  code: string
}

interface AnalyticsData {
  totalOrders: number
  ordersByRestaurant: { restaurant: string; count: number }[]
  ordersBySize: { size: string; count: number }[]
  ordersByType: { type: string; count: number }[]
  ordersByMonth: { month: string; count: number }[]
  ordersByLocation: { location: string; count: number }[]
  delayStats: { onTime: number; delayed: number; rate: number }
  peakHourStats: { hour: number; count: number }[]
  paymentStats: { method: string; count: number }[]
}

export default function AnalyticsPage() {
  const { data: session } = useSession()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('all')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const userRole = (session?.user as any)?.role

  useEffect(() => {
    fetchRestaurants()
  }, [])

  useEffect(() => {
    if (selectedRestaurant) {
      fetchAnalytics()
    }
  }, [selectedRestaurant])

  const fetchRestaurants = async () => {
    try {
      const res = await fetch('/api/upload')
      if (res.ok) {
        const data = await res.json()
        setRestaurants(data)
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error)
    }
  }

  const fetchAnalytics = async () => {
    setIsLoading(true)
    try {
      const url = selectedRestaurant === 'all' 
        ? '/api/analytics' 
        : `/api/analytics?restaurantId=${selectedRestaurant}`
      const res = await fetch(url)
      if (res.ok) {
        const result = await res.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (userRole === 'STAFF') {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">
              Anda tidak memiliki akses ke halaman Analytics.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500">Lihat analisis data delivery pizza</p>
        </div>

        {(userRole === 'GM' || userRole === 'ADMIN_PUSAT') && (
          <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Pilih restoran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Restoran</SelectItem>
              {restaurants.map((restaurant) => (
                <SelectItem key={restaurant.id} value={restaurant.id}>
                  {restaurant.name} ({restaurant.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : !data ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">Belum ada data. Silakan upload data terlebih dahulu.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{data.totalOrders.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">On-Time Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{data.delayStats.rate.toFixed(1)}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Delayed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">{data.delayStats.delayed}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Peak Hour</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">18:00</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Orders by Restaurant</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart 
                  data={data.ordersByRestaurant.map(d => ({ 
                    label: d.restaurant, 
                    value: d.count 
                  }))} 
                  title=""
                  color="#f97316"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Orders by Month</CardTitle>
              </CardHeader>
              <CardContent>
                <LineChart 
                  data={data.ordersByMonth.map(d => ({ 
                    label: d.month.slice(0, 3), 
                    value: d.count 
                  }))} 
                  title=""
                  color="#3b82f6"
                />
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Orders by Pizza Size</CardTitle>
              </CardHeader>
              <CardContent>
                <PieChart 
                  data={data.ordersBySize.map(d => ({ 
                    label: d.size, 
                    value: d.count 
                  }))} 
                  title=""
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Orders by Pizza Type</CardTitle>
              </CardHeader>
              <CardContent>
                <PieChart 
                  data={data.ordersByType.map(d => ({ 
                    label: d.type, 
                    value: d.count 
                  }))} 
                  title=""
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <PieChart 
                  data={data.paymentStats.map(d => ({ 
                    label: d.method, 
                    value: d.count 
                  }))} 
                  title=""
                />
              </CardContent>
            </Card>
          </div>

          {/* Location Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Top Locations</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart 
                data={data.ordersByLocation.slice(0, 8).map(d => ({ 
                  label: d.location.split(',')[0] || d.location, 
                  value: d.count 
                }))} 
                title=""
                color="#22c55e"
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
