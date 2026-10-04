import { tokenStore } from './token'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// 401 时通知上层（清理登录态并跳转），由 authStore 注册
let unauthorizedHandler: (() => void) | null = null
export function setUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler
}

function authHeaders(): Record<string, string> {
  const token = tokenStore.get()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function checkResponse(response: Response): Promise<Response> {
  if (response.ok) return response

  if (response.status === 401) {
    unauthorizedHandler?.()
  }

  let message = `HTTP ${response.status}: ${response.statusText}`
  try {
    const data = (await response.clone().json()) as { error?: string; message?: string }
    message = data.error || data.message || message
  } catch {
    // 响应体非 JSON 时沿用状态码描述
  }

  throw new ApiError(message, response.status)
}

interface RequestOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
}

async function parseJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return (await response.json()) as T
  }
  return undefined as T
}

/** JSON 请求 */
export async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, signal } = options

  const response = await fetch(url, {
    method,
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  await checkResponse(response)
  return parseJson<T>(response)
}

export function get<T>(url: string, params?: Record<string, string | number>, signal?: AbortSignal): Promise<T> {
  const query = params ? `?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))}` : ''
  return request<T>(`${url}${query}`, { signal })
}

export function post<T>(url: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  return request<T>(url, { method: 'POST', body, signal })
}

/** FormData 上传（不设置 Content-Type，交给浏览器生成 multipart 边界） */
export async function upload<T>(url: string, formData: FormData, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
    signal,
  })
  await checkResponse(response)
  return parseJson<T>(response)
}

/** 带上传进度的 FormData 上传（fetch 无法获取上传进度，使用 XHR） */
export function uploadWithProgress<T>(
  url: string,
  formData: FormData,
  onProgress: (percent: number) => void,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        onProgress((event.loaded / event.total) * 100)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as T)
        } catch {
          reject(new Error('响应解析失败'))
        }
      } else {
        if (xhr.status === 401) unauthorizedHandler?.()
        reject(new ApiError(`HTTP ${xhr.status}: ${xhr.statusText}`, xhr.status))
      }
    })

    xhr.addEventListener('error', () => reject(new ApiError('网络错误', 0)))

    xhr.open('POST', url)
    const token = tokenStore.get()
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.send(formData)
  })
}

/** 下载二进制内容 */
export async function requestBlob(url: string, signal?: AbortSignal): Promise<Blob> {
  const response = await fetch(url, { headers: authHeaders(), signal })
  await checkResponse(response)
  return response.blob()
}

export { authHeaders }