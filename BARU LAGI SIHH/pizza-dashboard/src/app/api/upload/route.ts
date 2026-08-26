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

    // Get all restaurants from database for mapping
    const allRestaurants = await prisma.restaurant.findMany()
    const restaurantMap = new Map(allRestaurants.map(r => [r.name.toLowerCase(), r.id]))
    const restaurantCodeMap = new Map(allRestaurants.map(r => [r.code.toLowerCase(), r.id]))

    // Create a map to group data by restaurant
    const restaurantDataMap = new Map<string, any[]>()

    // Process each row and group by restaurant
    rawData.forEach((row: any) => {
      const restaurantName = row['Restaurant Name']?.toString().trim()
      
      // Try to find restaurant by name or code
      let targetRestaurantId: string | null = null
      
      if (restaurantName) {
        // Try exact match first
        const nameLower = restaurantName.toLowerCase()
        
        // Check by name (partial match)
        for (const [rName, rId] of restaurantMap) {
          if (nameLower.includes(rName) || rName.includes(nameLower)) {
            targetRestaurantId = rId
            break
          }
        }
        
        // If not found, try by code (e.g., "DOM", "PZH")
        if (!targetRestaurantId) {
          for (const [rCode, rId] of restaurantCodeMap) {
            if (nameLower.includes(rCode)) {
              targetRestaurantId = rId
              break
            }
          }
        }
      }

      // If still not found, use default restaurant (first one)
      if (!targetRestaurantId && allRestaurants.length > 0) {
        // Use the restaurant from form or first restaurant
        targetRestaurantId = restaurantId || allRestaurants[0].id
      }

      if (targetRestaurantId) {
        if (!restaurantDataMap.has(targetRestaurantId)) {
          restaurantDataMap.set(targetRestaurantId, [])
        }
        restaurantDataMap.get(targetRestaurantId)!.push(row)
      }
    })

    // For single restaurant case (original logic)
    const singleRestaurantId = restaurantId || (restaurantDataMap.size > 0 ? Array.from(restaurantDataMap.keys())[0] : null)

    if (!singleRestaurantId) {
      return NextResponse.json({ 
        error: 'No restaurant found. Please select a restaurant or ensure restaurants are created.' 
      }, { status: 400 })
    }

    // Verify restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: singleRestaurantId }
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // If multiple restaurants detected in Excel, process each
    const uploadResults: { restaurantName: string; restaurantId: string; success: number; failed: number }[] = []
    
    if (isSuperAdmin && restaurantDataMap.size > 1) {
      // Multiple restaurants - process each
      for (const [restId, rows] of restaurantDataMap) {
        const restInfo = allRestaurants.find(r => r.id === restId)
        const cleansed = cleanseData(rows, restId, userId)
        
        if (cleansed.data.length === 0) {
          uploadResults.push({
            restaurantName: restInfo?.name || 'Unknown',
            restaurantId: restId,
            success: 0,
            failed: rows.length
          })
          continue
        }

        let successCount = 0
        let failCount = 0

        for (const row of cleansed.data) {
          try {
            const orderId = row.orderId || `ORD${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            
            await prisma.deliveryData.upsert({
              where: { orderId: orderId },
              update: {
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
                qualityScore: row.qualityScore || 0,
                version: { increment: 1 }
              },
              create: {
                orderId,
                restaurantId: restId,
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
            })
            successCount++
          } catch (error: any) {
            console.error(`Error saving row ${row.orderId}:`, error.message)
            failCount++
          }
        }

        uploadResults.push({
          restaurantName: restInfo?.name || 'Unknown',
          restaurantId: restId,
          success: successCount,
          failed: failCount
        })
      }

      // Log audit for multiple restaurants
      await prisma.auditLog.create({
        data: {
          userId: userId,
          action: 'UPLOAD_DATA_MULTI',
          entity: 'DeliveryData',
          details: `Uploaded data for ${uploadResults.length} restaurants: ${uploadResults.map(r => `${r.restaurantName} (${r.success} rows)`).join(', ')}`,
          ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
        }
      })

      return NextResponse.json({
        success: true,
        message: `Berhasil upload data untuk ${uploadResults.length} restoran`,
        data: {
          totalRows: rawData.length,
          validRows: uploadResults.reduce((sum, r) => sum + r.success, 0),
          invalidRows: uploadResults.reduce((sum, r) => sum + r.failed, 0),
          restaurants: uploadResults
        }
      })
    }

    // Single restaurant - original logic
    const cleansed = cleanseData(rawData, singleRestaurantId, userId)

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
          restaurantId: singleRestaurantId,
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
          restaurantId: singleRestaurantId,
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
      message: `Berhasil upload ${successfullySaved.length} dari ${rawData.length} baris data ke ${restaurant.name}`,
      data: {
        totalRows: rawData.length,
        validRows: successfullySaved.length,
        invalidRows: rawData.length - successfullySaved.length,
        qualityScore: cleansed.qualityScore,
        errors: cleansed.errors.slice(0, 20),
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          code: restaurant.code
        }
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
