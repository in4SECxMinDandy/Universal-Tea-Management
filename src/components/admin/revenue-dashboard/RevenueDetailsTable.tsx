'use client'

import Link from 'next/link'
import { ArrowDownAZ, ArrowUpAZ, Search } from 'lucide-react'

import {
  type RevenueDetailRow,
  type RevenueDetailSortKey,
  type RevenueDetailStatusFilter,
  type RevenueSortDirection,
  type RevenueTimeWindow,
} from '@/lib/admin/revenue-dashboard'
import { cn, formatPrice, formatTime } from '@/lib/utils'

const STATUS_OPTIONS: Array<{ label: string; value: RevenueDetailStatusFilter }> = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Hoàn thành', value: 'completed' },
  { label: 'Đang chờ', value: 'pending' },
  { label: 'Đã xác nhận', value: 'confirmed' },
  { label: 'Đã hủy', value: 'cancelled' },
]

const WINDOW_OPTIONS: Array<{ label: string; value: RevenueTimeWindow }> = [
  { label: 'Toàn bộ', value: 'all' },
  { label: '7 ngày', value: 7 },
  { label: '30 ngày', value: 30 },
  { label: '90 ngày', value: 90 },
]

const SORT_OPTIONS: Array<{ label: string; value: RevenueDetailSortKey }> = [
  { label: 'Ngày', value: 'date' },
  { label: 'Khách hàng', value: 'customer' },
  { label: 'Sản phẩm', value: 'product' },
  { label: 'Số lượng', value: 'quantity' },
  { label: 'Doanh thu', value: 'revenue' },
  { label: 'Trạng thái', value: 'status' },
]

const statusLabelMap: Record<Exclude<RevenueDetailStatusFilter, 'all'>, string> = {
  completed: 'Hoàn thành',
  confirmed: 'Đã xác nhận',
  pending: 'Đang chờ',
  cancelled: 'Đã hủy',
}

const statusClassMap: Record<Exclude<RevenueDetailStatusFilter, 'all'>, string> = {
  completed: 'bg-accent-green-light text-accent-green',
  confirmed: 'bg-blue-50 text-blue-700',
  pending: 'bg-accent-amber-light text-accent-amber',
  cancelled: 'bg-accent-red-light text-accent-red',
}

export function RevenueDetailsTable({
  rows,
  totalRows,
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  timeWindow,
  onTimeWindowChange,
  sortKey,
  sortDirection,
  onSortKeyChange,
  onSortDirectionToggle,
}: {
  rows: RevenueDetailRow[]
  totalRows: number
  searchValue: string
  onSearchChange: (value: string) => void
  statusFilter: RevenueDetailStatusFilter
  onStatusFilterChange: (value: RevenueDetailStatusFilter) => void
  timeWindow: RevenueTimeWindow
  onTimeWindowChange: (value: RevenueTimeWindow) => void
  sortKey: RevenueDetailSortKey
  sortDirection: RevenueSortDirection
  onSortKeyChange: (value: RevenueDetailSortKey) => void
  onSortDirectionToggle: () => void
}) {
  return (
    <section className="card-base p-5 sm:p-6 lg:p-7">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-cream/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-text-secondary">
              Bảng chi tiết
            </div>
            <h2 className="mt-4 text-2xl font-bold text-primary">Thống kê chi tiết đơn hàng</h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Lọc và sắp xếp theo khách hàng, sản phẩm, thời gian hoặc trạng thái để rà nhanh từng giao dịch ảnh hưởng đến doanh thu.
            </p>
          </div>

          <div className="rounded-2xl border border-border-subtle bg-cream/70 px-4 py-3 text-sm text-text-secondary">
            Hiển thị <span className="font-bold text-primary">{rows.length}</span> / {totalRows} dòng
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr),220px,240px]">
          <div>
            <label htmlFor="revenue-dashboard-search" className="mb-1.5 block text-sm font-medium text-primary">
              Tìm theo khách hàng hoặc sản phẩm
            </label>
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                id="revenue-dashboard-search"
                type="text"
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Ví dụ: Trà sữa, Lan..."
                className="input-field pl-11"
              />
            </div>
          </div>

          <div>
            <label htmlFor="revenue-dashboard-window" className="mb-1.5 block text-sm font-medium text-primary">
              Khoảng thời gian
            </label>
            <select
              id="revenue-dashboard-window"
              value={String(timeWindow)}
              onChange={(event) => {
                const value = event.target.value
                onTimeWindowChange(value === 'all' ? 'all' : Number(value) as RevenueTimeWindow)
              }}
              className="input-field"
            >
              {WINDOW_OPTIONS.map((option) => (
                <option key={String(option.value)} value={String(option.value)}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="revenue-dashboard-sort" className="mb-1.5 block text-sm font-medium text-primary">
              Sắp xếp
            </label>
            <div className="flex gap-2">
              <select
                id="revenue-dashboard-sort"
                value={sortKey}
                onChange={(event) => onSortKeyChange(event.target.value as RevenueDetailSortKey)}
                className="input-field"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={onSortDirectionToggle}
                className="inline-flex h-12 w-12 items-center justify-center rounded-xl border-2 border-border-subtle bg-white text-text-secondary transition-colors duration-200 hover:border-gold/40 hover:text-primary focus-ring"
                aria-label={sortDirection === 'asc' ? 'Sắp xếp tăng dần' : 'Sắp xếp giảm dần'}
              >
                {sortDirection === 'asc' ? <ArrowUpAZ size={18} /> : <ArrowDownAZ size={18} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onStatusFilterChange(option.value)}
              className={cn(
                'rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors duration-200 focus-ring',
                statusFilter === option.value
                  ? 'border-gold bg-gold text-white'
                  : 'border-border-subtle bg-white text-text-secondary hover:border-gold/40 hover:text-primary'
              )}
              aria-pressed={statusFilter === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-border-subtle bg-cream/50 px-6 py-14 text-center">
          <h3 className="text-lg font-semibold text-primary">Không có giao dịch phù hợp</h3>
          <p className="mt-2 text-sm text-text-secondary">
            Thử đổi khoảng thời gian, trạng thái hoặc từ khóa tìm kiếm để xem thêm dữ liệu.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-3xl border border-border-subtle bg-white">
          <div className="hidden grid-cols-12 gap-4 border-b border-border-subtle bg-cream/70 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary lg:grid">
            <div className="col-span-2">Ngày</div>
            <div className="col-span-2">Khách hàng</div>
            <div className="col-span-3">Sản phẩm</div>
            <div className="col-span-1">SL</div>
            <div className="col-span-2">Doanh thu</div>
            <div className="col-span-2">Trạng thái</div>
          </div>

          <div className="divide-y divide-border-subtle">
            {rows.map((row) => (
              <article key={row.id} className="px-5 py-4 transition-colors duration-200 hover:bg-cream/40">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:gap-4">
                  <div className="lg:col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted lg:hidden">Ngày</p>
                    <p className="mt-1 text-sm font-medium text-primary">{formatTime(row.createdAt)}</p>
                  </div>

                  <div className="lg:col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted lg:hidden">Khách hàng</p>
                    <p className="mt-1 text-sm text-primary">{row.customerName}</p>
                  </div>

                  <div className="lg:col-span-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted lg:hidden">Sản phẩm</p>
                    <div className="mt-1">
                      {row.productSlug ? (
                        <Link href={`/thuc-pham/${row.productSlug}`} className="rounded-md text-sm font-semibold text-primary hover:text-gold focus-ring">
                          {row.productName}
                        </Link>
                      ) : (
                        <p className="text-sm font-semibold text-primary">{row.productName}</p>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted lg:hidden">Số lượng</p>
                    <p className="mt-1 text-sm text-primary">{row.quantity}</p>
                  </div>

                  <div className="lg:col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted lg:hidden">Doanh thu</p>
                    <p className="mt-1 text-sm font-semibold text-gold">{formatPrice(row.revenue)}</p>
                  </div>

                  <div className="lg:col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted lg:hidden">Trạng thái</p>
                    <span className={cn('mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold', statusClassMap[row.status])}>
                      {statusLabelMap[row.status]}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
