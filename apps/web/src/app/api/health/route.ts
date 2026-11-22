import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ClinicPing Web',
    version: process.env.NEXT_PUBLIC_VERSION || '1.0.0',
  })
}