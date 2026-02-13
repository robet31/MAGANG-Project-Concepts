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
      paymentStats
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
      })
    ])

    // Get restaurant names
    const restaurantIds = ordersByRestaurant.map(o => o.restaurantId)
    const restaurants = await prisma.restaurant.findMany({
      where: { id: { in: restaurantIds } }
    })
    const restaurantMap = new Map(restaurants.map(r => [r.id, r.name]))

    const onTimeCount = delayStats.find(d => !d.isDelayed)?._count.orderId || 0
    const delayedCount = delayStats.find(d => d.isDelayed)?._count.orderId || 0

    return NextResponse.json({
      totalOrders,
      ordersByRestaurant: ordersByRestaurant.map(o => ({
        restaurant: restaurantMap.get(o.restaurantId) || 'Unknown',
        count: o._count.orderId
      })),
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
      }))
    })

  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
