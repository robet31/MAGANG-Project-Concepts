'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { BarChart } from '@/components/charts/bar-chart'
import { LineChart } from '@/components/charts/line-chart'
import { PieChart } from '@/components/charts/pie-chart'
import { Loader2, ChevronDown, ChevronUp, BarChart3, PieChart as PieChartIcon, TrendingUp, MapPin, Clock, CreditCard, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  trafficStats: { level: string; count: number }[]
  weekendStats: { weekday: number; weekend: number }
  avgDeliveryTime: number
  avgDistance: number
}

interface AccordionSection {
  id: string
  title: string
  icon: React.ReactNode
  content: React.ReactNode
}

export default function AnalyticsPage() {
  const { data: session } = useSession()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('all')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['summary', 'trends']))

  const userRole = (session?.user as any)?.role

  useEffect(() => {
    fetchRestaurants()
  }, [])

  useEffect(() => {
    if (selectedRestaurant) {
      fetchAnalytics()
      setOpenSections(new Set(['summary', 'trends']))
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

  const toggleSection = (sectionId: string) => {
    const newOpen = new Set(openSections)
    if (newOpen.has(sectionId)) {
      newOpen.delete(sectionId)
    } else {
      newOpen.add(sectionId)
    }
    setOpenSections(newOpen)
  }

  const getSelectedRestaurantName = () => {
    if (selectedRestaurant === 'all') return 'Semua Restoran'
    const restaurant = restaurants.find(r => r.id === selectedRestaurant)
    return restaurant?.name || 'Restoran'
  }

  const AccordionItem = ({ id, title, icon, children }: { id: string, title: string, icon: React.ReactNode, children: React.ReactNode }) => {
    const isOpen = openSections.has(id)
    return (
      <Card className="overflow-hidden">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
            <span className="font-medium">{title}</span>
            <span className="text-sm text-gray-500">
              ({selectedRestaurant === 'all' ? 'Semua' : getSelectedRestaurantName()})
            </span>
          </div>
          {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
        <div className={cn("transition-all duration-300 ease-in-out", isOpen ? "block" : "hidden")}>
          <CardContent className="pt-0">
            {children}
          </CardContent>
        </div>
      </Card>
    )
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
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500">Analisis data delivery pizza - {getSelectedRestaurantName()}</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAnalytics()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

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
        <div className="space-y-4">
          {/* Summary Stats - Always visible */}
          <AccordionItem id="summary" title="Ringkasan" icon={<BarChart3 className="h-5 w-5" />}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div className="p-4 rounded-lg bg-blue-50">
                <p className="text-sm text-blue-600">Total Orders</p>
                <p className="text-2xl font-bold text-blue-700">{(data?.totalOrders ?? 0).toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-lg bg-green-50">
                <p className="text-sm text-green-600">On-Time Rate</p>
                <p className="text-2xl font-bold text-green-700">{data?.delayStats?.rate?.toFixed(1) ?? '0'}%</p>
              </div>
              <div className="p-4 rounded-lg bg-red-50">
                <p className="text-sm text-red-600">Delayed</p>
                <p className="text-2xl font-bold text-red-700">{data?.delayStats?.delayed ?? 0}</p>
              </div>
              <div className="p-4 rounded-lg bg-orange-50">
                <p className="text-sm text-orange-600">Peak Hour</p>
                <p className="text-2xl font-bold text-orange-700">
                  {data?.peakHourStats?.length > 0 ? `${data.peakHourStats.reduce((a, b) => a.count > b.count ? a : b).hour}:00` : '-'}
                </p>
              </div>
            </div>
            {/* Additional Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="p-4 rounded-lg bg-purple-50">
                <p className="text-sm text-purple-600">Avg Delivery Time</p>
                <p className="text-2xl font-bold text-purple-700">{data?.avgDeliveryTime?.toFixed(1) ?? '0'} min</p>
              </div>
              <div className="p-4 rounded-lg bg-cyan-50">
                <p className="text-sm text-cyan-600">Avg Distance</p>
                <p className="text-2xl font-bold text-cyan-700">{data?.avgDistance?.toFixed(1) ?? '0'} km</p>
              </div>
              <div className="p-4 rounded-lg bg-yellow-50">
                <p className="text-sm text-yellow-600">Weekday Orders</p>
                <p className="text-2xl font-bold text-yellow-700">{data?.weekendStats?.weekday ?? 0}</p>
              </div>
              <div className="p-4 rounded-lg bg-pink-50">
                <p className="text-sm text-pink-600">Weekend Orders</p>
                <p className="text-2xl font-bold text-pink-700">{data?.weekendStats?.weekend ?? 0}</p>
              </div>
            </div>
          </AccordionItem>

          {/* Trends */}
          <AccordionItem id="trends" title="Tren & Pertumbuhan" icon={<TrendingUp className="h-5 w-5" />}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-4">Orders by Month</h4>
                <LineChart 
                  data={data.ordersByMonth.map(d => ({ 
                    label: d.month.slice(0, 3), 
                    value: d.count 
                  }))} 
                  title=""
                  color="#3b82f6"
                />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-4">Orders by Restaurant</h4>
                <BarChart 
                  data={data.ordersByRestaurant.map(d => ({ 
                    label: d.restaurant, 
                    value: d.count 
                  }))} 
                  title=""
                  color="#f97316"
                />
              </div>
            </div>
          </AccordionItem>

          {/* Pizza Distribution */}
          <AccordionItem id="pizza" title="Distribusi Pizza" icon={<PieChartIcon className="h-5 w-5" />}>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pt-4">
              <div className="col-span-1">
                <h4 className="text-sm font-medium text-gray-600 mb-4">By Pizza Size</h4>
                <PieChart 
                  data={data.ordersBySize.map(d => ({ 
                    label: d.size, 
                    value: d.count 
                  }))} 
                  title=""
                />
              </div>
              <div className="col-span-1">
                <h4 className="text-sm font-medium text-gray-600 mb-4">By Pizza Type</h4>
                <PieChart 
                  data={data.ordersByType.map(d => ({ 
                    label: d.type, 
                    value: d.count 
                  }))} 
                  title=""
                />
              </div>
              <div className="col-span-1">
                <h4 className="text-sm font-medium text-gray-600 mb-4">Payment Methods</h4>
                <PieChart 
                  data={data.paymentStats.map(d => ({ 
                    label: d.method, 
                    value: d.count 
                  }))} 
                  title=""
                />
              </div>
            </div>
          </AccordionItem>

          {/* Location Stats */}
          <AccordionItem id="location" title="Lokasi & Peak Hours" icon={<MapPin className="h-5 w-5" />}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-4">Top Locations</h4>
                <BarChart 
                  data={data.ordersByLocation.slice(0, 8).map(d => ({ 
                    label: d.location.split(',')[0] || d.location, 
                    value: d.count 
                  }))} 
                  title=""
                  color="#22c55e"
                />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-4">Peak Hours Distribution</h4>
                <BarChart 
                  data={data.peakHourStats.slice(0, 12).map(d => ({ 
                    label: `${d.hour}:00`, 
                    value: d.count 
                  }))} 
                  title=""
                  color="#8b5cf6"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pt-4 mt-4">
              <div className="min-h-[280px]">
                <h4 className="text-sm font-medium text-gray-600 mb-4">Traffic Level</h4>
                <PieChart 
                  data={data.trafficStats.map(d => ({ 
                    label: d.level, 
                    value: d.count 
                  }))} 
                  title=""
                />
              </div>
              <div className="min-h-[280px]">
                <h4 className="text-sm font-medium text-gray-600 mb-4">Weekday vs Weekend</h4>
                <PieChart 
                  data={[
                    { label: 'Weekday', value: data.weekendStats.weekday },
                    { label: 'Weekend', value: data.weekendStats.weekend }
                  ]} 
                  title=""
                />
              </div>
            </div>
          </AccordionItem>
        </div>
      )}
    </div>
  )
}
