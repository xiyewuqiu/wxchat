import fs from 'node:fs/promises'
import path from 'node:path'
import { lookup } from 'mime-types'

const STATIC_HEADERS = {
  'Cache-Control': 'public, max-age=3600',
}

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
}

function isSafePath(filePath, rootDir) {
  const relative = path.relative(rootDir, filePath)
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative)
}

export function addStaticFiles(app, rootDir) {
  app.get('*', async (c) => {
    const requestUrl = new URL(c.req.url)
    const pathname = decodeURIComponent(requestUrl.pathname)
    const candidate = pathname === '/' ? '/index.html' : pathname
    let filePath = path.join(rootDir, candidate)

    if (!isSafePath(filePath, rootDir)) {
      return c.text('Not Found', 404)
    }

    try {
      const stat = await fs.stat(filePath)
      if (stat.isDirectory()) {
        filePath = path.join(filePath, 'index.html')
      }
    } catch {
      filePath = path.join(rootDir, 'index.html')
    }

    try {
      const body = await fs.readFile(filePath)
      const contentType = lookup(filePath) || 'application/octet-stream'
      const basename = path.basename(filePath)
      const extension = path.extname(filePath)
      const cacheHeaders = extension === '.html' || basename === 'sw.js'
        ? NO_CACHE_HEADERS
        : STATIC_HEADERS

      return new Response(body, {
        headers: {
          ...cacheHeaders,
          'Content-Type': contentType,
          ...(basename === 'sw.js' ? { 'Service-Worker-Allowed': '/' } : {}),
        },
      })
    } catch {
      return c.text('Not Found', 404)
    }
  })
}
