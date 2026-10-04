import { CLEAR_COMMAND, LOGOUT_COMMANDS, PWA_COMMANDS } from '@/config'

export function isClearCommand(content: string): boolean {
  const normalized = content.trim().toLowerCase()
  return CLEAR_COMMAND.TRIGGER_COMMANDS.some((command) => command.toLowerCase() === normalized)
}

export function isLogoutCommand(content: string): boolean {
  const normalized = content.trim().toLowerCase()
  return LOGOUT_COMMANDS.includes(normalized as (typeof LOGOUT_COMMANDS)[number])
}

export function isPwaCommand(content: string): boolean {
  const normalized = content.trim().toLowerCase()
  return PWA_COMMANDS.includes(normalized as (typeof PWA_COMMANDS)[number])
}