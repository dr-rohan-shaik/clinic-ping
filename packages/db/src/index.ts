// ClinicPing Database Package
// Exports Drizzle ORM schema and validation utilities

import { drizzle } from 'drizzle-orm/node-postgres'

export * from './schema'
export { drizzle }
export { eq, and, or, not, inArray, isNull, isNotNull } from 'drizzle-orm'

// Database connection
export async function getDb() {
  const { Pool } = await import('pg')

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  const db = drizzle(pool)
  return db
}