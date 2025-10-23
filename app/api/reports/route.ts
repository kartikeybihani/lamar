import { NextResponse } from 'next/server'
import { getAllCarePlans } from '@/lib/supabaseServices'

export async function GET() {
  try {
    const carePlans = await getAllCarePlans()
    return NextResponse.json(carePlans)
  } catch (error) {
    console.error('Error fetching care plans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch care plans' },
      { status: 500 }
    )
  }
}
