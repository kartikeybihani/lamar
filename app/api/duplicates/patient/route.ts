import { NextRequest, NextResponse } from 'next/server'
import { checkDuplicatePatient } from '@/lib/supabaseServices'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mrn = searchParams.get('mrn')

    if (!mrn) {
      return NextResponse.json(
        { error: 'MRN parameter is required' },
        { status: 400 }
      )
    }

    if (mrn.length !== 6) {
      return NextResponse.json(
        { error: 'MRN must be exactly 6 characters' },
        { status: 400 }
      )
    }

    const isDuplicate = await checkDuplicatePatient(mrn)
    
    return NextResponse.json({ isDuplicate })
  } catch (error) {
    console.error('Error checking patient duplicate:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
