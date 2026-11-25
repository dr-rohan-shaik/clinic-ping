import 'server-only'

// Dynamic import to avoid bundling postgres in client
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import * as schema from '@clinicping/db/schema'

let _client: ReturnType<typeof import('postgres').default> | null = null
let _db: PostgresJsDatabase<typeof schema> | null = null

async function getDb(): Promise<PostgresJsDatabase<typeof schema>> {
  if (!_db) {
    const postgres = (await import('postgres')).default
    const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/clinicping?schema=public&sslmode=disable'
    _client = postgres(connectionString, { prepare: false })
    const { drizzle } = await import('drizzle-orm/postgres-js')
    _db = drizzle(_client, { schema })
  }
  return _db
}

export const db = {
  select: (...args: Parameters<PostgresJsDatabase<typeof schema>['select']>) => getDb().then(db => db.select(...args)),
  insert: (table: Parameters<PostgresJsDatabase<typeof schema>['insert']>[0]) => getDb().then(db => db.insert(table)),
  update: (table: Parameters<PostgresJsDatabase<typeof schema>['update']>[0]) => getDb().then(db => db.update(table)),
  delete: (table: Parameters<PostgresJsDatabase<typeof schema>['delete']>[0]) => getDb().then(db => db.delete(table)),
}