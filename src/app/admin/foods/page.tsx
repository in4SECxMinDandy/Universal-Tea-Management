'use client'
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import FoodCard from '@/components/food/FoodCard'
import FoodFormModal from '@/components/admin/FoodFormModal'
import { useCategories, useInvalidateCategoryCache } from '@/hooks/useCategories'
import { useFoodCatalog, useInvalidateFoodCache } from '@/hooks/useFoodCatalog'
import { Plus, UtensilsCrossed, Loader2, Search, X, ChevronDown } from 'lucide-react'
import type { Food, Category } from '@/lib/types'

type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'price-low' | 'price-high'

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'name-asc', label: 'Tên A → Z' },
  { value: 'name-desc', label: 'Tên Z → A' },
  { value: 'price-low', label: 'Giá thấp → cao' },
  { value: 'price-high', label: 'Giá cao → thấp' },
]

export default function AdminFoodsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editFood, setEditFood] = useState<Food | null>(null)

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const supabase = createClient()
  const invalidateFoods = useInvalidateFoodCache()
  const invalidateCategories = useInvalidateCategoryCache()
  const { data: foods = [], isLoading: foodsLoading } = useFoodCatalog({
    includeUnavailable: true,
    includeInactiveCategories: true,
    sort: 'admin',
  })
  const { data: categories = [], isLoading: categoriesLoading } = useCategories()
  const loading = foodsLoading || categoriesLoading

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Lọc, tìm kiếm và sắp xếp danh sách kết quả ngay trên giao diện theo tuỳ chọn
  const filteredFoods = useMemo(() => {
    let result = [...foods]

    // Search filter
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.description?.toLowerCase().includes(q)
      )
    }

    // Category filter
    if (selectedCategory) {
      result = result.filter(f => (f.category as unknown as Category)?.id === selectedCategory)
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => (new Date(b.created_at ?? 0).getTime()) - (new Date(a.created_at ?? 0).getTime()))
        break
      case 'oldest':
        result.sort((a, b) => (new Date(a.created_at ?? 0).getTime()) - (new Date(b.created_at ?? 0).getTime()))
        break
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name, 'vi'))
        break
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name, 'vi'))
        break
      case 'price-low':
        result.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
        break
      case 'price-high':
        result.sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
        break
    }

    return result
  }, [foods, debouncedSearch, selectedCategory, sortBy])

  function clearFilters() {
    setSearchQuery('')
    setDebouncedSearch('')
    setSelectedCategory('')
    setSortBy('newest')
  }

  const hasActiveFilters = searchQuery || selectedCategory || sortBy !== 'newest'

  // Hỏi xác nhận và tiến hành xoá item món ăn hoàn toàn
  async function handleDelete(id: string) {
    if (!confirm('Bạn có chắc muốn xoá món này?')) return
    const { error } = await supabase.from('foods').delete().eq('id', id)
    if (!error) {
      await invalidateFoods()
    }
  }

  // Logic hiển thị Form Modal và gán dữ liệu món đang muốn sửa
  function handleEdit(food: Food) {
    setEditFood(food)
    setModalOpen(true)
  }

  // Logic hiển thị Form Modal ở trạng thái trống (Thêm mới)
  function handleAdd() {
    setEditFood(null)
    setModalOpen(true)
  }

  async function handleSaved() {
    setModalOpen(false)
    await Promise.all([invalidateFoods(), invalidateCategories()])
  }

  return (
    <div>
      {/* --- Phần Header Của Trang. Chứa Tên trang và thông báo số món + Nút Gọi lệnh Thêm Món --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
            <UtensilsCrossed size={12} />
            <span>Quản lý</span>
          </div>
          <h1 className="text-2xl font-bold text-primary">Quản lý món ăn</h1>
          <p className="text-sm text-text-muted mt-1">
            {filteredFoods.length > 0
              ? `${filteredFoods.length} / ${foods.length} món`
              : `${foods.length} món trong thực đơn`}
          </p>
        </div>
        <button onClick={handleAdd} data-testid="admin-food-add" className="btn-primary inline-flex items-center gap-2">
          <Plus size={16} />
          <span>Thêm món</span>
        </button>
      </div>

      {/* --- Dải thanh công cụ xử lý nghiệp vụ: Tìm theo tên, Lọc theo loại, Đảo thứ tự --- */}
      {!loading && foods.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Component: Thanh Nhập Từ khoá Tìm Kiếm */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên, mô tả..."
              className="input-field pl-9 pr-8 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary cursor-pointer"
                aria-label="Xoá tìm kiếm"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Component: Select chọn Danh mục món để lọc */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="input-field text-sm pr-8 appearance-none cursor-pointer min-w-[160px]"
            >
              <option value="">Tất cả phân loại</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>

          {/* Component: Dropdown Menu chọn chế độ Sắp Xếp (Sort) */}
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="input-field text-sm flex items-center gap-2 cursor-pointer min-w-[150px]"
            >
              <span>{sortOptions.find(o => o.value === sortBy)?.label}</span>
              <ChevronDown size={14} className="ml-auto text-text-muted" />
            </button>
            {showSortDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSortDropdown(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 bg-surface-card border border-border-subtle rounded-xl shadow-lg overflow-hidden min-w-[160px]">
                  {sortOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setSortBy(opt.value); setShowSortDropdown(false) }}
                      className={`
                        w-full text-left px-4 py-2.5 text-sm cursor-pointer transition-colors duration-150
                        ${sortBy === opt.value
                          ? 'bg-primary/5 text-primary font-medium'
                          : 'text-text-secondary hover:bg-gray-50'
                        }
                      `}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Nút dọn dẹp: Bấm để huỷ bỏ tất cả bộ lọc hiện hữu */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="btn-secondary text-sm flex items-center gap-1.5 px-3 py-2 whitespace-nowrap"
            >
              <X size={13} />
              <span>Xoá lọc</span>
            </button>
          )}
        </div>
      )}

      {/* --- Lưới Nội Dung: Hiển thị giao diện danh sách từng món một --- */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={32} className="text-text-muted animate-spin" />
          <p className="text-sm text-text-muted">Đang tải dữ liệu...</p>
        </div>
      ) : filteredFoods.length === 0 ? (
        foods.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center card-base p-12">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <UtensilsCrossed size={28} className="text-text-muted" />
            </div>
            <h3 className="text-lg font-semibold text-primary mb-2">Chưa có món nào</h3>
            <p className="text-sm text-text-muted mb-6 max-w-sm">
              Hãy bắt đầu bằng việc thêm món ăn đầu tiên vào thực đơn của bạn.
            </p>
            <button onClick={handleAdd} className="btn-primary inline-flex items-center gap-2">
              <Plus size={16} />
              <span>Thêm món đầu tiên</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center card-base p-12">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Search size={24} className="text-text-muted" />
            </div>
            <h3 className="text-base font-semibold text-primary mb-2">Không tìm thấy món phù hợp</h3>
            <p className="text-sm text-text-muted mb-4">
              Thử thay đổi từ khoá tìm kiếm hoặc bỏ lọc.
            </p>
            <button onClick={clearFilters} className="btn-secondary inline-flex items-center gap-2 text-sm">
              <X size={13} />
              <span>Xoá bộ lọc</span>
            </button>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFoods.map((food, idx) => (
            <div
              key={food.id}
              className="card-base p-4 animate-fade-in-up"
              style={{ animationDelay: `${idx * 0.04}s`, opacity: 0 }}
            >
              <FoodCard food={food} />
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleEdit(food)}
                  className="btn-secondary flex-1 text-sm py-2"
                >
                  Sửa
                </button>
                <button
                  onClick={() => handleDelete(food.id)}
                  className="btn-danger flex-1 text-sm py-2"
                >
                  Xoá
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- Thẻ ngầm (Modal): Nó chỉ bật nổi lên trên màn hình khi state modalOpen là true --- */}
      {modalOpen && (
        <FoodFormModal
          food={editFood}
          categories={categories as Category[]}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
