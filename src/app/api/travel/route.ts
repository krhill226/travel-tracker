import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const employeeId = searchParams.get('employeeId')
  const managerId = searchParams.get('managerId')
  const status = searchParams.get('status')

  try {
    const where: Record<string, unknown> = {}

    if (employeeId) {
      where.employeeId = parseInt(employeeId)
    }

    if (managerId) {
      where.employee = { managerId: parseInt(managerId) }
    }

    if (status && status !== 'all') {
      where.status = status
    }

    const travelRequests = await prisma.travelRequest.findMany({
      where,
      include: {
        employee: {
          include: {
            manager: true
          }
        },
        agendaItems: true,
        denial: true,
      },
      orderBy: { travelDate: 'desc' }
    })

    return NextResponse.json(travelRequests)
  } catch (error) {
    console.error('Failed to fetch travel requests:', error)
    return NextResponse.json({ error: 'Failed to fetch travel requests' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employeeId, customerName, customerLocation, travelDate, returnDate, reason, agendaItems } = body

    const travelRequest = await prisma.travelRequest.create({
      data: {
        employeeId,
        customerName,
        customerLocation,
        travelDate: new Date(travelDate),
        returnDate: new Date(returnDate),
        reason,
        agendaItems: {
          create: agendaItems.map((description: string) => ({ description }))
        }
      },
      include: {
        agendaItems: true,
        denial: true,
      }
    })

    return NextResponse.json(travelRequest)
  } catch (error) {
    console.error('Failed to create travel request:', error)
    return NextResponse.json({ error: 'Failed to create travel request' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, denialReason, rescheduledDate } = body

    const updateData: Record<string, unknown> = {}
    
    if (status) {
      updateData.status = status
    }

    const travelRequest = await prisma.travelRequest.update({
      where: { id },
      data: updateData,
      include: {
        agendaItems: true,
        denial: true,
      }
    })

    if ((status === 'denied' || status === 'cancelled') && denialReason) {
      await prisma.denial.upsert({
        where: { travelRequestId: id },
        create: {
          travelRequestId: id,
          denialReason,
          rescheduledDate: rescheduledDate ? new Date(rescheduledDate) : null
        },
        update: {
          denialReason,
          rescheduledDate: rescheduledDate ? new Date(rescheduledDate) : null
        }
      })
    }

    const updatedRequest = await prisma.travelRequest.findUnique({
      where: { id },
      include: {
        employee: {
          include: { manager: true }
        },
        agendaItems: true,
        denial: true,
      }
    })

    return NextResponse.json(updatedRequest)
  } catch (error) {
    console.error('Failed to update travel request:', error)
    return NextResponse.json({ error: 'Failed to update travel request' }, { status: 500 })
  }
}
