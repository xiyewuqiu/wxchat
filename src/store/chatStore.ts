import { create } from 'zustand'
import * as messagesApi from '@/api/messages'
import * as filesApi from '@/api/files'
import * as aiApi from '@/api/ai'
import { CLEAR_COMMAND, ERRORS, UI_CONFIG } from '@/config'
import { getDeviceId, getDeviceType } from '@/lib/utils'
import { cleanAiPrompt } from '@/lib/aiContent'
import { useUiStore } from './uiStore'
import type { ChatMessage, StreamingAiMessage } from '@/types'

interface UploadState {
  active: boolean
  current: number
  total: number
  fileName: string
  progress: number
}

interface ChatState {
  messages: ChatMessage[]
  /** 首次加载是否完成，用于区分空状态与加载态 */
  loaded: boolean
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  totalLoaded: number
  /** 服务端消息总数 */
  total: number
  streaming: StreamingAiMessage | null
  isAiProcessing: boolean
  upload: UploadState

  /** 每次需要滚动到底部时自增，组件据此触发滚动 */
  scrollSignal: number

  loadInitial: () => Promise<void>
  refresh: (forceScroll?: boolean) => Promise<void>
  loadMore: () => Promise<void>
  sendText: (content: string) => Promise<void>
  uploadFiles: (files: File[]) => Promise<void>
  sendAi: (content: string) => Promise<void>
  cancelAi: () => void
  clearAll: () => Promise<void>
  reset: () => void
}

const INITIAL_UPLOAD: UploadState = { active: false, current: 0, total: 0, fileName: '', progress: 0 }

let aiController: AbortController | null = null

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  loaded: false,
  isLoading: false,
  isLoadingMore: false,
  hasMore: false,
  totalLoaded: 0,
  total: 0,
  streaming: null,
  isAiProcessing: false,
  upload: INITIAL_UPLOAD,
  scrollSignal: 0,

  async loadInitial() {
    if (get().isLoading) return
    set({ isLoading: true })

    try {
      const { messages, total } = await messagesApi.fetchMessages(UI_CONFIG.MESSAGE_LOAD_LIMIT, 0)
      set({
        messages,
        loaded: true,
        total,
        totalLoaded: messages.length,
        hasMore: messages.length < total,
        scrollSignal: get().scrollSignal + 1,
      })
    } catch (error) {
      set({ loaded: true })
      useUiStore.getState().toast((error as Error).message || ERRORS.LOAD_MESSAGES_FAILED, 'error')
    } finally {
      set({ isLoading: false })
    }
  },

  /**
   * 重新拉取消息。
   * 拉取量取已加载条数与首页大小中的较大值，避免刷新后丢失已加载的历史消息。
   */
  async refresh(forceScroll = false) {
    if (get().isLoading) return
    set({ isLoading: true })

    try {
      const limit = Math.max(get().totalLoaded, UI_CONFIG.MESSAGE_LOAD_LIMIT)
      const { messages, total } = await messagesApi.fetchMessages(limit, 0)
      set({
        messages,
        loaded: true,
        total,
        totalLoaded: messages.length,
        hasMore: messages.length < total,
        ...(forceScroll ? { scrollSignal: get().scrollSignal + 1 } : {}),
      })
    } catch (error) {
      console.error('刷新消息失败:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  async loadMore() {
    const { isLoadingMore, hasMore, totalLoaded } = get()
    if (isLoadingMore || !hasMore) return

    set({ isLoadingMore: true })
    try {
      const { messages: older, total } = await messagesApi.fetchMessages(
        UI_CONFIG.LOAD_MORE_BATCH_SIZE,
        totalLoaded,
      )

      if (older.length === 0) {
        set({ hasMore: false, total })
        return
      }

      const merged = [...older, ...get().messages]
      set({
        messages: merged,
        total,
        totalLoaded: merged.length,
        hasMore: merged.length < total,
      })
    } catch (error) {
      console.error('加载更多消息失败:', error)
    } finally {
      set({ isLoadingMore: false })
    }
  },

  async sendText(content) {
    const ui = useUiStore.getState()
    const deviceId = getDeviceId()
    ui.setConnectionStatus('connecting')

    try {
      await messagesApi.sendMessage(content, deviceId)
      await get().refresh(true)
      ui.setConnectionStatus('connected')
    } catch (error) {
      ui.setConnectionStatus('disconnected')
      throw error
    }
  },

  async uploadFiles(files) {
    if (files.length === 0) return

    const ui = useUiStore.getState()
    const deviceId = getDeviceId()
    set({ upload: { ...INITIAL_UPLOAD, active: true, total: files.length } })

    let successCount = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      set({ upload: { ...get().upload, current: i + 1, fileName: file.name, progress: 0 } })

      try {
        await filesApi.uploadFile(file, deviceId, (progress) => {
          set({ upload: { ...get().upload, progress } })
        })
        successCount++
      } catch (error) {
        console.error(`文件 ${file.name} 上传失败:`, error)
      }
    }

    set({ upload: INITIAL_UPLOAD })

    if (successCount > 0) {
      ui.toast(`成功上传 ${successCount} 个文件`, 'success')
      await get().refresh(true)
    }
    if (successCount < files.length) {
      ui.toast(`${files.length - successCount} 个文件上传失败`, 'error')
    }
  },

  async sendAi(content) {
    if (get().isAiProcessing) return

    const ui = useUiStore.getState()
    const deviceId = getDeviceId()
    const prompt = cleanAiPrompt(content)
    if (!prompt) return

    set({ isAiProcessing: true })
    aiController = new AbortController()

    try {
      // 用户提问先落库，保证刷新后对话上下文完整
      await messagesApi.sendMessage(prompt, deviceId)
      await get().refresh(true)

      const streamId = `stream-${Date.now()}`
      set({
        streaming: { id: streamId, kind: 'streaming', content: '', thinking: '', timestamp: new Date().toISOString() },
        scrollSignal: get().scrollSignal + 1,
      })

      const result = await aiApi.streamChat(
        prompt,
        (state) => {
          set({
            streaming: {
              id: streamId,
              kind: 'streaming',
              content: state.response,
              thinking: state.thinking,
              timestamp: new Date().toISOString(),
            },
          })
        },
        aiController.signal,
      )

      set({ streaming: null })

      if (result.cancelled) return

      // 思考过程与正式回答分别落库，刷新后可完整还原
      if (result.thinking) {
        await messagesApi.sendAiMessage(result.thinking, 'ai-system', 'ai_thinking')
      }
      await messagesApi.sendAiMessage(result.response || '抱歉，我无法生成回答。', 'ai-system', 'ai_response')
      await get().refresh(true)
    } catch (error) {
      const message = (error as Error).message || ERRORS.AI_REQUEST_FAILED
      set({ streaming: null })
      ui.toast(message, 'error')
    } finally {
      aiController = null
      set({ isAiProcessing: false })
    }
  },

  cancelAi() {
    aiController?.abort()
    aiController = null
    set({ streaming: null, isAiProcessing: false })
  },

  async clearAll() {
    const ui = useUiStore.getState()
    const answer = await ui.askConfirm({
      title: '清空所有数据',
      message: CLEAR_COMMAND.CONFIRM_MESSAGE,
      confirmText: '确定清空',
      requireInput: true,
      inputPlaceholder: `请输入确认码：${CLEAR_COMMAND.CONFIRM_CODE}`,
    })

    if (answer === null) {
      ui.toast(ERRORS.CLEAR_CANCELLED, 'warning')
      return
    }
    if (answer !== CLEAR_COMMAND.CONFIRM_CODE) {
      ui.toast('确认码错误，数据清理已取消', 'error')
      return
    }

    try {
      const result = await messagesApi.clearAllData(answer)
      set({ messages: [], totalLoaded: 0, hasMore: false })
      ui.toast(
        `数据清理完成：消息 ${result.deletedMessages} 条 / 文件 ${result.deletedFiles} 个 / 释放 ${(result.deletedFileSize / 1024 / 1024).toFixed(2)} MB`,
        'success',
      )
    } catch (error) {
      ui.toast((error as Error).message || ERRORS.CLEAR_FAILED, 'error')
    }
  },

  reset() {
    aiController?.abort()
    aiController = null
    set({
      messages: [],
      loaded: false,
      isLoading: false,
      isLoadingMore: false,
      hasMore: false,
      totalLoaded: 0,
      total: 0,
      streaming: null,
      isAiProcessing: false,
      upload: INITIAL_UPLOAD,
    })
  },
}))

/** 供长轮询使用：已加载消息中的最大 ID */
export function selectLastMessageId(state: ChatState): number {
  const last = state.messages[state.messages.length - 1]
  return last?.id ?? 0
}

export async function syncDeviceInfo(): Promise<boolean> {
  return messagesApi.syncDevice(getDeviceId(), getDeviceType())
}