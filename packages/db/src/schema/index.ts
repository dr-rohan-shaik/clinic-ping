import { pgTable, uuid, text, timestamp, boolean, jsonb, integer, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Enums
export const userRole = ['owner', 'receptionist'] as const
export const appointmentStatus = ['scheduled', 'confirmed', 'reschedule_requested', 'completed', 'no_show', 'cancelled'] as const
export const reminderType = ['appointment_24h', 'appointment_2h', 'recall'] as const
export const reminderStatus = ['pending', 'sent', 'failed', 'cancelled'] as const
export const cashEntryType = ['inflow', 'outflow'] as const
export const cashEntryMode = ['cash', 'upi', 'card'] as const
export const patientOptInStatus = ['opted_in', 'opted_out', 'pending'] as const

export type UserRole = typeof userRole[number]
export type AppointmentStatus = typeof appointmentStatus[number]
export type ReminderType = typeof reminderType[number]
export type ReminderStatus = typeof reminderStatus[number]
export type CashEntryType = typeof cashEntryType[number]
export type CashEntryMode = typeof cashEntryMode[number]
export type PatientOptInStatus = typeof patientOptInStatus[number]

// Tables
export const clinics = pgTable('clinics', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  address: text('address'),
  phone: text('phone'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clinicId: uuid('clinic_id').references(() => clinics.id).notNull(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: userRole }).notNull().default('receptionist'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  clinicIdx: index('users_clinic_idx').on(table.clinicId),
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
}))

export const doctors = pgTable('doctors', {
  id: uuid('id').primaryKey().defaultRandom(),
  clinicId: uuid('clinic_id').references(() => clinics.id).notNull(),
  name: text('name').notNull(),
  email: text('email'),
  weeklySlots: jsonb('weekly_slots').default({}).notNull(),
  breaks: jsonb('breaks').default([]).notNull(),
  holidays: jsonb('holidays').default([]).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  clinicIdx: index('doctors_clinic_idx').on(table.clinicId),
}))

export const patients = pgTable('patients', {
  id: uuid('id').primaryKey().defaultRandom(),
  clinicId: uuid('clinic_id').references(() => clinics.id).notNull(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  optInStatus: text('opt_in_status', { enum: patientOptInStatus }).notNull().default('pending'),
  optInAt: timestamp('opt_in_at', { withTimezone: true }),
  optOutAt: timestamp('opt_out_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  clinicIdx: index('patients_clinic_idx').on(table.clinicId),
  phoneIdx: index('patients_phone_idx').on(table.phone),
}))

export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  clinicId: uuid('clinic_id').references(() => clinics.id).notNull(),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),
  doctorId: uuid('doctor_id').references(() => doctors.id).notNull(),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }).notNull(),
  status: text('status', { enum: appointmentStatus }).notNull().default('scheduled'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  clinicIdx: index('appointments_clinic_idx').on(table.clinicId),
  doctorIdx: index('appointments_doctor_idx').on(table.doctorId),
  patientIdx: index('appointments_patient_idx').on(table.patientId),
  startTimeIdx: index('appointments_start_time_idx').on(table.startTime),
}))

export const reminders = pgTable('reminders', {
  id: uuid('id').primaryKey().defaultRandom(),
  clinicId: uuid('clinic_id').references(() => clinics.id).notNull(),
  appointmentId: uuid('appointment_id').references(() => appointments.id).notNull(),
  type: text('type', { enum: reminderType }).notNull(),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
  status: text('status', { enum: reminderStatus }).notNull().default('pending'),
  waMessageId: text('wa_message_id'),
  template: text('template'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  clinicIdx: index('reminders_clinic_idx').on(table.clinicId),
  appointmentIdx: index('reminders_appointment_idx').on(table.appointmentId),
  scheduledIdx: index('reminders_scheduled_idx').on(table.scheduledFor),
}))

export const recallRules = pgTable('recall_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  clinicId: uuid('clinic_id').references(() => clinics.id).notNull(),
  daysAfterVisit: integer('days_after_visit').notNull(),
  template: text('template').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  clinicIdx: index('recall_rules_clinic_idx').on(table.clinicId),
}))

export const cashEntries = pgTable('cash_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  clinicId: uuid('clinic_id').references(() => clinics.id).notNull(),
  type: text('type', { enum: cashEntryType }).notNull(),
  amountPaise: integer('amount_paise').notNull(),
  mode: text('mode', { enum: cashEntryMode }).notNull(),
  category: text('category'),
  appointmentId: uuid('appointment_id').references(() => appointments.id),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  clinicIdx: index('cash_entries_clinic_idx').on(table.clinicId),
  typeIdx: index('cash_entries_type_idx').on(table.type),
  createdAtIdx: index('cash_entries_created_at_idx').on(table.createdAt),
}))

export const messageLog = pgTable('message_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  clinicId: uuid('clinic_id').references(() => clinics.id).notNull(),
  direction: text('direction', { enum: ['inbound', 'outbound'] }).notNull(),
  waMessageId: text('wa_message_id'),
  fromNumber: text('from_number'),
  toNumber: text('to_number'),
  body: text('body'),
  status: text('status'),
  processed: jsonb('processed'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  clinicIdx: index('message_log_clinic_idx').on(table.clinicId),
  waMessageIdIdx: index('message_log_wa_message_id_idx').on(table.waMessageId),
}))

export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  clinicId: uuid('clinic_id').references(() => clinics.id).notNull(),
  userId: uuid('user_id').references(() => users.id),
  action: text('action').notNull(),
  details: jsonb('details'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  clinicIdx: index('audit_log_clinic_idx').on(table.clinicId),
  userIdx: index('audit_log_user_idx').on(table.userId),
}))

// Relations
export const clinicsRelations = relations(clinics, ({ many }) => ({
  users: many(users),
  doctors: many(doctors),
  patients: many(patients),
  appointments: many(appointments),
  reminders: many(reminders),
  recallRules: many(recallRules),
  cashEntries: many(cashEntries),
  messageLog: many(messageLog),
  auditLog: many(auditLog),
}))

export const usersRelations = relations(users, ({ one, many }) => ({
  clinic: one(clinics, { fields: [users.clinicId], references: [clinics.id] }),
  cashEntries: many(cashEntries),
  auditLog: many(auditLog),
}))

export const doctorsRelations = relations(doctors, ({ one, many }) => ({
  clinic: one(clinics, { fields: [doctors.clinicId], references: [clinics.id] }),
  appointments: many(appointments),
}))

export const patientsRelations = relations(patients, ({ one, many }) => ({
  clinic: one(clinics, { fields: [patients.clinicId], references: [clinics.id] }),
  appointments: many(appointments),
}))

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  clinic: one(clinics, { fields: [appointments.clinicId], references: [clinics.id] }),
  patient: one(patients, { fields: [appointments.patientId], references: [patients.id] }),
  doctor: one(doctors, { fields: [appointments.doctorId], references: [doctors.id] }),
  reminders: many(reminders),
  cashEntries: many(cashEntries),
}))

export const remindersRelations = relations(reminders, ({ one }) => ({
  clinic: one(clinics, { fields: [reminders.clinicId], references: [clinics.id] }),
  appointment: one(appointments, { fields: [reminders.appointmentId], references: [appointments.id] }),
}))

export const recallRulesRelations = relations(recallRules, ({ one }) => ({
  clinic: one(clinics, { fields: [recallRules.clinicId], references: [clinics.id] }),
}))

export const cashEntriesRelations = relations(cashEntries, ({ one }) => ({
  clinic: one(clinics, { fields: [cashEntries.clinicId], references: [clinics.id] }),
  appointment: one(appointments, { fields: [cashEntries.appointmentId], references: [appointments.id] }),
  createdBy: one(users, { fields: [cashEntries.createdBy], references: [users.id] }),
}))

export const messageLogRelations = relations(messageLog, ({ one }) => ({
  clinic: one(clinics, { fields: [messageLog.clinicId], references: [clinics.id] }),
}))

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  clinic: one(clinics, { fields: [auditLog.clinicId], references: [clinics.id] }),
  user: one(users, { fields: [auditLog.userId], references: [users.id] }),
}))
