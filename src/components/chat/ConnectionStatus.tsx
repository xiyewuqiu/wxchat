import { useUiStore } from '@/store/uiStore'
import type { ConnectionStatus as Status } from '@/types'

const LABELS: Record<Status, string> = {
  connected: '已连接',
  connecting: '连接中...',
  reconnecting: '重连中...',
  disconnected: '离线模式',
  offline: '离线模式',
}

const CLASS_NAMES: Record<Status, string> = {
  connected: 'online',
  connecting: 'connecting',
  reconnecting: 'connecting',
  disconnected: 'offline',
  offline: 'offline',
}

/** 右上角连接状态角标 */
export function ConnectionStatus() {
  const status = useUiStore((state) => state.connectionStatus)

  return <div className={`connection-status ${CLASS_NAMES[status]}`}>{LABELS[status]}</div>
}