import fs from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

function toD1Result(result) {
  return {
    success: true,
    meta: {
      changes: result.changes ?? 0,
      last_row_id: result.lastInsertRowid ? Number(result.lastInsertRowid) : 0,
    },
  }
}

class D1PreparedStatement {
  constructor(statement) {
    this.statement = statement
    this.params = []
  }

  bind(...params) {
    this.params = params
    return this
  }

  async all() {
    return {
      success: true,
      results: this.statement.all(...this.params),
    }
  }

  async first() {
    return this.statement.get(...this.params) || null
  }

  async run() {
    return toD1Result(this.statement.run(...this.params))
  }
}

class D1DatabaseAdapter {
  constructor(database) {
    this.database = database
  }

  prepare(sql) {
    return new D1PreparedStatement(this.database.prepare(sql))
  }

  close() {
    this.database.close()
  }
}

export function createDatabase(databasePath, schemaPath = path.resolve('database/schema.sql')) {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true })

  const database = new DatabaseSync(databasePath)
  database.exec('PRAGMA journal_mode = WAL')
  database.exec('PRAGMA foreign_keys = ON')

  if (fs.existsSync(schemaPath)) {
    database.exec(fs.readFileSync(schemaPath, 'utf8'))
  }

  return new D1DatabaseAdapter(database)
}
