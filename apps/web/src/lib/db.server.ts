import 'server-only'

// Dynamic import to avoid bundling postgres in client
let _client: any = null
let _db: any = null

async function getDb() {
  if (!_db) {
    const postgres = (await import('postgres')).default
    const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/clinicping?schema=public&sslmode=disable'
    _client = postgres(connectionString, { prepare: false })
    const { drizzle } = await import('drizzle-orm/postgres-js')
    _db = drizzle(_client)
  }
  return _db
}

export const db = {
  select: (...args: any[]) => getDb().then(db => db.select(...args)),
  from: (table: any) => getDb().then(db => db.from(table)),
  insert: (table: any) => getDb().then(db => db.insert(table)),
  update: (table: any) => getDb().then(db => db.update(table)),
  delete: (table: any) => getDb().then(db => db.delete(table)),
} as any