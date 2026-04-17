'use client'

import Link from 'next/link'
import { startTransition, useDeferredValue, useMemo, useState, type ComponentType } from 'react'
import {
  ArrowUpRight,
  CalendarDays,
  Loader2,
  Package,
  ReceiptText,
  RefreshCw,
  Star,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react'

import { RevenueDetailsTable } from '@/components/admin/revenue-dashboard/RevenueDetailsTable'
import { RevenueTrendChart } from '@/components/admin/revenue-dashboard/RevenueTrendChart'
import StarRating from '@/components/reviews/StarRating'
import { useRevenueDashboard } from '@/hooks/useRevenueDashboard'
import {
  buildRevenueDetailRows,
  buildRevenueTrendSeries,
  filterAndSortRevenueDetailRows,
  getCompletedRevenueSummary,
  getLowReviews,
  getRevenuePeriodTotals,
  getTopProducts,
  type RevenueDashboardReview,
  type RevenueDetailSortKey,
  type RevenueDetailStatusFilter,
  type RevenueSortDirection,
  type RevenueTimeWindow,
} from '@/lib/admin/revenue-dashboard'
import { cn, formatPrice, formatTime } from '@/lib/utils'

type TrendRange = 7 | 30 | 90
type ReviewFilter = 1 | 2 | 3

const REVIEW_FILTER_OPTIONS: Array<{ label: string; value: ReviewFilter }> = [
  { label: '1 sao', value: 1 },
  { label: '1-2 sao', value: 2 },
  { label: '1-3 sao', value: 3 },
]

export function RevenueDashboard() {
  const [trendRange, setTrendRange] = useState<TrendRange>(30)
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>(1)
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<RevenueDetailStatusFilter>('all')
  const [timeWindow, setTimeWindow] = useState<RevenueTimeWindow>('all')
  const [sortKey, setSortKey] = useState<RevenueDetailSortKey>('date')
  const [sortDirection, setSortDirection] = useState<RevenueSortDirection>('desc')
  const deferredSearchValue = useDeferredValue(searchValue)
  const {
    data,
    error,
    isError,
    isFetching,
    isLoading,
    refetch,
    dataUpdatedAt,
  } = useRevenueDashboard()

  const orders = useMemo(() => data?.orders ?? [], [data?.orders])
  const reviews = useMemo(() => data?.reviews ?? [], [data?.reviews])
  const summary = useMemo(() => getCompletedRevenueSummary(orders), [orders])
  const periodTotals = useMemo(() => getRevenuePeriodTotals(orders), [orders])
  const trendPoints = useMemo(() => buildRevenueTrendSeries(orders, trendRange), [orders, trendRange])
  const topProducts = useMemo(() => getTopProducts(orders, 5), [orders])
  const lowReviews = useMemo(() => getLowReviews(reviews, reviewFilter, 5), [reviewFilter, reviews])
  const oneStarReviews = useMemo(() => getLowReviews(reviews, 1), [reviews])
  const detailRows = useMemo(() => buildRevenueDetailRows(orders), [orders])
  const filteredRows = useMemo(
    () =>
      filterAndSortRevenueDetailRows(detailRows, {
        search: deferredSearchValue,
        status: statusFilter,
        timeWindow,
        sortKey,
        sortDirection,
      }),
    [deferredSearchValue, detailRows, sortDirection, sortKey, statusFilter, timeWindow]
  )
  const lastUpdatedAt = dataUpdatedAt ? formatTime(dataUpdatedAt) : null

  function handleSearchChange(value: string) {
    startTransition(() => {
      setSearchValue(value)
    })
  }

  function handleStatusChange(value: RevenueDetailStatusFilter) {
    startTransition(() => {
      setStatusFilter(value)
    })
  }

  function handleTimeWindowChange(value: RevenueTimeWindow) {
    startTransition(() => {
      setTimeWindow(value)
    })
  }

  function handleSortKeyChange(value: RevenueDetailSortKey) {
    startTransition(() => {
      setSortKey(value)
    })
  }

  function handleSortDirectionToggle() {
    startTransition(() => {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
    })
  }

  if (isLoading && !data) {
    return <DashboardSkeleton />
  }

  if (isError) {
    return (
      <div className="card-base p-8 text-center">
        <TriangleAlert size={30} className="mx-auto text-accent-red" />
        <h1 className="mt-4 text-2xl font-bold text-primary">Không thể tải dashboard doanh thu</h1>
        <p className="mt-2 text-sm text-text-secondary">
          {error instanceof Error ? error.message : 'Đã xảy ra lỗi khi lấy dữ liệu doanh thu.'}
        </p>
        <button onClick={() => void refetch()} className="btn-primary mt-6 inline-flex items-center gap-2">
          <RefreshCw size={16} />
          Thử lại
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-6">
      <section className="relative overflow-hidden rounded-[28px] luxury-gradient px-6 py-8 text-white shadow-luxury sm:px-8 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(200,169,110,0.35),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_35%)]" />
        <div className="relative">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-gold-light">
                <TrendingUp size={12} />
                Dashboard doanh thu
              </div>
              <h1 className="mt-4 text-3xl font-bold sm:text-4xl lg:text-[2.6rem]">Toàn cảnh vận hành doanh thu cửa hàng</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
                Theo dõi doanh thu theo chu kỳ, tìm ra sản phẩm kéo tăng trưởng và xử lý sớm các đánh giá kém trước khi ảnh hưởng đến quyết định mua lại.
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 lg:items-end">
              <button
                onClick={() => void refetch()}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-white/15 focus-ring"
              >
                {isFetching ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Làm mới
              </button>
              {lastUpdatedAt ? (
                <p className="text-xs text-white/65">Cập nhật gần nhất: {lastUpdatedAt}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-light">Đơn hoàn tất</p>
              <p className="mt-2 text-3xl font-bold">{summary.completedOrderCount}</p>
              <p className="mt-1 text-sm text-white/70">{summary.totalQuantity} sản phẩm đã bán</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-light">Giá trị trung bình / đơn</p>
              <p className="mt-2 text-3xl font-bold">{formatPrice(summary.averageOrderValue)}</p>
              <p className="mt-1 text-sm text-white/70">Dựa trên các đơn đã hoàn thành</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-light">Cảnh báo 1 sao</p>
              <p className="mt-2 text-3xl font-bold">{oneStarReviews.length}</p>
              <p className="mt-1 text-sm text-white/70">Ưu tiên xử lý để giảm churn</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary transition-transform duration-200 hover:-translate-y-0.5 focus-ring"
            >
              Xem đơn hàng
              <ArrowUpRight size={14} />
            </Link>
            <Link
              href="/admin/reviews"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/15 focus-ring"
            >
              Xem đánh giá tiêu cực
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={CalendarDays}
          title="Hôm nay"
          value={formatPrice(periodTotals.day)}
          description="Doanh thu phát sinh trong ngày"
          accent="gold"
        />
        <MetricCard
          icon={TrendingUp}
          title="Tuần này"
          value={formatPrice(periodTotals.week)}
          description="Tính từ đầu tuần đến hiện tại"
          accent="emerald"
        />
        <MetricCard
          icon={ReceiptText}
          title="Tháng này"
          value={formatPrice(periodTotals.month)}
          description="Theo dõi tốc độ chạm mục tiêu tháng"
          accent="amber"
        />
        <MetricCard
          icon={Package}
          title="Năm nay"
          value={formatPrice(periodTotals.year)}
          description="Tổng hợp doanh thu lũy kế theo năm"
          accent="slate"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr),minmax(320px,1fr)]">
        <RevenueTrendChart points={trendPoints} activeRange={trendRange} onRangeChange={setTrendRange} />
        <TopProductsPanel products={topProducts} />
      </section>

      <LowReviewsPanel
        reviews={lowReviews}
        reviewFilter={reviewFilter}
        onFilterChange={setReviewFilter}
        totalOneStar={oneStarReviews.length}
      />

      <RevenueDetailsTable
        rows={filteredRows}
        totalRows={detailRows.length}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusChange}
        timeWindow={timeWindow}
        onTimeWindowChange={handleTimeWindowChange}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSortKeyChange={handleSortKeyChange}
        onSortDirectionToggle={handleSortDirectionToggle}
      />
    </div>
  )
}

function MetricCard({
  icon: Icon,
  title,
  value,
  description,
  accent,
}: {
  icon: ComponentType<{ size?: number; className?: string }>
  title: string
  value: string
  description: string
  accent: 'gold' | 'emerald' | 'amber' | 'slate'
}) {
  const accentMap = {
    gold: 'bg-gold/10 text-gold border-gold/20',
    emerald: 'bg-accent-green-light text-accent-green border-accent-green/20',
    amber: 'bg-accent-amber-light text-accent-amber border-accent-amber/20',
    slate: 'bg-primary/5 text-primary border-primary/10',
  } as const

  return (
    <article className="card-base p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">{title}</p>
          <p className="mt-3 text-2xl font-bold text-primary">{value}</p>
          <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>
        </div>
        <div className={cn('rounded-2xl border p-3', accentMap[accent])}>
          <Icon size={18} />
        </div>
      </div>
    </article>
  )
}

function TopProductsPanel({
  products,
}: {
  products: ReturnType<typeof getTopProducts>
}) {
  const highestRevenue = products[0]?.revenue ?? 0

  return (
    <section className="card-base p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-cream/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-text-secondary">
            <Package size={12} />
            Top 5 sản phẩm
          </div>
          <h2 className="mt-4 text-2xl font-bold text-primary">Sản phẩm bán chạy nhất</h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Ưu tiên các món đóng góp doanh thu nhiều nhất để tối ưu tồn kho và chiến dịch upsell.
          </p>
        </div>
        <Link href="/admin/foods" className="rounded-lg text-sm font-semibold text-gold hover:text-gold-dark focus-ring">
          Quản lý món
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-border-subtle bg-cream/50 px-6 py-14 text-center">
          <Package size={28} className="mx-auto text-gold/70" />
          <h3 className="mt-4 text-lg font-semibold text-primary">Chưa có dữ liệu bán hàng</h3>
          <p className="mt-2 text-sm text-text-secondary">
            Top sản phẩm sẽ xuất hiện khi có đơn hàng hoàn tất.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {products.map((product, index) => {
            const width = highestRevenue > 0 ? (product.revenue / highestRevenue) * 100 : 0

            return (
              <article key={product.id} className="rounded-3xl border border-border-subtle bg-white p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gold text-sm font-bold text-white">
                    #{index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-primary">{product.name}</p>
                        <p className="mt-1 text-sm text-text-secondary">
                          {product.quantitySold} sản phẩm • {product.orderCount} đơn hoàn tất
                        </p>
                      </div>
                      <p className="text-sm font-bold text-gold">{formatPrice(product.revenue)}</p>
                    </div>

                    <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-cream-dark">
                      <div className="h-full rounded-full bg-gold transition-[width] duration-500" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

function LowReviewsPanel({
  reviews,
  reviewFilter,
  onFilterChange,
  totalOneStar,
}: {
  reviews: RevenueDashboardReview[]
  reviewFilter: ReviewFilter
  onFilterChange: (value: ReviewFilter) => void
  totalOneStar: number
}) {
  return (
    <section className="card-base p-5 sm:p-6 lg:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent-red/15 bg-accent-red-light/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-accent-red">
            <TriangleAlert size={12} />
            Đánh giá cần xử lý
          </div>
          <h2 className="mt-4 text-2xl font-bold text-primary">Phản hồi tiêu cực từ khách hàng</h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Mặc định ưu tiên 1 sao để quản lý xử lý ngay các điểm chạm gây mất doanh thu và giảm tỷ lệ quay lại.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {REVIEW_FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onFilterChange(option.value)}
              className={cn(
                'rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors duration-200 focus-ring',
                reviewFilter === option.value
                  ? 'border-accent-red bg-accent-red text-white'
                  : 'border-border-subtle bg-white text-text-secondary hover:border-accent-red/30 hover:text-accent-red'
              )}
              aria-pressed={reviewFilter === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-3xl border border-border-subtle bg-cream/70 px-4 py-3 text-sm text-text-secondary">
        <span>
          <span className="font-bold text-primary">{totalOneStar}</span> đánh giá 1 sao đang cần ưu tiên
        </span>
        <span className="hidden h-4 w-px bg-border-subtle sm:inline-block" />
        <Link href="/admin/reviews" className="rounded-lg font-semibold text-gold hover:text-gold-dark focus-ring">
          Mở trang phản hồi đánh giá
        </Link>
      </div>

      {reviews.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-border-subtle bg-cream/50 px-6 py-14 text-center">
          <Star size={28} className="mx-auto text-gold/70" />
          <h3 className="mt-4 text-lg font-semibold text-primary">Không có đánh giá trong bộ lọc này</h3>
          <p className="mt-2 text-sm text-text-secondary">
            Khi khách để lại đánh giá thấp, danh sách sẽ xuất hiện tại đây để bạn phản hồi nhanh hơn.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-3xl border border-border-subtle bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-primary">{review.reviewer_name}</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {review.food?.name ?? 'Sản phẩm đã xoá'}
                  </p>
                </div>
                <StarRating value={review.rating} />
              </div>

              <p className="mt-4 line-clamp-4 text-sm leading-6 text-text-secondary">
                {review.comment?.trim() || 'Khách chưa nhập nội dung đánh giá.'}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                <span>{formatTime(review.created_at)}</span>
                {review.food?.slug ? (
                  <Link href={`/thuc-pham/${review.food.slug}`} className="rounded-lg font-semibold text-gold hover:text-gold-dark focus-ring">
                    Xem sản phẩm
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-72 rounded-[28px] skeleton" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-36 rounded-3xl skeleton" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr),minmax(320px,1fr)]">
        <div className="h-[440px] rounded-3xl skeleton" />
        <div className="h-[440px] rounded-3xl skeleton" />
      </div>
      <div className="h-[340px] rounded-3xl skeleton" />
      <div className="h-[540px] rounded-3xl skeleton" />
    </div>
  )
}
