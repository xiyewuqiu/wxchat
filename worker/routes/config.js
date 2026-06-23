import { Hono } from 'hono'

const config = new Hono()

function readBool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback
  if (typeof value === 'boolean') return value
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase())
}

function readInt(value, fallback) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function getRuntimeTimezone(env) {
  const fallback = env.SERVER_TIMEZONE || 'UTC'
  const timezone = env.APP_TIMEZONE || env.SERVER_TIMEZONE || fallback
  try {
    Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date())
    return timezone
  } catch {
    return fallback
  }
}

config.get('/', (c) => {
  const serverTimezone = c.env.SERVER_TIMEZONE || 'UTC'
  const defaultTimezone = getRuntimeTimezone(c.env)

  return c.json({
    success: true,
    data: {
      ai: {
        enabled: c.env.AI_ENABLED === true || c.env.AI_ENABLED === 'true',
        model: c.env.AI_CHAT_MODEL || '',
        maxTokens: Number.parseInt(c.env.AI_CHAT_MAX_TOKENS || '4000', 10),
        temperature: Number.parseFloat(c.env.AI_CHAT_TEMPERATURE || '0.7'),
        stream: true,
      },
      imageGen: {
        enabled: c.env.IMAGE_GEN_ENABLED === true || c.env.IMAGE_GEN_ENABLED === 'true',
        model: c.env.AI_IMAGE_MODEL || '',
        defaultSize: c.env.AI_IMAGE_DEFAULT_SIZE || '1024x1024',
        defaultSteps: Number.parseInt(c.env.AI_IMAGE_DEFAULT_STEPS || '20', 10),
        defaultGuidance: Number.parseFloat(c.env.AI_IMAGE_DEFAULT_GUIDANCE || '7.5'),
        maxPromptLength: Number.parseInt(c.env.AI_IMAGE_MAX_PROMPT_LENGTH || '1000', 10),
      },
      file: {
        maxSizeMb: Number.parseInt(c.env.MAX_FILE_SIZE_MB || '100', 10),
      },
      message: {
        deviceInfoEnabled: readBool(c.env.MESSAGE_DEVICE_INFO_ENABLED, false),
        groupWindowMinutes: readInt(c.env.MESSAGE_GROUP_WINDOW_MINUTES, 15),
      },
      timezone: {
        serverTimezone,
        defaultTimezone,
        allowClientTimezoneOverride: readBool(c.env.ALLOW_CLIENT_TIMEZONE_OVERRIDE, true),
      },
    },
  })
})

export default config
