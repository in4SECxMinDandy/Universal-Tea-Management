'use client'

import { BarChart3, TrendingUp } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { RevenueTrendPoint } from '@/lib/admin/revenue-dashboard'

const RANGE_OPTIONS = [
  { label: '7 ngày', value: 7 },
  { label: '30 ngày', value: 30 },
  { label: '90 ngày', value: 90 },
] as const

function formatCompactCurrency(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} tỷ`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} triệu`
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`
  return `${value}`
}

export function RevenueTrendChart({
  points,
  activeRange,
  onRangeChange,
}: {
  points: RevenueTrendPoint[]
  activeRange: 7 | 30 | 90
  onRangeChange: (value: 7 | 30 | 90) => void
}) {
  const totalRevenue = points.reduce((sum, point) => sum + point.revenue, 0)
  const totalOrders = points.reduce((sum, point) => sum + point.orderCount, 0)
  const highestPoint = points.reduce<RevenueTrendPoint | null>((current, point) => {
    if (!current || point.revenue > current.revenue) {
      return point
    }
    return current
  }, null)
  const maxRevenue = Math.max(...points.map((point) => point.revenue), 0)
  const safeMaxRevenue = maxRevenue > 0 ? maxRevenue * 1.1 : 1
  const width = 720
  const height = 280
  const paddingX = 24
  const paddingTop = 24
  const paddingBottom = 40
  const plotWidth = width - paddingX * 2
  const plotHeight = height - paddingTop - paddingBottom
  const step = points.length > 1 ? plotWidth / (points.length - 1) : 0
  const labelStep = points.length <= 14 ? 1 : points.length <= 30 ? 5 : 10

  const coordinates = points.map((point, index) => {
    const x = paddingX + step * index
    const y = paddingTop + (1 - point.revenue / safeMaxRevenue) * plotHeight

    return {
      ...point,
      x,
      y,
    }
  })

  const linePath = coordinates
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ')

  const areaPath = coordinates.length === 0
    ? ''
    : `${linePath} L ${coordinates.at(-1)?.x ?? paddingX} ${height - paddingBottom} L ${paddingX} ${height - paddingBottom} Z`

  return (
    <div className="card-base p-5 sm:p-6 lg:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-gold">
            <BarChart3 size={12} />
            Xu hướng doanh thu
          </div>
          <h2 className="mt-4 text-2xl font-bold text-primary">Doanh thu theo thời gian</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
            Quan sát biến động doanh thu từ các đơn hoàn tất để nhận diện nhịp bán tốt và các ngày cần đẩy khuyến mãi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onRangeChange(option.value)}
              className={cn(
                'rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors duration-200 focus-ring',
                activeRange === option.value
                  ? 'border-gold bg-gold text-white shadow-button-glow'
                  : 'border-border-subtle bg-white text-text-secondary hover:border-gold/40 hover:text-primary'
              )}
              aria-pressed={activeRange === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border-subtle bg-cream/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Tổng doanh thu</p>
          <p className="mt-2 text-2xl font-bold text-primary">{formatCompactCurrency(totalRevenue)}₫</p>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-cream/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Số đơn hoàn tất</p>
          <p className="mt-2 text-2xl font-bold text-primary">{totalOrders}</p>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-cream/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Ngày cao nhất</p>
          <p className="mt-2 text-lg font-bold text-primary">
            {highestPoint && highestPoint.revenue > 0 ? highestPoint.shortLabel : 'Chưa có dữ liệu'}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {highestPoint && highestPoint.revenue > 0 ? `${formatCompactCurrency(highestPoint.revenue)}₫` : 'Cần thêm đơn hoàn tất để vẽ xu hướng'}
          </p>
        </div>
      </div>

      {maxRevenue === 0 ? (
        <div className="mt-6 flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-border-subtle bg-cream/50 px-6 text-center">
          <TrendingUp size={28} className="text-gold/70" />
          <h3 className="mt-4 text-lg font-semibold text-primary">Chưa có dữ liệu doanh thu để hiển thị biểu đồ</h3>
          <p className="mt-2 max-w-md text-sm text-text-secondary">
            Khi cửa hàng có đơn hoàn tất, biểu đồ sẽ tự động cập nhật để bạn theo dõi xu hướng ngày bán tốt và ngày giảm tốc.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-3xl border border-border-subtle bg-white px-3 py-4 sm:px-5">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-[280px] w-full"
            role="img"
            aria-label={`Biểu đồ doanh thu ${activeRange} ngày gần nhất`}
          >
            <defs>
              <linearGradient id="revenue-area-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(200, 169, 110, 0.38)" />
                <stop offset="100%" stopColor="rgba(200, 169, 110, 0.04)" />
              </linearGradient>
            </defs>

            {[0, 0.5, 1].map((ratio) => {
              const y = paddingTop + ratio * plotHeight
              const label = formatCompactCurrency(Math.round(safeMaxRevenue * (1 - ratio)))

              return (
                <g key={ratio}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={width - paddingX}
                    y2={y}
                    stroke="rgba(232, 226, 217, 1)"
                    strokeDasharray="4 8"
                  />
                  <text x={paddingX} y={Math.max(y - 6, 14)} fontSize="12" fill="#9C9590">
                    {label}
                  </text>
                </g>
              )
            })}

            <path d={areaPath} fill="url(#revenue-area-gradient)" />
            <path
              d={linePath}
              fill="none"
              stroke="#C8A96E"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {coordinates.map((point, index) => (
              <g key={point.dateKey}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={index === coordinates.length - 1 ? 6 : 4}
                  fill="#FFFFFF"
                  stroke="#C8A96E"
                  strokeWidth="3"
                />
                {(index % labelStep === 0 || index === coordinates.length - 1) && (
                  <text
                    x={point.x}
                    y={height - 10}
                    textAnchor="middle"
                    fontSize="12"
                    fill="#6B6560"
                  >
                    {point.shortLabel}
                  </text>
                )}
              </g>
            ))}
          </svg>
        </div>
      )}
    </div>
  )
}
