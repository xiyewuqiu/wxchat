import { create } from 'zustand'
import type { ConnectionStatus, Toast, ToastType } from '@/types'

interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  /** 需要用户输入内容（如确认码）时启用 */
  requireInput?: boolean
  inputPlaceholder?: string
}

interface ConfirmState extends ConfirmOptions {
  open: boolean
}

interface UiState {
  toasts: Toast[]
  connectionStatus: ConnectionStatus
  aiMode: boolean
  functionMenuOpen: boolean
  searchOpen: boolean
  imageGenOpen: boolean
  dragActive: boolean
  updateAvailable: boolean
  confirm: ConfirmState

  toast: (message: string, type?: ToastType) => void
  dismissToast: (id: number) => void
  setConnectionStatus: (status: ConnectionStatus) => void
  setAiMode: (enabled: boolean) => void
  toggleAiMode: () => boolean
  setFunctionMenuOpen: (open: boolean) => void
  setSearchOpen: (open: boolean) => void
  setImageGenOpen: (open: boolean) => void
  setDragActive: (active: boolean) => void
  setUpdateAvailable: (available: boolean) => void
  askConfirm: (options: ConfirmOptions) => Promise<string | null>
  resolveConfirm: (value: string | null) => void
}

// Promise 解析函数放在模块作用域，避免进入组件渲染依赖
let confirmResolver: ((value: string | null) => void) | null = null
let toastSeq = 0

const CLOSED_CONFIRM: ConfirmState = { open: false, title: '', message: '' }

export const useUiStore = create<UiState>((set, get) => ({
  toasts: [],
  connectionStatus: 'disconnected',
  aiMode: false,
  functionMenuOpen: false,
  searchOpen: false,
  imageGenOpen: false,
  dragActive: false,
  updateAvailable: false,
  confirm: CLOSED_CONFIRM,

  toast(message, type = 'info') {
    const id = ++toastSeq
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))

    const duration = type === 'error' ? 4000 : 2500
    setTimeout(() => get().dismissToast(id), duration)
  },

  dismissToast(id) {
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }))
  },

  setConnectionStatus(status) {
    set({ connectionStatus: status })
  },

  setAiMode(enabled) {
    set({ aiMode: enabled })
  },

  toggleAiMode() {
    const next = !get().aiMode
    set({ aiMode: next })
    return next
  },

  setFunctionMenuOpen(open) {
    set({ functionMenuOpen: open })
  },

  setSearchOpen(open) {
    set({ searchOpen: open })
  },

  setImageGenOpen(open) {
    set({ imageGenOpen: open })
  },

  setDragActive(active) {
    set({ dragActive: active })
  },

  setUpdateAvailable(available) {
    set({ updateAvailable: available })
  },

  askConfirm(options) {
    return new Promise<string | null>((resolve) => {
      confirmResolver = resolve
      set({ confirm: { ...options, open: true } })
    })
  },

  resolveConfirm(value) {
    set({ confirm: CLOSED_CONFIRM })
    confirmResolver?.(value)
    confirmResolver = null
  },
}))