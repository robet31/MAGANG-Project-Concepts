import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { parseExcelFile, cleanseData, validateExcelHeaders } from '@/services/cleansing'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    let restaurantId = formData.get('restaurantId') as string

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    // Check permissions
    const userRole = (session.user as any).role
    const userRestaurantId = (session.user as any)?.restaurantId
    const userId = (session.user as any)?.id || session.user?.email || 'unknown'

    // GM and ADMIN_PUSAT can upload without selecting restaurant
    const isSuperAdmin = userRole === 'GM' || userRole === 'ADMIN_PUSAT'
    
    if (!isSuperAdmin && !restaurantId) {
      return NextResponse.json({ 
        error: 'Restaurant ID is required' 
      }, { status: 400 })
    }

    if (userRole === 'MANAGER' && userRestaurantId !== restaurantId) {
      return NextResponse.json({ 
        error: 'Anda hanya bisa upload data untuk restoran Anda sendiri' 
      }, { status: 403 })
    }

    if (userRole === 'STAFF' && userRestaurantId !== restaurantId) {
      return NextResponse.json({ 
        error: 'Anda hanya bisa upload data untuk restoran Anda sendiri' 
      }, { status: 403 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Parse Excel
    let rawData
    try {
      rawData = parseExcelFile(buffer)
    } catch (parseError: any) {
      console.error('Parse error:', parseError)
      return NextResponse.json({ 
        error: 'Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.',
        details: parseError.message
      }, { status: 400 })
    }

    if (!rawData || rawData.length === 0) {
      return NextResponse.json({ 
        error: 'File is empty or has no valid data' 
      }, { status: 400 })
    }

    // Validate headers
    const headers = Object.keys(rawData[0])
    const headerErrors = validateExcelHeaders(headers)
    if (headerErrors.length > 0) {
      return NextResponse.json({ 
        error: 'Invalid Excel format',
        details: headerErrors
      }, { status: 400 })
    }

    // For super admins without specific restaurant, try to find from Excel data
    let targetRestaurantId = restaurantId
    if (isSuperAdmin && !restaurantId) {
      const firstRestaurantName = rawData[0]?.['Restaurant Name']
      if (firstRestaurantName) {
        // SQLite doesn't support mode: 'insensitive', use case-insensitive search manually
        const restaurants = await prisma.restaurant.findMany()
        const restaurant = restaurants.find(r => 
          r.name.toLowerCase().includes(firstRestaurantName.toLowerCase())
        )
        if (restaurant) {
          targetRestaurantId = restaurant.id
        }
      }
      
      // If still no restaurant, use the first available
      if (!targetRestaurantId) {
        const firstRestaurant = await prisma.restaurant.findFirst()
        if (firstRestaurant) {
          targetRestaurantId = firstRestaurant.id
        }
      }
    }

    if (!targetRestaurantId) {
      return NextResponse.json({ 
        error: 'No restaurant found. Please select a restaurant or ensure restaurants are created.' 
      }, { status: 400 })
    }

    // Verify restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: targetRestaurantId }
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // Cleanse data
    const cleansed = cleanseData(rawData, targetRestaurantId, userId)

    if (cleansed.data.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Tidak ada data yang valid',
        data: {
          totalRows: rawData.length,
          validRows: 0,
          invalidRows: rawData.length,
          qualityScore: cleansed.qualityScore,
          errors: cleansed.errors.slice(0, 50)
        }
      }, { status: 400 })
    }

    // Insert data using upsert to handle duplicates
    const successfullySaved = []
    const failedRows = []
    let processedCount = 0
    const totalRows = cleansed.data.length

    for (const row of cleansed.data) {
      try {
        processedCount++
        
        // Ensure orderId exists
        const orderId = row.orderId || `ORD${Date.now()}_${processedCount}_${Math.floor(Math.random() * 1000)}`
        
        // Prepare data for insert
        const dataToInsert = {
          orderId: orderId,
          restaurantId: targetRestaurantId,
          location: row.location || '',
          orderTime: row.orderTime ? new Date(row.orderTime) : new Date(),
          deliveryTime: row.deliveryTime ? new Date(row.deliveryTime) : new Date(),
          deliveryDuration: row.deliveryDuration || 0,
          orderMonth: row.orderMonth || 'Unknown',
          orderHour: row.orderHour || 0,
          pizzaSize: row.pizzaSize || 'Unknown',
          pizzaType: row.pizzaType || 'Unknown',
          toppingsCount: row.toppingsCount || 0,
          pizzaComplexity: row.pizzaComplexity || 0,
          toppingDensity: row.toppingDensity || null,
          distanceKm: row.distanceKm || 0,
          trafficLevel: row.trafficLevel || 'Unknown',
          trafficImpact: row.trafficImpact || 1,
          isPeakHour: row.isPeakHour || false,
          isWeekend: row.isWeekend || false,
          paymentMethod: row.paymentMethod || 'Unknown',
          paymentCategory: row.paymentCategory || 'Unknown',
          estimatedDuration: row.estimatedDuration || 0,
          deliveryEfficiency: row.deliveryEfficiency || null,
          delayMin: row.delayMin || 0,
          isDelayed: row.isDelayed || false,
          restaurantAvgTime: row.restaurantAvgTime || null,
          uploadedBy: userId,
          uploadedAt: new Date(),
          validatedAt: new Date(),
          validatedBy: userId,
          qualityScore: row.qualityScore || 0,
          version: 1
        }

        // Use upsert to handle duplicates
        await prisma.deliveryData.upsert({
          where: { orderId: orderId },
          update: {
            ...dataToInsert,
            version: { increment: 1 }
          },
          create: dataToInsert
        })
        
        successfullySaved.push(row)
      } catch (error: any) {
        console.error(`Error saving row ${row.orderId}:`, error.message)
        failedRows.push({
          orderId: row.orderId,
          error: error.message
        })
      }
    }

    // Log audit
    try {
      await prisma.auditLog.create({
        data: {
          userId: userId,
          action: 'UPLOAD_DATA',
          entity: 'DeliveryData',
          restaurantId: targetRestaurantId,
          details: `Uploaded ${successfullySaved.length} records from ${file.name}`,
          ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
        }
      })
    } catch (auditError) {
      console.error('Audit log error:', auditError)
      // Don't fail the upload if audit log fails
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil upload ${successfullySaved.length} dari ${rawData.length} baris data`,
      data: {
        totalRows: rawData.length,
        validRows: successfullySaved.length,
        invalidRows: rawData.length - successfullySaved.length,
        qualityScore: cleansed.qualityScore,
        errors: cleansed.errors.slice(0, 20)
      }
    })

  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message || 'Unknown error occurred'
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    const userRestaurantId = (session.user as any)?.restaurantId

    const whereClause = userRole === 'MANAGER' || userRole === 'STAFF'
      ? { id: userRestaurantId }
      : userRole === 'ADMIN_PUSAT' || userRole === 'GM'
        ? {}
        : { id: userRestaurantId }

    const restaurants = await prisma.restaurant.findMany({
      where: whereClause,
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(restaurants)

  } catch (error) {
    console.error('Get restaurants error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
