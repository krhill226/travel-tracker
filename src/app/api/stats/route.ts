import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const managerId = searchParams.get('managerId')

  try {
    const where: Record<string, unknown> = {}
    
    if (managerId) {
      where.employee = { managerId: parseInt(managerId) }
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const [total, thisMonth, upcoming, inProgress, denied] = await Promise.all([
      prisma.travelRequest.count({ where }),
      prisma.travelRequest.count({
        where: {
          ...where,
          travelDate: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      }),
      prisma.travelRequest.count({
        where: {
          ...where,
          status: 'planned',
          travelDate: { gte: now }
        }
      }),
      prisma.travelRequest.count({
        where: {
          ...where,
          status: 'in-progress'
        }
      }),
      prisma.travelRequest.count({
        where: {
          ...where,
          status: 'denied'
        }
      })
    ])

    return NextResponse.json({
      total,
      thisMonth,
      upcoming,
      inProgress,
      denied
    })
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
