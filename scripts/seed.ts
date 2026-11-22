/**
 * ClinicPing Seed Script
 * Generates demo data for development/testing
 * All records labelled DEMO
 */

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import {
  clinics,
  users,
  doctors,
  patients,
  appointments,
  cashEntries,
  recallRules,
} from '../packages/db/src/schema'
import { randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/clinicping',
})

const db = drizzle(pool)

// Get seed password from env or use a secure default
const SEED_PASSWORD = process.env.SEED_PASSWORD || 'demo12345'

async function seed() {
  console.log('Seeding ClinicPing database with DEMO data...\n')

  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  // Create demo clinic
  const [clinic] = await db.insert(clinics).values({
    id: '00000000-0000-0000-0000-000000000001',
    name: 'DEMO: City Health Clinic',
    address: '123 Demo Street, Mumbai, Maharashtra 400001',
    phone: '+91 22 1234 5678',
  }).returning()

  console.log(`✓ Created clinic: ${clinic.name}`)

  // Create admin user
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10)
  const [admin] = await db.insert(users).values({
    id: randomUUID(),
    clinicId: clinic.id,
    name: 'DEMO: Admin User',
    email: 'admin@demo.clinic',
    passwordHash,
    role: 'owner',
  }).returning()

  console.log(`✓ Created admin user: ${admin.email}`)

  // Create receptionist
  const [receptionist] = await db.insert(users).values({
    id: randomUUID(),
    clinicId: clinic.id,
    name: 'DEMO: Receptionist User',
    email: 'receptionist@demo.clinic',
    passwordHash,
    role: 'receptionist',
  }).returning()

  console.log(`✓ Created receptionist: ${receptionist.email}`)

  // Create doctors
  const [doctor1] = await db.insert(doctors).values({
    id: randomUUID(),
    clinicId: clinic.id,
    name: 'DEMO: Dr. Priya Sharma',
    email: 'priya.sharma@demo.clinic',
    weeklySlots: {
      monday: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
      tuesday: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
      wednesday: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
      thursday: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
      friday: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
    },
    breaks: [{ day: 'friday', start: '12:00', end: '14:00' }],
    holidays: ['2024-10-02', '2024-12-25', '2024-01-26'],
  }).returning()

  const [doctor2] = await db.insert(doctors).values({
    id: randomUUID(),
    clinicId: clinic.id,
    name: 'DEMO: Dr. Ramesh Kumar',
    email: 'ramesh.kumar@demo.clinic',
    weeklySlots: {
      monday: [{ start: '10:00', end: '13:00' }],
      tuesday: [{ start: '10:00', end: '13:00' }],
      wednesday: [{ start: '10:00', end: '13:00' }],
      thursday: [{ start: '10:00', end: '13:00' }],
      friday: [{ start: '10:00', end: '13:00' }],
    },
    breaks: [],
    holidays: [],
  }).returning()

  console.log(`✓ Created doctors: ${doctor1.name}, ${doctor2.name}`)

  // Create patients (opt-in for WhatsApp)
  const [patient1] = await db.insert(patients).values({
    id: randomUUID(),
    clinicId: clinic.id,
    name: 'DEMO: Rajesh Patel',
    phone: '+91 98765 43210',
    optInStatus: 'opted_in',
    optInAt: new Date('2024-01-01'),
  }).returning()

  const [patient2] = await db.insert(patients).values({
    id: randomUUID(),
    clinicId: clinic.id,
    name: 'DEMO: Priya Desai',
    phone: '+91 91234 56789',
    optInStatus: 'opted_in',
    optInAt: new Date('2024-01-02'),
  }).returning()

  const [patient3] = await db.insert(patients).values({
    id: randomUUID(),
    clinicId: clinic.id,
    name: 'DEMO: Amit Johnson',
    phone: '+91 98765 12345',
    optInStatus: 'opted_out',
    optOutAt: new Date('2023-12-15'),
  }).returning()

  console.log(`✓ Created patients: ${patient1.name}, ${patient2.name}, ${patient3.name}`)

  // Create appointments for cash entries reference
  const [appointment1] = await db.insert(appointments).values({
    id: randomUUID(),
    clinicId: clinic.id,
    patientId: patient1.id,
    doctorId: doctor1.id,
    startTime: tomorrow,
    endTime: new Date(tomorrow.getTime() + 30 * 60 * 1000),
    status: 'scheduled',
  }).returning()

  const [appointment2] = await db.insert(appointments).values({
    id: randomUUID(),
    clinicId: clinic.id,
    patientId: patient2.id,
    doctorId: doctor2.id,
    startTime: nextWeek,
    endTime: new Date(nextWeek.getTime() + 30 * 60 * 1000),
    status: 'confirmed',
  }).returning()

  console.log(`✓ Created appointments`)

  // Create cash entries
  await db.insert(cashEntries).values([
    {
      id: randomUUID(),
      clinicId: clinic.id,
      type: 'inflow',
      amountPaise: 150000, // ₹1,500
      mode: 'cash',
      category: 'other',
      appointmentId: appointment1.id,
      createdBy: admin.id,
    },
    {
      id: randomUUID(),
      clinicId: clinic.id,
      type: 'outflow',
      amountPaise: 50000, // ₹500
      mode: 'upi',
      category: 'supplies',
      createdBy: admin.id,
      note: 'DEMO: Medical supplies purchase',
    },
  ])

  console.log(`✓ Created cash entries`)

  // Create recall rules
  await db.insert(recallRules).values([
    {
      id: randomUUID(),
      clinicId: clinic.id,
      daysAfterVisit: 7,
      template: 'recall_7d',
    },
    {
      id: randomUUID(),
      clinicId: clinic.id,
      daysAfterVisit: 30,
      template: 'recall_30d',
    },
  ])

  console.log(`✓ Created recall rules`)

  console.log('\n✅ Seed complete! Demo data ready.')
  console.log('\n📋 Demo user created at: admin@demo.clinic')

  await pool.end()
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error)
  process.exit(1)
})