import { pgTable, uuid, varchar, timestamp, text, integer, jsonb, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm/relations'
import { z } from 'zod'

// ============================================
// Enums
// ============================================

export const userRole = ['owner', 'receptionist'] as const
export type UserRole = typeof userRole[number]

export const patientOptInStatus = ['opted_in', 'opted_out', 'pending'] as const
export type PatientOptInStatus = typeof patientOptInStatus[number]

export const appointmentStatus = [
  'scheduled',
  'confirmed',
  'reschedule_requested',
  'completed',
  'no_show',
  'cancelled',
] as const
export type AppointmentStatus = typeof appointmentStatus[number]

export const reminderType = ['appointment_24h', 'appointment_2h', 'recall'] as const
export type ReminderType = typeof reminderType[number]

export const reminderStatus = ['pending', 'sent', 'failed', 'cancelled'] as const
export type ReminderStatus = typeof reminderStatus[number]

export const cashEntryType = ['inflow', 'outflow'] as const
export type CashEntryType = typeof cashEntryType[number]

export const cashEntryMode = ['cash', 'upi', 'card'] as const
export type CashEntryMode = typeof cashEntryMode[number]

export const cashEntryCategory = [
  'rent',
  'salaries',
  'supplies',
  'lab_fees',
  'other',
] as const
export type CashEntryCategory = typeof cashEntryCategory[number]

export const messageDirection = ['inbound', 'outbound'] as const
export type MessageDirection = typeof messageDirection[number]

// ============================================
// Tables
// ============================================

// Clinics - Multi-tenancy
export const clinics = pgTable(
  'clinics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    address: text('address'),
    phone: varchar('phone', { length: 50 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    clinicNameIdx: index('clinic_name_idx').on(table.name),
  })
)

// Users - Authentication
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clinicId: uuid('clinic_id')
      .notNull()
      .references(() => clinics.id, { onDelete: 'restrict' })
      .references(() => clinics.id, { onDelete: 'restrict' }),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    role: varchar('role', { enum: userRole }).notNull().default('receptionist'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userEmailIdx: index('user_email_idx').on(table.email),
    userClinicIdx: index('user_clinic_idx').on(table.clinicId),
  })
)

// Doctors - Weekly slots, breaks, holidays
export const doctors = pgTable(
  'doctors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clinicId: uuid('clinic_id')
      .notNull()
      .references(() => clinics.id, { onDelete: 'restrict' }),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }),
    weeklySlots: jsonb('weekly_slots')
      .$type<Record<string, Array<{ start: string; end: string }>>>()
      .notNull()
      .default({}),
    breaks: jsonb('breaks')
      .$type<Array<{ day: string; start: string; end: string }>>()
      .notNull()
      .default([]),
    holidays: jsonb('holidays')
      .$type<string[]>()
      .notNull()
      .default([]),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    doctorClinicIdx: index('doctor_clinic_idx').on(table.clinicId),
  })
)

// Patients - NO medical data per requirements
export const patients = pgTable(
  'patients',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clinicId: uuid('clinic_id')
      .notNull()
      .references(() => clinics.id, { onDelete: 'restrict' }),
    name: varchar('name', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 50 }).notNull(),
    optInStatus: varchar('opt_in_status', { enum: patientOptInStatus })
      .notNull()
      .default('pending'),
    optInAt: timestamp('opt_in_at'),
    optOutAt: timestamp('opt_out_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) =>
    ({
      patientClinicIdx: index('patient_clinic_idx').on(table.clinicId),
      patientPhoneIdx: index('patient_phone_idx').on(table.phone),
    })
)

// Appointments
export const appointments = pgTable(
  'appointments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clinicId: uuid('clinic_id')
      .notNull()
      .references(() => clinics.id, { onDelete: 'restrict' }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'restrict' }),
    doctorId: uuid('doctor_id')
      .notNull()
      .references(() => doctors.id, { onDelete: 'restrict' }),
    startTime: timestamp('start_time').notNull(),
    endTime: timestamp('end_time').notNull(),
    status: varchar('status', { enum: appointmentStatus })
      .notNull()
      .default('scheduled'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    appointmentClinicIdx: index('appointment_clinic_idx').on(table.clinicId),
    appointmentStatusIdx: index('appointment_status_idx').on(table.status),
    appointmentTimeIdx: index('appointment_time_idx').on(table.startTime),
  })
)

// Reminders
export const reminders = pgTable(
  'reminders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clinicId: uuid('clinic_id')
      .notNull()
      .references(() => clinics.id, { onDelete: 'restrict' }),
    appointmentId: uuid('appointment_id')
      .notNull()
      .references(() => appointments.id, { onDelete: 'restrict' }),
    type: varchar('type', { enum: reminderType }).notNull(),
    scheduledFor: timestamp('scheduled_for').notNull(),
    status: varchar('status', { enum: reminderStatus })
      .notNull()
      .default('pending'),
    waMessageId: varchar('wa_message_id', { length: 255 }),
    template: varchar('template', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    reminderClinicIdx: index('reminder_clinic_idx').on(table.clinicId),
    reminderScheduledIdx: index('reminder_scheduled_idx').on(table.scheduledFor),
    reminderStatusIdx: index('reminder_status_idx').on(table.status),
  })
)

// Recall rules
export const recallRules = pgTable(
  'recall_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clinicId: uuid('clinic_id')
      .notNull()
      .references(() => clinics.id, { onDelete: 'restrict' }),
    daysAfterVisit: integer('days_after_visit').notNull(),
    template: varchar('template', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    recallClinicIdx: index('recall_clinic_idx').on(table.clinicId),
  })
)

// Cash entries
export const cashEntries = pgTable(
  'cash_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clinicId: uuid('clinic_id')
      .notNull()
      .references(() => clinics.id, { onDelete: 'restrict' }),
    type: varchar('type', { enum: cashEntryType }).notNull(),
    amountPaise: integer('amount_paise').notNull(),
    mode: varchar('mode', { enum: cashEntryMode }).notNull(),
    category: varchar('category', { enum: cashEntryCategory }).notNull(),
    appointmentId: uuid('appointment_id').references(
      () => appointments.id,
      { onDelete: 'set null' }
    ),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    note: text('note'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    cashEntryClinicIdx: index('cash_entry_clinic_idx').on(table.clinicId),
    cashEntryDateIdx: index('cash_entry_date_idx').on(table.createdAt),
  })
)

// Message log
export const messageLog = pgTable(
  'message_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clinicId: uuid('clinic_id').references(() => clinics.id, {
      onDelete: 'restrict',
    }),
    direction: varchar('direction', {
      enum: messageDirection,
    }).notNull(),
    waMessageId: varchar('wa_message_id', { length: 255 }),
    fromNumber: varchar('from_number', { length: 50 }).notNull(),
    toNumber: varchar('to_number', { length: 50 }).notNull(),
    body: text('body'),
    status: varchar('status', { length: 50 }).notNull().default('received'),
    processed: jsonb('processed').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    messageClinicIdx: index('message_clinic_idx').on(table.clinicId),
    messageDirectionIdx: index('message_direction_idx').on(table.direction),
  })
)

// Audit log
export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clinicId: uuid('clinic_id').references(() => clinics.id, {
      onDelete: 'restrict',
    }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'restrict' }),
    action: varchar('action', { length: 100 }).notNull(),
    details: jsonb('details').$type<Record<string, unknown>>(),
    ipAddress: varchar('ip_address', { length: 45 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    auditClinicIdx: index('audit_clinic_idx').on(table.clinicId),
    auditActionIdx: index('audit_action_idx').on(table.action),
  })
)

// ============================================
// Relations
// ============================================

export const clinicsRelations = relations(clinics, ({ many }) => ({
  users: many(users),
  doctors: many(doctors),
  patients: many(patients),
  appointments: many(appointments),
  reminders: many(reminders),
  recallRules: many(recallRules),
  cashEntries: many(cashEntries),
  messageLogs: many(messageLog),
  auditLogs: many(auditLog),
}))

export const usersRelations = relations(users, ({ many }) => ({
  cashEntries: many(cashEntries),
  auditLogs: many(auditLog),
}))

export const doctorsRelations = relations(doctors, ({ many }) => ({
  appointments: many(appointments),
}))

export const patientsRelations = relations(patients, ({ many }) => ({
  appointments: many(appointments),
}))

export const appointmentsRelations = relations(
  appointments,
  ({ one, many }) => ({
    patient: one(patients),
    doctor: one(doctors),
    reminders: many(reminders),
    cashEntries: many(cashEntries),
  })
)

export const remindersRelations = relations(
  reminders,
  ({ one }) => ({
    appointment: one(appointments),
  })
)

export const cashEntriesRelations = relations(
  cashEntries,
  ({ one }) => ({
    appointment: one(appointments),
    createdByUser: one(users),
  })
)

// ============================================
// Zod Schemas for Validation
// ============================================

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(userRole).default('receptionist'),
})

export const createClinicSchema = z.object({
  name: z.string().min(1, 'Clinic name is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
})

export const createPatientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
})

export const createAppointmentSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  startTime: z.date(),
  endTime: z.date(),
})

export const createCashEntrySchema = z.object({
  type: z.enum(cashEntryType),
  amountPaise: z.number().positive(),
  mode: z.enum(cashEntryMode),
  category: z.enum(cashEntryCategory),
  appointmentId: z.string().uuid().optional(),
  note: z.string().optional(),
})