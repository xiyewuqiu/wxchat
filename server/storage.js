import fs from 'node:fs/promises'
import { createReadStream, createWriteStream } from 'node:fs'
import path from 'node:path'
import { Readable } from 'node:stream'

function assertSafeKey(key) {
  if (!key || key.includes('..') || key.includes('/') || key.includes('\\')) {
    throw new Error('非法文件 key')
  }
}

function toNodeReadable(body) {
  if (body && typeof body.getReader === 'function') {
    return Readable.fromWeb(body)
  }
  return body
}

export class LocalObjectStorage {
  constructor(uploadDir) {
    this.uploadDir = uploadDir
  }

  resolvePath(key) {
    assertSafeKey(key)
    return path.join(this.uploadDir, key)
  }

  async put(key, body, options = {}) {
    await fs.mkdir(this.uploadDir, { recursive: true })

    const filePath = this.resolvePath(key)
    const readable = toNodeReadable(body)

    if (readable && typeof readable.pipe === 'function') {
      await new Promise((resolve, reject) => {
        const writeStream = createWriteStream(filePath)
        readable.pipe(writeStream)
        readable.on('error', reject)
        writeStream.on('error', reject)
        writeStream.on('finish', resolve)
      })
    } else {
      await fs.writeFile(filePath, Buffer.from(await body.arrayBuffer()))
    }

    const metadataPath = `${filePath}.meta.json`
    await fs.writeFile(metadataPath, JSON.stringify({
      httpMetadata: options.httpMetadata || {},
      updatedAt: new Date().toISOString(),
    }, null, 2))
  }

  async get(key) {
    const filePath = this.resolvePath(key)
    try {
      await fs.access(filePath)
    } catch {
      return null
    }

    const stream = createReadStream(filePath)
    return { body: Readable.toWeb(stream) }
  }

  async delete(key) {
    const filePath = this.resolvePath(key)
    await fs.rm(filePath, { force: true })
    await fs.rm(`${filePath}.meta.json`, { force: true })
  }

  async deleteAll() {
    await fs.rm(this.uploadDir, { recursive: true, force: true })
    await fs.mkdir(this.uploadDir, { recursive: true })
  }
}
