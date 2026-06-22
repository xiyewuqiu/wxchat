import fs from 'node:fs/promises'
import path from 'node:path'
import { lookup } from 'mime-types'

const STATIC_HEADERS = {
  'Cache-Control': 'public, max-age=3600',
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
      return new Response(body, {
        headers: {
          ...STATIC_HEADERS,
          'Content-Type': contentType,
        },
      })
    } catch {
      return c.text('Not Found', 404)
    }
  })
}
