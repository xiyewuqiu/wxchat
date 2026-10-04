// 文件类型 / 扩展名 → 图标 映射

export const FILE_ICONS: Record<string, string> = {
  // 图片
  'image/': '🖼️',
  'image/jpeg': '🖼️',
  'image/jpg': '🖼️',
  'image/png': '🖼️',
  'image/gif': '🎞️',
  'image/bmp': '🖼️',
  'image/svg+xml': '🎨',
  'image/webp': '🖼️',
  'image/tiff': '🖼️',
  'image/ico': '🖼️',

  // 视频
  'video/': '🎥',
  'video/mp4': '🎥',
  'video/avi': '🎥',
  'video/mov': '🎥',
  'video/wmv': '🎥',
  'video/mkv': '🎥',
  'video/flv': '🎥',
  'video/webm': '🎥',
  'video/m4v': '🎥',

  // 音频
  'audio/': '🎵',
  'audio/mp3': '🎵',
  'audio/wav': '🎵',
  'audio/aac': '🎵',
  'audio/flac': '🎵',
  'audio/ogg': '🎵',
  'audio/m4a': '🎵',
  'audio/wma': '🎵',

  // 文档
  'application/pdf': '📕',
  'application/msword': '📘',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📘',
  'application/vnd.ms-excel': '📗',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📗',
  'application/vnd.ms-powerpoint': '📙',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📙',
  'application/rtf': '📄',

  // 压缩
  'application/zip': '📦',
  'application/x-rar-compressed': '📦',
  'application/x-7z-compressed': '📦',
  'application/x-tar': '📦',
  'application/gzip': '📦',
  'application/x-bzip2': '📦',

  // 文本
  'text/': '📄',
  'text/plain': '📄',
  'text/html': '🌐',
  'text/css': '🎨',
  'text/javascript': '⚡',
  'text/xml': '📋',
  'text/csv': '📊',
  'text/markdown': '📝',

  // 代码
  'application/javascript': '⚡',
  'application/json': '📋',
  'application/xml': '📋',

  // 其他
  'application/octet-stream': '📄',
  'application/x-executable': '⚙️',
  'application/x-msi': '💿',
  'application/x-deb': '📦',
  'application/x-rpm': '📦',

  default: '📄',
}

export const FILE_EXTENSION_ICONS: Record<string, string> = {
  // 图片
  jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🎞️', bmp: '🖼️',
  svg: '🎨', webp: '🖼️', tiff: '🖼️', tif: '🖼️', ico: '🖼️',

  // 视频
  mp4: '🎥', avi: '🎥', mov: '🎥', wmv: '🎥', mkv: '🎥',
  flv: '🎥', webm: '🎥', m4v: '🎥', mpg: '🎥', mpeg: '🎥',

  // 音频
  mp3: '🎵', wav: '🎵', aac: '🎵', flac: '🎵', ogg: '🎵',
  m4a: '🎵', wma: '🎵', opus: '🎵',

  // 文档
  pdf: '📕', doc: '📘', docx: '📘', xls: '📗', xlsx: '📗',
  ppt: '📙', pptx: '📙', rtf: '📄', odt: '📘', ods: '📗', odp: '📙',

  // 压缩
  zip: '📦', rar: '📦', '7z': '📦', tar: '📦', gz: '📦',
  bz2: '📦', xz: '📦', dmg: '💿', iso: '💿',

  // 文本与代码
  txt: '📄', md: '📝', html: '🌐', htm: '🌐', css: '🎨',
  js: '⚡', ts: '⚡', jsx: '⚡', tsx: '⚡', json: '📋',
  xml: '📋', csv: '📊', sql: '🗃️',

  // 编程语言
  py: '🐍', java: '☕', cpp: '⚙️', c: '⚙️', h: '⚙️',
  php: '🐘', rb: '💎', go: '🐹', rs: '🦀', swift: '🦉',
  kt: '🎯', scala: '📐', r: '📊', matlab: '📊', m: '📊',

  // 配置
  ini: '⚙️', cfg: '⚙️', conf: '⚙️', yaml: '⚙️', yml: '⚙️',
  toml: '⚙️', env: '⚙️',

  // 可执行
  exe: '⚙️', msi: '💿', deb: '📦', rpm: '📦',
  app: '📱', apk: '📱',

  // 字体
  ttf: '🔤', otf: '🔤', woff: '🔤', woff2: '🔤', eot: '🔤',

  // 其他
  log: '📜', bak: '💾', tmp: '🗂️', cache: '🗂️',
}

/** 文件类型友好名称（MIME 优先，扩展名兜底） */
export const FILE_TYPE_NAMES: Record<string, string> = {
  jpg: '图片', jpeg: '图片', png: '图片', gif: '动图', bmp: '图片', svg: '矢量图', webp: '图片',
  mp4: '视频', avi: '视频', mov: '视频', wmv: '视频', mkv: '视频', flv: '视频',
  mp3: '音频', wav: '音频', aac: '音频', flac: '音频', ogg: '音频',
  pdf: 'PDF文档', doc: 'Word文档', docx: 'Word文档',
  xls: 'Excel表格', xlsx: 'Excel表格',
  ppt: 'PowerPoint演示', pptx: 'PowerPoint演示',
  zip: '压缩文件', rar: '压缩文件', '7z': '压缩文件', tar: '压缩文件',
  txt: '文本文件', md: 'Markdown文档', html: 'HTML文档', css: 'CSS样式',
  js: 'JavaScript代码', py: 'Python代码', java: 'Java代码', cpp: 'C++代码', c: 'C代码',
}