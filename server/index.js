import path from 'node:path'
import process from 'node:process'
import { serve } from '@hono/node-server'
import { createApp } from '../worker/app.js'
import { loadEnv } from './env.js'
import { createDatabase } from './database.js'
import { LocalObjectStorage } from './storage.js'
import { addStaticFiles } from './static.js'

const env = loadEnv()
const DB = createDatabase(env.DATABASE_PATH, path.resolve('database/schema.sql'))
const R2 = new LocalObjectStorage(env.UPLOAD_DIR)

const app = createApp()
const runtimeEnv = { ...env, DB, R2 }
const runtimeExecutionCtx = {
  waitUntil(promise) {
    Promise.resolve(promise).catch((error) => {
      console.error('[waitUntil] 异步任务失败:', error)
    })
  },
}

addStaticFiles(app, path.resolve('public'))

const server = serve({
  fetch(request) {
    return app.fetch(request, runtimeEnv, runtimeExecutionCtx)
  },
  hostname: env.HOST,
  port: env.PORT,
}, (info) => {
  console.log(`WXChat self-host server listening on http://${info.address}:${info.port}`)
  console.log(`Database: ${env.DATABASE_PATH}`)
  console.log(`Uploads: ${env.UPLOAD_DIR}`)
})

function shutdown(signal) {
  console.log(`${signal} received, shutting down...`)
  server.close(() => {
    DB.close()
    process.exit(0)
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
