import { useState } from 'react'
import { IMAGE_STEP_OPTIONS, SUPPORTED_IMAGE_SIZES } from '@/api/ai'
import { IMAGE_GEN_CONFIG } from '@/config'
import { runImageGeneration } from '@/lib/imageGeneration'
import { useUiStore } from '@/store/uiStore'

/** AI 绘图弹窗：提示词、负面词、尺寸、步数、引导强度 */
export function ImageGenModal() {
  const open = useUiStore((state) => state.imageGenOpen)
  const setOpen = useUiStore((state) => state.setImageGenOpen)
  const toast = useUiStore((state) => state.toast)

  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [imageSize, setImageSize] = useState<string>(IMAGE_GEN_CONFIG.DEFAULT_SIZE)
  const [steps, setSteps] = useState<number>(IMAGE_GEN_CONFIG.DEFAULT_STEPS)
  const [guidance, setGuidance] = useState<number>(IMAGE_GEN_CONFIG.DEFAULT_GUIDANCE)
  const [submitting, setSubmitting] = useState(false)

  if (!open) return null

  const remaining = IMAGE_GEN_CONFIG.MAX_PROMPT_LENGTH - prompt.length

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast('请输入图片描述', 'error')
      return
    }

    setSubmitting(true)
    setOpen(false)
    try {
      await runImageGeneration({
        prompt: prompt.trim(),
        negativePrompt: negativePrompt.trim() || undefined,
        imageSize,
        numInferenceSteps: steps,
        guidanceScale: guidance,
      })
    } finally {
      setSubmitting(false)
      setPrompt('')
      setNegativePrompt('')
    }
  }

  return (
    <div className="image-gen-modal-overlay" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
      <div className="image-gen-modal" onClick={(event) => event.stopPropagation()}>
        <div className="image-gen-header">
          <h3>🎨 AI图片生成</h3>
          <button type="button" className="close-btn" onClick={() => setOpen(false)}>
            ×
          </button>
        </div>

        <div className="image-gen-content">
          <div className="form-group">
            <label htmlFor="imageGenPrompt">图片描述 *</label>
            <textarea
              id="imageGenPrompt"
              rows={3}
              maxLength={IMAGE_GEN_CONFIG.MAX_PROMPT_LENGTH}
              placeholder="请描述你想要生成的图片，例如：一只可爱的小猫坐在花园里，阳光明媚，卡通风格"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && event.ctrlKey) void handleGenerate()
              }}
            />
            <div className="char-count" style={{ color: remaining < 100 ? '#ff4444' : '#666' }}>
              {prompt.length}/{IMAGE_GEN_CONFIG.MAX_PROMPT_LENGTH}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="imageGenNegative">负面提示词（可选）</label>
            <input
              id="imageGenNegative"
              type="text"
              placeholder="不想要的元素，例如：模糊、低质量、变形"
              value={negativePrompt}
              onChange={(event) => setNegativePrompt(event.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="imageGenSize">图片尺寸</label>
              <select
                id="imageGenSize"
                value={imageSize}
                onChange={(event) => setImageSize(event.target.value)}
              >
                {SUPPORTED_IMAGE_SIZES.map((size) => (
                  <option key={size.value} value={size.value}>
                    {size.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="imageGenSteps">生成步数</label>
              <select
                id="imageGenSteps"
                value={steps}
                onChange={(event) => setSteps(Number(event.target.value))}
              >
                {IMAGE_STEP_OPTIONS.map((step) => (
                  <option key={step.value} value={step.value}>
                    {step.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="imageGenGuidance">引导强度: {guidance}</label>
            <input
              id="imageGenGuidance"
              type="range"
              min={1}
              max={20}
              step={0.5}
              value={guidance}
              onChange={(event) => setGuidance(Number(event.target.value))}
            />
            <div className="range-labels">
              <span>创意</span>
              <span>精确</span>
            </div>
          </div>
        </div>

        <div className="image-gen-footer">
          <button type="button" className="btn-cancel" onClick={() => setOpen(false)}>
            取消
          </button>
          <button type="button" className="btn-generate" disabled={submitting} onClick={handleGenerate}>
            {submitting ? '🎨 生成中...' : '🎨 生成图片'}
          </button>
        </div>
      </div>
    </div>
  )
}