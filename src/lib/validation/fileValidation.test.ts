import { describe, expect, it } from 'vitest'

import { MAX_CHAT_IMAGE_SIZE, validateImageFile } from './fileValidation'

function createFile(bytes: number[], name: string, type: string) {
  return new File([new Uint8Array(bytes)], name, { type })
}

describe('validateImageFile', () => {
  it('accepts a valid png image', async () => {
    const file = createFile(
      [
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      ],
      'image.png',
      'image/png'
    )

    const result = await validateImageFile(file)

    expect(result.valid).toBe(true)
    expect(result.detectedMimeType).toBe('image/png')
  })

  it('rejects unsupported mime types', async () => {
    const file = createFile([0x25, 0x50, 0x44, 0x46], 'file.pdf', 'application/pdf')

    const result = await validateImageFile(file)

    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/invalid file type/i)
  })

  it('rejects spoofed files whose bytes do not match the mime type', async () => {
    const file = createFile(
      [0x3c, 0x3f, 0x70, 0x68, 0x70],
      'image.jpg',
      'image/jpeg'
    )

    const result = await validateImageFile(file)

    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/does not match/i)
  })

  it('rejects files larger than 5mb', async () => {
    const file = new File([new Uint8Array(MAX_CHAT_IMAGE_SIZE + 1)], 'large.png', {
      type: 'image/png',
    })

    const result = await validateImageFile(file)

    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/5mb/i)
  })
})
