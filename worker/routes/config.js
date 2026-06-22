import { Hono } from 'hono'

const config = new Hono()

config.get('/', (c) => {
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
        deviceInfoEnabled: c.env.MESSAGE_DEVICE_INFO_ENABLED === true || c.env.MESSAGE_DEVICE_INFO_ENABLED === 'true',
      },
    },
  })
})

export default config
