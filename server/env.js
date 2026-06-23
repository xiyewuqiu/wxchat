import path from 'node:path'
import process from 'node:process'
import fs from 'node:fs'
import dotenv from 'dotenv'

dotenv.config()

function readInt(name, fallback) {
  const value = process.env[name]
  if (value === undefined || value === '') return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function readBool(name, fallback = false) {
  const value = process.env[name]
  if (value === undefined || value === '') return fallback
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

function resolvePath(value, fallback) {
  return path.resolve(process.cwd(), value || fallback)
}

function getMachineTimezone() {
  const candidates = [
    process.env.TZ,
    readTimezoneFile('/etc/timezone'),
    readLocaltimeTarget('/etc/localtime'),
  ]

  for (const timezone of candidates) {
    if (isValidTimezone(timezone)) return timezone.trim()
  }

  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    return isValidTimezone(timezone) ? timezone : 'UTC'
  } catch {
    return 'UTC'
  }
}

function isValidTimezone(timezone) {
  if (!timezone || typeof timezone !== 'string') return false
  try {
    Intl.DateTimeFormat('en-US', { timeZone: timezone.trim() }).format(new Date())
    return true
  } catch {
    return false
  }
}

function readTimezoneFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8').trim()
  } catch {
    return ''
  }
}

function readLocaltimeTarget(filePath) {
  try {
    const target = fs.realpathSync(filePath)
    const marker = '/zoneinfo/'
    const markerIndex = target.indexOf(marker)
    return markerIndex >= 0 ? target.slice(markerIndex + marker.length) : ''
  } catch {
    return ''
  }
}

function getConfiguredTimezone() {
  return isValidTimezone(process.env.APP_TIMEZONE) ? process.env.APP_TIMEZONE.trim() : ''
}

export function loadEnv() {
  const machineTimezone = getMachineTimezone()
  const appTimezone = getConfiguredTimezone()
  const env = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    ENVIRONMENT: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    HOST: process.env.HOST || '0.0.0.0',
    PORT: readInt('PORT', 3000),
    PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL || '',
    DATABASE_PATH: resolvePath(process.env.DATABASE_PATH, './data/wxchat.db'),
    UPLOAD_DIR: resolvePath(process.env.UPLOAD_DIR, './uploads'),
    ACCESS_PASSWORD: process.env.ACCESS_PASSWORD || 'wxchat2024',
    JWT_SECRET: process.env.JWT_SECRET || 'change-this-jwt-secret',
    SESSION_EXPIRE_HOURS: process.env.SESSION_EXPIRE_HOURS || '24',
    MAX_FILE_SIZE_MB: readInt('MAX_FILE_SIZE_MB', 100),
    MESSAGE_DEVICE_INFO_ENABLED: readBool('MESSAGE_DEVICE_INFO_ENABLED', false),
    MESSAGE_GROUP_WINDOW_MINUTES: readInt('MESSAGE_GROUP_WINDOW_MINUTES', 15),
    APP_TIMEZONE: appTimezone,
    SERVER_TIMEZONE: machineTimezone,
    ALLOW_CLIENT_TIMEZONE_OVERRIDE: readBool('ALLOW_CLIENT_TIMEZONE_OVERRIDE', true),
    AI_ENABLED: readBool('AI_ENABLED', false),
    IMAGE_GEN_ENABLED: readBool('IMAGE_GEN_ENABLED', false),
    AI_CHAT_BASE_URL: process.env.AI_CHAT_BASE_URL || '',
    AI_CHAT_API_KEY: process.env.AI_CHAT_API_KEY || '',
    AI_CHAT_MODEL: process.env.AI_CHAT_MODEL || '',
    AI_IMAGE_BASE_URL: process.env.AI_IMAGE_BASE_URL || '',
    AI_IMAGE_API_KEY: process.env.AI_IMAGE_API_KEY || '',
    AI_IMAGE_MODEL: process.env.AI_IMAGE_MODEL || '',
    AI_RATE_LIMIT: readInt('AI_RATE_LIMIT', 10),
    IMAGE_RATE_LIMIT: readInt('IMAGE_RATE_LIMIT', 5),
  }

  if (env.NODE_ENV === 'production') {
    if (!process.env.ACCESS_PASSWORD) {
      throw new Error('生产环境必须设置 ACCESS_PASSWORD')
    }
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'change-this-jwt-secret') {
      throw new Error('生产环境必须设置强 JWT_SECRET')
    }
  }

  return env
}
