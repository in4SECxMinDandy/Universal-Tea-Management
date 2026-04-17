export type RevenueOrderStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export interface RevenueDashboardOrder {
  id: string
  food_id: string
  quantity: number
  total_price: number
  status: RevenueOrderStatus
  created_at: string
  profiles?: {
    full_name: string | null
  } | null
  food?: {
    id: string
    name: string
    slug: string | null
  } | null
}

export interface RevenueDashboardReview {
  id: string
  rating: number
  comment: string | null
  created_at: string
  reviewer_name: string
  food: {
    id: string
    name: string
    slug: string
    image_url: string | null
  } | null
}

export interface RevenueTrendPoint {
  dateKey: string
  label: string
  shortLabel: string
  revenue: number
  orderCount: number
}

export interface TopProductStat {
  id: string
  name: string
  slug: string | null
  quantitySold: number
  revenue: number
  orderCount: number
}

export interface RevenueDetailRow {
  id: string
  createdAt: string
  customerName: string
  productName: string
  productSlug: string | null
  quantity: number
  revenue: number
  status: RevenueOrderStatus
}

export type RevenueDetailSortKey = 'date' | 'customer' | 'product' | 'quantity' | 'revenue' | 'status'
export type RevenueSortDirection = 'asc' | 'desc'
export type RevenueTimeWindow = 'all' | 7 | 30 | 90
export type RevenueDetailStatusFilter = 'all' | RevenueOrderStatus

const STATUS_WEIGHT: Record<RevenueOrderStatus, number> = {
  completed: 0,
  confirmed: 1,
  pending: 2,
  cancelled: 3,
}

const trendLabelFormatter = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
})

const trendShortLabelFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
})

function startOfDay(input: Date) {
  return new Date(input.getFullYear(), input.getMonth(), input.getDate())
}

function startOfWeek(input: Date) {
  const value = startOfDay(input)
  const day = value.getDay()
  const diff = day === 0 ? -6 : 1 - day

  value.setDate(value.getDate() + diff)
  return value
}

function startOfMonth(input: Date) {
  return new Date(input.getFullYear(), input.getMonth(), 1)
}

function startOfYear(input: Date) {
  return new Date(input.getFullYear(), 0, 1)
}

function addDays(input: Date, days: number) {
  const value = new Date(input)
  value.setDate(value.getDate() + days)
  return value
}

function toDateKey(input: Date) {
  const year = input.getFullYear()
  const month = String(input.getMonth() + 1).padStart(2, '0')
  const day = String(input.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function isCompletedOrder(order: RevenueDashboardOrder) {
  return order.status === 'completed'
}

export function getCompletedOrders(orders: RevenueDashboardOrder[]) {
  return orders.filter(isCompletedOrder)
}

export function getCompletedRevenueSummary(orders: RevenueDashboardOrder[]) {
  const completedOrders = getCompletedOrders(orders)
  const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total_price, 0)
  const totalQuantity = completedOrders.reduce((sum, order) => sum + order.quantity, 0)

  return {
    totalRevenue,
    completedOrderCount: completedOrders.length,
    totalQuantity,
    averageOrderValue: completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0,
  }
}

export function getRevenuePeriodTotals(orders: RevenueDashboardOrder[], now = new Date()) {
  const completedOrders = getCompletedOrders(orders)
  const dayStart = startOfDay(now)
  const weekStart = startOfWeek(now)
  const monthStart = startOfMonth(now)
  const yearStart = startOfYear(now)

  const totals = {
    day: 0,
    week: 0,
    month: 0,
    year: 0,
  }

  for (const order of completedOrders) {
    const createdAt = new Date(order.created_at)

    if (Number.isNaN(createdAt.getTime()) || createdAt > now) {
      continue
    }

    if (createdAt >= yearStart) {
      totals.year += order.total_price
    }
    if (createdAt >= monthStart) {
      totals.month += order.total_price
    }
    if (createdAt >= weekStart) {
      totals.week += order.total_price
    }
    if (createdAt >= dayStart) {
      totals.day += order.total_price
    }
  }

  return totals
}

export function buildRevenueTrendSeries(
  orders: RevenueDashboardOrder[],
  days: 7 | 30 | 90,
  now = new Date()
) {
  const completedOrders = getCompletedOrders(orders)
  const end = addDays(startOfDay(now), 1)
  const start = addDays(startOfDay(now), -(days - 1))
  const buckets = new Map<string, { revenue: number; orderCount: number }>()

  for (const order of completedOrders) {
    const createdAt = new Date(order.created_at)

    if (Number.isNaN(createdAt.getTime()) || createdAt < start || createdAt >= end) {
      continue
    }

    const bucketDate = startOfDay(createdAt)
    const key = toDateKey(bucketDate)
    const current = buckets.get(key) ?? { revenue: 0, orderCount: 0 }

    current.revenue += order.total_price
    current.orderCount += 1
    buckets.set(key, current)
  }

  return Array.from({ length: days }, (_, index) => {
    const currentDate = addDays(start, index)
    const key = toDateKey(currentDate)
    const bucket = buckets.get(key) ?? { revenue: 0, orderCount: 0 }

    return {
      dateKey: key,
      label: trendLabelFormatter.format(currentDate),
      shortLabel: trendShortLabelFormatter.format(currentDate),
      revenue: bucket.revenue,
      orderCount: bucket.orderCount,
    } satisfies RevenueTrendPoint
  })
}

export function getTopProducts(orders: RevenueDashboardOrder[], limit = 5) {
  const completedOrders = getCompletedOrders(orders)
  const buckets = new Map<string, TopProductStat>()

  for (const order of completedOrders) {
    const key = order.food_id
    const current = buckets.get(key) ?? {
      id: key,
      name: order.food?.name ?? 'Sản phẩm đã xoá',
      slug: order.food?.slug ?? null,
      quantitySold: 0,
      revenue: 0,
      orderCount: 0,
    }

    current.quantitySold += order.quantity
    current.revenue += order.total_price
    current.orderCount += 1

    buckets.set(key, current)
  }

  return Array.from(buckets.values())
    .sort((left, right) => {
      if (right.revenue !== left.revenue) return right.revenue - left.revenue
      if (right.quantitySold !== left.quantitySold) return right.quantitySold - left.quantitySold
      return left.name.localeCompare(right.name, 'vi')
    })
    .slice(0, limit)
}

export function getLowReviews(
  reviews: RevenueDashboardReview[],
  maxRating = 1,
  limit = Number.MAX_SAFE_INTEGER
) {
  return reviews
    .filter((review) => review.rating <= maxRating)
    .sort((left, right) => {
      if (left.rating !== right.rating) return left.rating - right.rating
      return new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
    })
    .slice(0, limit)
}

export function buildRevenueDetailRows(orders: RevenueDashboardOrder[]): RevenueDetailRow[] {
  return [...orders]
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
    .map((order) => ({
      id: order.id,
      createdAt: order.created_at,
      customerName: order.profiles?.full_name?.trim() || 'Khách hàng',
      productName: order.food?.name ?? 'Sản phẩm đã xoá',
      productSlug: order.food?.slug ?? null,
      quantity: order.quantity,
      revenue: order.total_price,
      status: order.status,
    }))
}

function compareStrings(left: string, right: string) {
  return left.localeCompare(right, 'vi', { sensitivity: 'base' })
}

export function filterAndSortRevenueDetailRows(
  rows: RevenueDetailRow[],
  options: {
    search?: string
    status?: RevenueDetailStatusFilter
    timeWindow?: RevenueTimeWindow
    sortKey?: RevenueDetailSortKey
    sortDirection?: RevenueSortDirection
    now?: Date
  } = {}
) {
  const {
    search = '',
    status = 'all',
    timeWindow = 'all',
    sortKey = 'date',
    sortDirection = 'desc',
    now = new Date(),
  } = options
  const normalizedSearch = search.trim().toLocaleLowerCase('vi')
  const minDate = timeWindow === 'all'
    ? null
    : addDays(startOfDay(now), -(timeWindow - 1))

  const filtered = rows.filter((row) => {
    if (status !== 'all' && row.status !== status) {
      return false
    }

    if (minDate && new Date(row.createdAt) < minDate) {
      return false
    }

    if (!normalizedSearch) {
      return true
    }

    const haystack = `${row.customerName} ${row.productName}`.toLocaleLowerCase('vi')
    return haystack.includes(normalizedSearch)
  })

  const direction = sortDirection === 'asc' ? 1 : -1

  return [...filtered].sort((left, right) => {
    let comparison = 0

    switch (sortKey) {
      case 'customer':
        comparison = compareStrings(left.customerName, right.customerName)
        break
      case 'product':
        comparison = compareStrings(left.productName, right.productName)
        break
      case 'quantity':
        comparison = left.quantity - right.quantity
        break
      case 'revenue':
        comparison = left.revenue - right.revenue
        break
      case 'status':
        comparison = STATUS_WEIGHT[left.status] - STATUS_WEIGHT[right.status]
        break
      case 'date':
      default:
        comparison = new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
        break
    }

    if (comparison === 0) {
      comparison = compareStrings(left.productName, right.productName)
    }

    return comparison * direction
  })
}
