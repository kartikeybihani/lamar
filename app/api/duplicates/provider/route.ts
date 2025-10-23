import { NextRequest, NextResponse } from 'next/server'
import { checkDuplicateProvider } from '@/lib/supabaseServices'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const npi = searchParams.get('npi')

    if (!npi) {
      return NextResponse.json(
        { error: 'NPI parameter is required' },
        { status: 400 }
      )
    }

    if (npi.length !== 10) {
      return NextResponse.json(
        { error: 'NPI must be exactly 10 characters' },
        { status: 400 }
      )
    }

    const isDuplicate = await checkDuplicateProvider(npi)
    
    return NextResponse.json({ isDuplicate })
  } catch (error) {
    console.error('Error checking provider duplicate:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
