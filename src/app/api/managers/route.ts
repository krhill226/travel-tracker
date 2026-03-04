import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const managers = await prisma.manager.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { employees: true }
        }
      }
    })
    return NextResponse.json(managers)
  } catch (error) {
    console.error('Failed to fetch managers:', error)
    return NextResponse.json({ error: 'Failed to fetch managers' }, { status: 500 })
  }
}
