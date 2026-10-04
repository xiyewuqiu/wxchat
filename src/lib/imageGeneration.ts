import { downloadImageBlob, generateImage, validateImagePrompt } from '@/api/ai'
import { uploadFile } from '@/api/files'
import { ERRORS, IMAGE_GEN_CONFIG } from '@/config'
import { getDeviceId } from '@/lib/utils'
import { useChatStore } from '@/store/chatStore'
import { useUiStore } from '@/store/uiStore'
import type { ImageGenOptions } from '@/types'

/**
 * 完整的图片生成链路：生成 → 下载 → 上传 R2 落库 → 刷新消息。
 * 生成的图片统一进入聊天记录，与其他文件同一条数据通道。
 */
export async function runImageGeneration(options: ImageGenOptions): Promise<void> {
  const ui = useUiStore.getState()
  const validation = validateImagePrompt(options.prompt)
  if (!validation.valid) {
    ui.toast(validation.error || ERRORS.IMAGE_GEN_PROMPT_EMPTY, 'error')
    return
  }

  ui.toast('🎨 AI正在生成图片...', 'info')

  try {
    const imageUrl = await generateImage(options.prompt, {
      ...options,
      imageSize: options.imageSize || IMAGE_GEN_CONFIG.DEFAULT_SIZE,
      numInferenceSteps: options.numInferenceSteps || IMAGE_GEN_CONFIG.DEFAULT_STEPS,
      guidanceScale: options.guidanceScale || IMAGE_GEN_CONFIG.DEFAULT_GUIDANCE,
    })

    const blob = await downloadImageBlob(imageUrl)
    const file = new File([blob], `ai-generated-${Date.now()}.png`, {
      type: 'image/png',
      lastModified: Date.now(),
    })

    await uploadFile(file, getDeviceId())
    ui.toast('图片生成完成', 'success')
    await useChatStore.getState().refresh(true)
  } catch (error) {
    const message = (error as Error).message || ERRORS.IMAGE_GEN_FAILED
    let friendly = message
    if (message.includes('下载失败')) friendly = ERRORS.IMAGE_GEN_DOWNLOAD_FAILED
    else if (message.includes('上传失败')) friendly = ERRORS.IMAGE_GEN_UPLOAD_FAILED
    else if (message.includes('生成失败')) friendly = ERRORS.IMAGE_GEN_API_ERROR
    ui.toast(friendly, 'error')
  }
}