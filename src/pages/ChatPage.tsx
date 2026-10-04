import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDeviceId } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useChatStore, syncDeviceInfo } from '@/store/chatStore'
import { useUiStore } from '@/store/uiStore'
import { useRealtime } from '@/hooks/useRealtime'
import { useGlobalCommands } from '@/hooks/useGlobalCommands'
import { useClipboardPaste } from '@/hooks/useClipboardPaste'
import { usePwa } from '@/hooks/usePwa'
import { useComposer } from '@/hooks/useComposer'
import { MessageList } from '@/components/chat/MessageList'
import { InputBar } from '@/components/chat/InputBar'
import { DragOverlay } from '@/components/chat/DragOverlay'
import { FunctionMenu, type MenuAction } from '@/components/chat/FunctionMenu'
import { ImageGenModal } from '@/components/chat/ImageGenModal'
import { SearchModal } from '@/components/chat/SearchModal'
import { ConnectionStatus } from '@/components/chat/ConnectionStatus'
import { UpdateBanner } from '@/components/chat/UpdateBanner'

/** 聊天主页：编排消息、输入、实时通信与各功能弹层 */
export function ChatPage() {
  const navigate = useNavigate()
  const deviceId = useMemo(() => getDeviceId(), [])

  const loadInitial = useChatStore((state) => state.loadInitial)
  const uploadFiles = useChatStore((state) => state.uploadFiles)
  const logout = useAuthStore((state) => state.logout)
  const toast = useUiStore((state) => state.toast)
  const askConfirm = useUiStore((state) => state.askConfirm)
  const setSearchOpen = useUiStore((state) => state.setSearchOpen)
  const setImageGenOpen = useUiStore((state) => state.setImageGenOpen)
  const toggleAiMode = useUiStore((state) => state.toggleAiMode)

  const [input, setInput] = useState('')
  const [highlightId, setHighlightId] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const compose = useComposer()

  useRealtime(true)
  useGlobalCommands()
  usePwa()

  useEffect(() => {
    void loadInitial()
    void syncDeviceInfo()
  }, [loadInitial])

  const handleFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0) return
      void uploadFiles(files)
    },
    [uploadFiles],
  )

  useClipboardPaste(handleFiles)

  const handleSubmit = async () => {
    if (!input.trim()) return
    setInput('')
    await compose(input)
  }

  const handleMenuAction = async (action: MenuAction) => {
    switch (action) {
      case 'photo':
        cameraInputRef.current?.click()
        break

      case 'album':
        if (fileInputRef.current) {
          fileInputRef.current.accept = 'image/*'
          fileInputRef.current.click()
        }
        break

      case 'file':
        if (fileInputRef.current) {
          fileInputRef.current.accept = '*/*'
          fileInputRef.current.click()
        }
        break

      case 'emoji': {
        const emojis = ['😊', '👍', '❤️', '😂', '🎉', '👏', '🔥', '💯', '🥰', '😍', '🤔', '😅']
        setInput((value) => value + emojis[Math.floor(Math.random() * emojis.length)])
        break
      }

      case 'search':
        setSearchOpen(true)
        break

      case 'aiChat': {
        const enabled = toggleAiMode()
        toast(enabled ? 'AI模式已启用' : 'AI模式已关闭', enabled ? 'success' : 'info')
        if (enabled) setInput((value) => value || '🤖 ')
        break
      }

      case 'aiImageGen':
        setImageGenOpen(true)
        break

      case 'clearChat':
        await useChatStore.getState().clearAll()
        break

      case 'pwaManage':
        setInput('/pwa')
        break

      case 'logout': {
        const confirmed = await askConfirm({
          title: '登出确认',
          message: '确定要登出吗？登出后需要重新输入密码才能访问。',
          confirmText: '登出',
        })
        if (confirmed !== null) {
          logout()
          navigate('/login', { replace: true })
        }
        break
      }
    }
  }

  return (
    <div className="app">
      <UpdateBanner />
      <ConnectionStatus />

      <main className="app-main">
        <div className="chat-container">
          <MessageList
            currentDeviceId={deviceId}
            highlightMessageId={highlightId}
            onHighlightDone={() => setHighlightId(null)}
          />

          <InputBar
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            onPickFiles={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = '*/*'
                fileInputRef.current.click()
              }
            }}
          />
        </div>
      </main>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={(event) => {
          handleFiles(Array.from(event.target.files ?? []))
          event.target.value = ''
        }}
      />

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(event) => {
          handleFiles(Array.from(event.target.files ?? []))
          event.target.value = ''
        }}
      />

      {/* 拖拽监听在挂载时绑定，因此始终渲染 */}
      <DragOverlay onFiles={handleFiles} />

      <FunctionMenu onAction={handleMenuAction} />
      <ImageGenModal />
      <SearchModal onLocate={setHighlightId} />
    </div>
  )
}