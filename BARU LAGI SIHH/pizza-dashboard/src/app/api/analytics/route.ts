import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    const userRestaurantId = (session.user as any)?.restaurantId
    const { searchParams } = new URL(req.url)
    const restaurantId = searchParams.get('restaurantId')

    const whereClause: any = {}

    if (userRole === 'MANAGER' || userRole === 'STAFF') {
      whereClause.restaurantId = userRestaurantId
    } else if (restaurantId) {
      whereClause.restaurantId = restaurantId
    }

    const [
      totalOrders,
      ordersByRestaurant,
      ordersBySize,
      ordersByType,
      ordersByMonth,
      ordersByLocation,
      delayStats,
      peakHourStats,
      paymentStats,
      trafficStats,
      weekendStats,
      avgDeliveryTime,
      avgDistance
    ] = await Promise.all([
      prisma.deliveryData.count({ where: whereClause }),
      prisma.deliveryData.groupBy({
        by: ['restaurantId'],
        where: whereClause,
        _count: { orderId: true },
        orderBy: [{ _count: { orderId: 'desc' } }]
      }),
      prisma.deliveryData.groupBy({
        by: ['pizzaSize'],
        where: whereClause,
        _count: { orderId: true },
        orderBy: [{ _count: { orderId: 'desc' } }]
      }),
      prisma.deliveryData.groupBy({
        by: ['pizzaType'],
        where: whereClause,
        _count: { orderId: true },
        orderBy: [{ _count: { orderId: 'desc' } }]
      }),
      prisma.deliveryData.groupBy({
        by: ['orderMonth'],
        where: whereClause,
        _count: { orderId: true },
        orderBy: { orderMonth: 'asc' }
      }),
      prisma.deliveryData.groupBy({
        by: ['location'],
        where: whereClause,
        _count: { orderId: true },
        orderBy: [{ _count: { orderId: 'desc' } }],
        take: 10
      }),
      prisma.deliveryData.groupBy({
        by: ['isDelayed'],
        where: whereClause,
        _count: { orderId: true }
      }),
      prisma.deliveryData.groupBy({
        by: ['orderHour'],
        where: whereClause,
        _count: { orderId: true },
        orderBy: [{ orderHour: 'asc' }]
      }),
      prisma.deliveryData.groupBy({
        by: ['paymentMethod'],
        where: whereClause,
        _count: { orderId: true },
        orderBy: [{ _count: { orderId: 'desc' } }]
      }),
      prisma.deliveryData.groupBy({
        by: ['trafficLevel'],
        where: whereClause,
        _count: { orderId: true },
        orderBy: [{ _count: { orderId: 'desc' } }]
      }),
      prisma.deliveryData.groupBy({
        by: ['isWeekend'],
        where: whereClause,
        _count: { orderId: true }
      }),
      prisma.deliveryData.aggregate({
        where: whereClause,
        _avg: { deliveryDuration: true }
      }),
      prisma.deliveryData.aggregate({
        where: whereClause,
        _avg: { distanceKm: true }
      })
    ])

    // Get restaurant data - include all when no specific restaurant is selected
    const isViewingAll = !restaurantId && userRole !== 'MANAGER' && userRole !== 'STAFF'
    const allRestaurants = isViewingAll 
      ? await prisma.restaurant.findMany({ orderBy: { name: 'asc' } })
      : []
    
    // Always get the selected restaurant name for display
    let selectedRestaurantName = 'Selected Restaurant'
    if (restaurantId) {
      const selectedRestaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } })
      selectedRestaurantName = selectedRestaurant?.name || 'Unknown'
    }
    
    const restaurantMap = new Map(allRestaurants.map(r => [r.id, r.name]))

    const onTimeCount = delayStats.find(d => !d.isDelayed)?._count.orderId || 0
    const delayedCount = delayStats.find(d => d.isDelayed)?._count.orderId || 0

    // Create map of restaurant data
    const restaurantDataMap = new Map(ordersByRestaurant.map(o => [o.restaurantId, o._count.orderId]))

    // Include ALL restaurants only when viewing all, otherwise use actual data
    let ordersByRestaurantFinal: { restaurant: string; count: number }[]
    if (isViewingAll) {
      ordersByRestaurantFinal = allRestaurants.map(r => ({
        restaurant: r.name,
        count: restaurantDataMap.get(r.id) || 0
      }))
    } else if (restaurantId) {
      // When viewing specific restaurant, show that restaurant with its data
      const count = restaurantDataMap.get(restaurantId) || 0
      ordersByRestaurantFinal = [{ restaurant: selectedRestaurantName, count }]
    } else {
      // For MANAGER/STAFF viewing their own restaurant
      ordersByRestaurantFinal = ordersByRestaurant.map(o => ({
        restaurant: restaurantMap.get(o.restaurantId) || selectedRestaurantName,
        count: o._count.orderId
      }))
    }

    return NextResponse.json({
      totalOrders,
      ordersByRestaurant: ordersByRestaurantFinal,
      ordersBySize: ordersBySize.map(o => ({
        size: o.pizzaSize,
        count: o._count.orderId
      })),
      ordersByType: ordersByType.map(o => ({
        type: o.pizzaType,
        count: o._count.orderId
      })),
      ordersByMonth: ordersByMonth.map(o => ({
        month: o.orderMonth,
        count: o._count.orderId
      })),
      ordersByLocation: ordersByLocation.map(o => ({
        location: o.location,
        count: o._count.orderId
      })),
      delayStats: {
        onTime: onTimeCount,
        delayed: delayedCount,
        rate: totalOrders > 0 ? (onTimeCount / totalOrders) * 100 : 0
      },
      peakHourStats: peakHourStats.map(o => ({
        hour: o.orderHour,
        count: o._count.orderId
      })),
      paymentStats: paymentStats.map(o => ({
        method: o.paymentMethod,
        count: o._count.orderId
      })),
      trafficStats: trafficStats.map(o => ({
        level: o.trafficLevel,
        count: o._count.orderId
      })),
      weekendStats: {
        weekday: weekendStats.find(d => !d.isWeekend)?._count.orderId || 0,
        weekend: weekendStats.find(d => d.isWeekend)?._count.orderId || 0
      },
      avgDeliveryTime: avgDeliveryTime._avg.deliveryDuration || 0,
      avgDistance: avgDistance._avg.distanceKm || 0
    })

  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
