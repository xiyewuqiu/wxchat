import { useState } from 'react'
import { IMAGE_STEP_OPTIONS, SUPPORTED_IMAGE_SIZES } from '@/api/ai'
import { IMAGE_GEN_CONFIG } from '@/config'
import { runImageGeneration } from '@/lib/imageGeneration'
import { useUiStore } from '@/store/uiStore'

const QUICK_INSPIRATIONS = [
  '赛博朋克夜色霓虹城市，雨后倒影，超精细8K',
  '吉卜力风治愈系梦幻森林，阳光透过树梢，宁静小屋',
  '可爱的宇航员小猫坐在月球上仰望地球，微缩胶囊质感',
  '高级极简玻璃拟物3D立体图标设计，柔和柔光',
]

/** AI 绘画创作工坊：专业创作界面、尺寸比例微缩卡片、灵感胶囊与参数控制 */
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
      toast('请输入图片描述提示词', 'error')
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
      <div className="image-gen-studio-card" onClick={(event) => event.stopPropagation()}>
        {/* 标题栏 */}
        <div className="studio-header">
          <div className="studio-title-group">
            <span className="studio-badge-icon">🎨</span>
            <div>
              <h3 className="studio-title">AI 绘图创意工坊</h3>
              <p className="studio-sub">基于 Cloudflare 边缘生图大模型，秒级光影呈现</p>
            </div>
          </div>
          <button type="button" className="studio-close-btn" onClick={() => setOpen(false)}>
            ×
          </button>
        </div>

        <div className="studio-body">
          {/* 描述词输入区 */}
          <div className="studio-field">
            <div className="field-label-row">
              <label htmlFor="imageGenPrompt">画面描述 (Prompt) *</label>
              <span className={`char-counter ${remaining < 50 ? 'is-warning' : ''}`}>
                {prompt.length}/{IMAGE_GEN_CONFIG.MAX_PROMPT_LENGTH}
              </span>
            </div>

            <textarea
              id="imageGenPrompt"
              rows={3}
              className="studio-textarea"
              maxLength={IMAGE_GEN_CONFIG.MAX_PROMPT_LENGTH}
              placeholder="描绘你想呈现的场景、画风、材质与构图..."
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) void handleGenerate()
              }}
            />

            {/* 灵感快捷预设标签 */}
            <div className="inspiration-pills">
              <span className="inspiration-label">💡 快速灵感:</span>
              <div className="pills-scroll">
                {QUICK_INSPIRATIONS.map((text) => (
                  <button
                    key={text}
                    type="button"
                    className="inspiration-pill-btn"
                    onClick={() => setPrompt(text)}
                  >
                    {text.slice(0, 10)}...
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 负面提示词 */}
          <div className="studio-field">
            <label htmlFor="imageGenNegative">过滤排除元素 (可选)</label>
            <input
              id="imageGenNegative"
              type="text"
              className="studio-input"
              placeholder="模糊、畸变、多余肢体、水印、低画质"
              value={negativePrompt}
              onChange={(event) => setNegativePrompt(event.target.value)}
            />
          </div>

          {/* 尺寸比例与采样步数 */}
          <div className="studio-grid-fields">
            <div className="studio-field">
              <label htmlFor="imageGenSize">画面比例与分辨率</label>
              <select
                id="imageGenSize"
                className="studio-select"
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

            <div className="studio-field">
              <label htmlFor="imageGenSteps">推理采样步数</label>
              <select
                id="imageGenSteps"
                className="studio-select"
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

          {/* 引导强度滑块 */}
          <div className="studio-field">
            <div className="field-label-row">
              <label htmlFor="imageGenGuidance">提示词引导强度 (Guidance)</label>
              <span className="guidance-value-badge">{guidance}</span>
            </div>
            <input
              id="imageGenGuidance"
              type="range"
              className="studio-range"
              min={1}
              max={20}
              step={0.5}
              value={guidance}
              onChange={(event) => setGuidance(Number(event.target.value))}
            />
            <div className="range-hints">
              <span>自由发散想象</span>
              <span>严苛贴合文字</span>
            </div>
          </div>
        </div>

        {/* 底部按钮栏 */}
        <div className="studio-footer">
          <button type="button" className="studio-btn-ghost" onClick={() => setOpen(false)}>
            取消
          </button>

          <button
            type="button"
            className="studio-btn-sparkle"
            disabled={submitting}
            onClick={handleGenerate}
          >
            {submitting ? (
              <>
                <span className="btn-spinner-sm" />
                <span>正在生成画卷...</span>
              </>
            ) : (
              <>
                <span>✨ 立即开始生成</span>
                <span className="studio-shortcut-hint">Ctrl + Enter</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}