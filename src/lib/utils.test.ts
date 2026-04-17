/**
 * @file utils.test.ts
 * @description Unit tests cho các hàm tiện ích trong utils.ts
 * 
 * Áp dụng nguyên tắc TDD:
 * - RED: Viết test trước (test sẽ fail)
 * - GREEN: Implement code để test pass
 * - REFACTOR: Cải thiện code nếu cần
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { formatPrice, formatTime, cn, TimeoutError, withTimeout } from '../lib/utils'

afterEach(() => {
  vi.useRealTimers()
})

describe('utils', () => {
  describe('formatPrice', () => {
    // User story: Là người dùng, tôi muốn thấy giá tiền được định dạng đúng
    it('định dạng đúng số tiền VND với số thông thường', () => {
      expect(formatPrice(55000)).toContain('55.000')
    })

    it('định dạng đúng số tiền với số lớn (hàng triệu)', () => {
      expect(formatPrice(1500000)).toContain('1.500.000')
    })

    it('định dạng đúng số tiền nhỏ (dưới 1000)', () => {
      expect(formatPrice(500)).toContain('500')
    })

    it('trả về định dạng tiền tệ VND', () => {
      const result = formatPrice(100000)
      // Intl.NumberFormat với currency: 'VND' trả về ký hiệu ₫
      expect(result).toContain('₫')
    })

    it('xử lý giá trị 0', () => {
      const result = formatPrice(0)
      expect(result).toContain('0')
    })

    it('xử lý số âm (không nên có nhưng nên không crash)', () => {
      const result = formatPrice(-5000)
      expect(result).toBeDefined()
    })
  })

  describe('formatTime', () => {
    // User story: Là người dùng, tôi muốn thấy thời gian được định dạng dễ đọc
    it('định dạng đúng ngày với chuỗi ISO', () => {
      const result = formatTime('2024-01-15T10:30:00')
      expect(result).toContain('15')
      expect(result).toContain('01')
      expect(result).toContain('2024')
    })

    it('định dạng đúng với timestamp', () => {
      const timestamp = new Date('2024-06-20T14:45:00').getTime()
      const result = formatTime(timestamp)
      expect(result).toContain('20')
      expect(result).toContain('06')
      expect(result).toContain('2024')
    })

    it('định dạng đúng với đối tượng Date', () => {
      const date = new Date('2024-03-10T08:00:00')
      const result = formatTime(date)
      expect(result).toContain('10')
      expect(result).toContain('03')
      expect(result).toContain('2024')
    })

    it('bao gồm giờ và phút', () => {
      const result = formatTime('2024-01-15T10:30:00')
      expect(result).toMatch(/10:30|10\s*:\s*30/)
    })

    it('xử lý ngày hiện tại', () => {
      const now = new Date().toISOString()
      const result = formatTime(now)
      expect(result).toBeDefined()
      expect(result.length).toBeGreaterThan(0)
    })

    it('xử lý ngày gốc (edge case)', () => {
      const result = formatTime('1970-01-01T00:00:00')
      expect(result).toContain('1970')
    })
  })

  describe('cn (className utility)', () => {
    // User story: Là developer, tôi muốn gộp classNames một cách thông minh
    it('gộp đúng các className hợp lệ', () => {
      const result = cn('text-red', 'bg-blue')
      expect(result).toContain('text-red')
      expect(result).toContain('bg-blue')
    })

    it('xử lý className rỗng', () => {
      const result = cn('', 'text-red')
      expect(result).toContain('text-red')
    })

    it('xử lý giá trị undefined và null', () => {
      const result = cn('text-red', undefined, null as unknown as string, 'bg-blue')
      expect(result).toContain('text-red')
      expect(result).toContain('bg-blue')
    })

    it('xử lý object với giá trị true/false', () => {
      const isActive = true
      const isDisabled = false
      const result = cn('base-class', { 'active-class': isActive, 'disabled-class': isDisabled })
      expect(result).toContain('base-class')
      expect(result).toContain('active-class')
      expect(result).not.toContain('disabled-class')
    })

    it('xử lý mảng className', () => {
      const result = cn(['class1', 'class2'], 'class3')
      expect(result).toContain('class1')
      expect(result).toContain('class2')
      expect(result).toContain('class3')
    })

    it('gộp nhiều input types cùng lúc', () => {
      const result = cn(
        'base',
        ['array1', 'array2'],
        { conditional: true, notIncluded: false },
        undefined,
        null as unknown as string
      )
      expect(result).toContain('base')
      expect(result).toContain('array1')
      expect(result).toContain('array2')
      expect(result).toContain('conditional')
      expect(result).not.toContain('notIncluded')
    })

    it('xử lý chuỗi rỗng nhiều lần', () => {
      const result = cn('', '', 'text-red', '')
      expect(result).toContain('text-red')
    })
  })

  describe('withTimeout', () => {
    it('tra ve ket qua khi promise hoan thanh dung han', async () => {
      await expect(withTimeout(Promise.resolve('ok'), 1000)).resolves.toBe('ok')
    })

    it('nem TimeoutError khi promise treo qua han', async () => {
      vi.useFakeTimers()

      const pendingPromise = new Promise<string>(() => {})
      const result = withTimeout(pendingPromise, 1000, 'Het gio cho')
      const assertion = expect(result).rejects.toBeInstanceOf(TimeoutError)

      await vi.advanceTimersByTimeAsync(1000)

      await assertion
    })
  })
})
