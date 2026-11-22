import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { appointments, patients, cashEntries, clinics } from '@/lib/db/schema'
import { eq, and, gte, lt, sql, sum } from 'drizzle-orm'
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clinicId = session.user.clinicId
    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }) // Monday
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

    // Today's appointments
    const todayAppointmentsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(
        and(
          eq(appointments.clinicId, clinicId),
          gte(appointments.startTime, todayStart),
          lt(appointments.startTime, todayEnd)
        )
      )

    // This week's appointments
    const thisWeekAppointmentsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(
        and(
          eq(appointments.clinicId, clinicId),
          gte(appointments.startTime, weekStart),
          lt(appointments.startTime, weekEnd)
        )
      )

    // Total patients
    const totalPatientsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(patients)
      .where(eq(patients.clinicId, clinicId))

    // Cash balance (inflow - outflow)
    const cashResult = await db
      .select({
        inflow: sum(cashEntries.amountPaise),
        outflow: sum(cashEntries.amountPaise),
      })
      .from(cashEntries)
      .where(eq(cashEntries.clinicId, clinicId))

    const todayAppointments = Number(todayAppointmentsResult[0]?.count || 0)
    const thisWeekAppointments = Number(thisWeekAppointmentsResult[0]?.count || 0)
    const totalPatients = Number(totalPatientsResult[0]?.count || 0)
    const cashBalance = Number((cashResult[0]?.inflow || 0) - (cashResult[0]?.outflow || 0))

    return NextResponse.json({
      todayAppointments,
      thisWeekAppointments,
      totalPatients,
      cashBalance,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}