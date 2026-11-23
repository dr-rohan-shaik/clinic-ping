import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { appointments, patients, cashEntries } from '@clinicping/db/schema'
import { eq, and, gte, lt, sql, sum, count } from 'drizzle-orm'
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clinicId = session.user.clinicId as string
    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }) // Monday
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

    // Today's appointments
    const todayAppointments = await db
      .select({ count: count() })
      .from(appointments)
      .where(
        and(
          eq(appointments.clinicId, clinicId),
          gte(appointments.startTime, todayStart),
          lt(appointments.startTime, todayEnd)
        )
      )

    // This week's appointments
    const thisWeekAppointments = await db
      .select({ count: count() })
      .from(appointments)
      .where(
        and(
          eq(appointments.clinicId, clinicId),
          gte(appointments.startTime, weekStart),
          lt(appointments.startTime, weekEnd)
        )
      )

    // Total patients
    const totalPatients = await db
      .select({ count: count() })
      .from(patients)
      .where(eq(patients.clinicId, clinicId))

    // Cash balance (inflow - outflow)
    const inflowResult = await db
      .select({
        total: sum(sql<number>`COALESCE(SUM(CASE WHEN cash_entries.type = 'inflow' THEN cash_entries.amount_paise ELSE 0 END), 0)`)
      })
      .from(cashEntries)
      .where(eq(cashEntries.clinicId, clinicId))

    const outflowResult = await db
      .select({
        total: sum(sql<number>`COALESCE(SUM(CASE WHEN cash_entries.type = 'outflow' THEN cash_entries.amount_paise ELSE 0 END), 0)`)
      })
      .from(cashEntries)
      .where(eq(cashEntries.clinicId, clinicId))

    const inflow = Number(inflowResult[0]?.total ?? 0)
    const outflow = Number(outflowResult[0]?.total ?? 0)

    return NextResponse.json({
      todayAppointments: todayAppointments[0]?.count ?? 0,
      thisWeekAppointments: thisWeekAppointments[0]?.count ?? 0,
      totalPatients: totalPatients[0]?.count ?? 0,
      cashBalance: inflow - outflow,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
