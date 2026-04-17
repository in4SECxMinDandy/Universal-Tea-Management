import { z } from 'zod'

const BLOCKED_MESSAGE_PATTERNS = [
  /<\s*script\b/i,
  /<[^>]+>/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /;\s*(drop|delete|truncate|alter|insert|update|create|grant|revoke)\b/i,
  /\bunion\s+select\b/i,
  /\b(or|and)\s+1\s*=\s*1\b/i,
  /--/,
  /\/\*/,
]

function hasBlockedMessageContent(value: string) {
  return BLOCKED_MESSAGE_PATTERNS.some((pattern) => pattern.test(value))
}

function isFileLike(value: unknown): value is File {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as File).arrayBuffer === 'function' &&
    typeof (value as File).size === 'number' &&
    typeof (value as File).type === 'string'
  )
}

export const chatMessageSchema = z.object({
  session_id: z.string().uuid('Session khong hop le.'),
  content: z
    .string()
    .trim()
    .min(1, 'Noi dung khong duoc de trong.')
    .max(2000, 'Tin nhan toi da 2000 ky tu.')
    .refine((value) => !hasBlockedMessageContent(value), {
      message: 'Tin nhan chua noi dung khong duoc phep.',
    }),
  image_url: z.string().url('Image URL khong hop le.').nullable().optional(),
})

export const imageUploadSchema = z.object({
  session_id: z.string().uuid('Session khong hop le.'),
  file: z.custom<File>(isFileLike, { message: 'File tai len khong hop le.' }),
})

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email la bat buoc.')
    .max(255, 'Email qua dai.')
    .email('Email khong hop le.'),
  password: z
    .string()
    .min(6, 'Mat khau phai co it nhat 6 ky tu.')
    .max(255, 'Mat khau qua dai.'),
  captchaToken: z.string().trim().min(1).optional(),
})

export const orderCreateSchema = z.object({
  food_id: z.string().uuid('Food khong hop le.'),
  quantity: z.number().int().min(1, 'So luong toi thieu la 1.').max(99, 'So luong toi da la 99.'),
  note: z.string().trim().max(500, 'Ghi chu toi da 500 ky tu.').optional().nullable(),
})

export const reviewCreateSchema = z.object({
  order_id: z.string().uuid('Don hang khong hop le.'),
  rating: z.number().int().min(1, 'Danh gia toi thieu 1 sao.').max(5, 'Danh gia toi da 5 sao.'),
  comment: z.string().trim().max(1000, 'Nhan xet toi da 1000 ky tu.').optional().nullable(),
})

export const reviewReplySchema = z.object({
  review_id: z.string().uuid('Danh gia khong hop le.'),
  reply: z.string().trim().min(1, 'Phan hoi khong duoc de trong.').max(1000, 'Phan hoi toi da 1000 ky tu.'),
})

export type ChatMessageInput = z.infer<typeof chatMessageSchema>
export type ImageUploadInput = z.infer<typeof imageUploadSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type OrderCreateInput = z.infer<typeof orderCreateSchema>
export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>
export type ReviewReplyInput = z.infer<typeof reviewReplySchema>
