import { describe, expect, it } from 'vitest'

import {
  buildRevenueDetailRows,
  buildRevenueTrendSeries,
  filterAndSortRevenueDetailRows,
  getCompletedRevenueSummary,
  getLowReviews,
  getRevenuePeriodTotals,
  getTopProducts,
  type RevenueDashboardOrder,
  type RevenueDashboardReview,
} from './revenue-dashboard'

const orders: RevenueDashboardOrder[] = [
  {
    id: 'order-1',
    food_id: 'tea',
    quantity: 2,
    total_price: 100_000,
    status: 'completed',
    created_at: '2026-04-16T02:00:00+07:00',
    profiles: { full_name: 'Lan' },
    food: { id: 'tea', name: 'Trà sữa trân châu', slug: 'tra-sua-tran-chau' },
  },
  {
    id: 'order-2',
    food_id: 'cake',
    quantity: 1,
    total_price: 70_000,
    status: 'completed',
    created_at: '2026-04-14T10:00:00+07:00',
    profiles: { full_name: 'Minh' },
    food: { id: 'cake', name: 'Bánh matcha', slug: 'banh-matcha' },
  },
  {
    id: 'order-3',
    food_id: 'tea',
    quantity: 1,
    total_price: 50_000,
    status: 'pending',
    created_at: '2026-04-16T08:00:00+07:00',
    profiles: { full_name: 'Trang' },
    food: { id: 'tea', name: 'Trà sữa trân châu', slug: 'tra-sua-tran-chau' },
  },
  {
    id: 'order-4',
    food_id: 'tea',
    quantity: 3,
    total_price: 150_000,
    status: 'completed',
    created_at: '2026-03-30T08:00:00+07:00',
    profiles: { full_name: 'Hà' },
    food: { id: 'tea', name: 'Trà sữa trân châu', slug: 'tra-sua-tran-chau' },
  },
  {
    id: 'order-5',
    food_id: 'coffee',
    quantity: 2,
    total_price: 120_000,
    status: 'completed',
    created_at: '2026-01-10T08:00:00+07:00',
    profiles: { full_name: 'Bình' },
    food: { id: 'coffee', name: 'Cold brew', slug: 'cold-brew' },
  },
]

const reviews: RevenueDashboardReview[] = [
  {
    id: 'review-1',
    rating: 1,
    comment: 'Quá ngọt',
    created_at: '2026-04-15T09:00:00+07:00',
    reviewer_name: 'Lan',
    food: { id: 'tea', name: 'Trà sữa trân châu', slug: 'tra-sua-tran-chau', image_url: null },
  },
  {
    id: 'review-2',
    rating: 2,
    comment: 'Bánh hơi khô',
    created_at: '2026-04-16T09:00:00+07:00',
    reviewer_name: 'Minh',
    food: { id: 'cake', name: 'Bánh matcha', slug: 'banh-matcha', image_url: null },
  },
  {
    id: 'review-3',
    rating: 1,
    comment: 'Đá tan nhanh',
    created_at: '2026-04-16T12:00:00+07:00',
    reviewer_name: 'Trang',
    food: { id: 'tea', name: 'Trà sữa trân châu', slug: 'tra-sua-tran-chau', image_url: null },
  },
]

describe('revenue dashboard helpers', () => {
  const now = new Date('2026-04-16T18:00:00+07:00')

  it('tính đúng tổng quan doanh thu từ đơn hoàn tất', () => {
    expect(getCompletedRevenueSummary(orders)).toEqual({
      totalRevenue: 440_000,
      completedOrderCount: 4,
      totalQuantity: 8,
      averageOrderValue: 110_000,
    })
  })

  it('tính đúng doanh thu theo ngày tuần tháng năm', () => {
    expect(getRevenuePeriodTotals(orders, now)).toEqual({
      day: 100_000,
      week: 170_000,
      month: 170_000,
      year: 440_000,
    })
  })

  it('tạo chuỗi xu hướng đủ số ngày và gom revenue theo ngày', () => {
    const series = buildRevenueTrendSeries(orders, 7, now)

    expect(series).toHaveLength(7)
    expect(series.find((point) => point.dateKey === '2026-04-14')?.revenue).toBe(70_000)
    expect(series.find((point) => point.dateKey === '2026-04-16')?.revenue).toBe(100_000)
    expect(series.every((point) => point.dateKey >= '2026-04-10')).toBe(true)
  })

  it('xác định top sản phẩm theo doanh thu rồi đến số lượng', () => {
    expect(getTopProducts(orders, 2)).toEqual([
      {
        id: 'tea',
        name: 'Trà sữa trân châu',
        slug: 'tra-sua-tran-chau',
        quantitySold: 5,
        revenue: 250_000,
        orderCount: 2,
      },
      {
        id: 'coffee',
        name: 'Cold brew',
        slug: 'cold-brew',
        quantitySold: 2,
        revenue: 120_000,
        orderCount: 1,
      },
    ])
  })

  it('lọc đánh giá kém đúng theo mức sao và thứ tự ưu tiên', () => {
    expect(getLowReviews(reviews, 1, 5).map((review) => review.id)).toEqual(['review-3', 'review-1'])
    expect(getLowReviews(reviews, 2, 5).map((review) => review.id)).toEqual(['review-3', 'review-1', 'review-2'])
  })

  it('lọc và sắp xếp bảng chi tiết theo tiêu chí người dùng', () => {
    const rows = buildRevenueDetailRows(orders)
    const filtered = filterAndSortRevenueDetailRows(rows, {
      search: 'trà',
      status: 'completed',
      timeWindow: 30,
      sortKey: 'revenue',
      sortDirection: 'asc',
      now,
    })

    expect(filtered.map((row) => row.id)).toEqual(['order-1', 'order-4'])
  })

  it('sắp xếp mặc định theo ngày giảm dần nếu không truyền filter', () => {
    const rows = buildRevenueDetailRows(orders)

    expect(rows.map((row) => row.id)).toEqual(['order-3', 'order-1', 'order-2', 'order-4', 'order-5'])
  })
})
