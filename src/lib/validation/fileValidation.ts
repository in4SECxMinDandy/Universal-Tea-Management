export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number]

export const MAX_CHAT_IMAGE_SIZE = 5 * 1024 * 1024

type ValidationSuccess = {
  valid: true
  detectedMimeType: AllowedImageMimeType
}

type ValidationFailure = {
  valid: false
  error: string
}

export type ImageValidationResult = ValidationSuccess | ValidationFailure

function matchesSignature(bytes: Uint8Array, signature: number[], offset = 0) {
  return signature.every((value, index) => bytes[offset + index] === value)
}

function detectMimeType(bytes: Uint8Array): AllowedImageMimeType | null {
  if (
    bytes.length >= 4 &&
    matchesSignature(bytes, [0xff, 0xd8, 0xff]) &&
    bytes[bytes.length - 2] === 0xff &&
    bytes[bytes.length - 1] === 0xd9
  ) {
    return 'image/jpeg'
  }

  if (
    bytes.length >= 16 &&
    matchesSignature(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) &&
    matchesSignature(bytes, [0x00, 0x00, 0x00, 0x0d], 8) &&
    matchesSignature(bytes, [0x49, 0x48, 0x44, 0x52], 12)
  ) {
    return 'image/png'
  }

  if (
    bytes.length >= 6 &&
    (matchesSignature(bytes, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) ||
      matchesSignature(bytes, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]))
  ) {
    return 'image/gif'
  }

  if (
    bytes.length >= 12 &&
    matchesSignature(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    matchesSignature(bytes, [0x57, 0x45, 0x42, 0x50], 8) &&
    (
      matchesSignature(bytes, [0x56, 0x50, 0x38, 0x20], 12) ||
      matchesSignature(bytes, [0x56, 0x50, 0x38, 0x4c], 12) ||
      matchesSignature(bytes, [0x56, 0x50, 0x38, 0x58], 12)
    )
  ) {
    return 'image/webp'
  }

  return null
}

export function getExtensionForMimeType(mimeType: AllowedImageMimeType) {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/gif':
      return 'gif'
    case 'image/webp':
      return 'webp'
  }
}

export async function validateImageFile(file: File): Promise<ImageValidationResult> {
  if (file.size <= 0) {
    return { valid: false, error: 'File trong.' }
  }

  if (file.size > MAX_CHAT_IMAGE_SIZE) {
    return { valid: false, error: 'File size exceeds 5MB limit.' }
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as AllowedImageMimeType)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, GIF, WEBP allowed.',
    }
  }

  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  const detectedMimeType = detectMimeType(bytes)

  if (!detectedMimeType || detectedMimeType !== file.type) {
    return { valid: false, error: 'File content does not match declared type.' }
  }

  return { valid: true, detectedMimeType }
}
