'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCategories, useInvalidateCategoryCache } from '@/hooks/useCategories'
import { useInvalidateFoodCache } from '@/hooks/useFoodCatalog'
import { Plus, Tag, Loader2, Pencil, Trash2, X } from 'lucide-react'
import type { FoodCategory } from '@/lib/types'

interface CategoryFormData {
  name: string
  slug: string
  sort_order: number
  is_active: boolean
}

const defaultForm: CategoryFormData = {
  name: '',
  slug: '',
  sort_order: 0,
  is_active: true,
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function AdminCategoriesPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editCategory, setEditCategory] = useState<FoodCategory | null>(null)
  const [form, setForm] = useState<CategoryFormData>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [nameInput, setNameInput] = useState('')
  const supabase = createClient()
  const invalidateCategories = useInvalidateCategoryCache()
  const invalidateFoods = useInvalidateFoodCache()
  const { data: categories = [], isLoading: loading } = useCategories({ activeOnly: false })

  function openAdd() {
    setEditCategory(null)
    setNameInput('')
    setForm({ ...defaultForm, sort_order: categories.length })
    setError('')
    setModalOpen(true)
  }

  function openEdit(cat: FoodCategory) {
    setEditCategory(cat)
    setNameInput(cat.name)
    setForm({
      name: cat.name,
      slug: cat.slug ?? '',
      sort_order: cat.sort_order ?? 0,
      is_active: cat.is_active ?? true,
    })
    setError('')
    setModalOpen(true)
  }

  function handleNameChange(value: string) {
    setNameInput(value)
    if (!editCategory || !form.slug) {
      setForm(prev => ({ ...prev, name: value, slug: slugify(value) }))
    } else {
      setForm(prev => ({ ...prev, name: value }))
    }
  }

  function closeModal() {
    setModalOpen(false)
    setEditCategory(null)
    setError('')
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      setError('Tên phân loại không được để trống.')
      return
    }
    if (!form.slug.trim()) {
      setError('Slug không được để trống.')
      return
    }

    setSaving(true)
    setError('')

    if (editCategory) {
      const { error: err } = await supabase
        .from('food_categories')
        .update({ name: form.name.trim(), slug: form.slug.trim(), sort_order: form.sort_order, is_active: form.is_active })
        .eq('id', editCategory.id)
      if (err) setError('Lỗi khi cập nhật: ' + err.message)
      else {
        closeModal()
        await Promise.all([invalidateCategories(), invalidateFoods()])
      }
    } else {
      const { error: err } = await supabase
        .from('food_categories')
        .insert({ name: form.name.trim(), slug: form.slug.trim(), sort_order: form.sort_order, is_active: form.is_active })
      if (err) setError('Lỗi khi tạo: ' + err.message)
      else {
        closeModal()
        await Promise.all([invalidateCategories(), invalidateFoods()])
      }
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Xoá phân loại này? Các món ăn trong phân loại này sẽ không bị xoá nhưng sẽ không hiển thị.')) return
    const { error: err } = await supabase.from('food_categories').delete().eq('id', id)
    if (!err) {
      await Promise.all([invalidateCategories(), invalidateFoods()])
    }
    else alert('Lỗi khi xoá: ' + err.message)
  }

  async function handleToggleActive(cat: FoodCategory) {
    await supabase.from('food_categories').update({ is_active: !cat.is_active }).eq('id', cat.id)
    await Promise.all([invalidateCategories(), invalidateFoods()])
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
            <Tag size={12} />
            <span>Quản lý</span>
          </div>
          <h1 className="text-2xl font-bold text-primary">Phân loại thực đơn</h1>
          <p className="text-sm text-text-muted mt-1">
            {categories.length > 0 ? `${categories.length} phân loại` : 'Thêm phân loại để nhóm món ăn'}
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary inline-flex items-center gap-2">
          <Plus size={16} />
          <span>Thêm phân loại</span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={32} className="text-text-muted animate-spin" />
          <p className="text-sm text-text-muted">Đang tải dữ liệu...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center card-base p-12">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Tag size={28} className="text-text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-primary mb-2">Chưa có phân loại nào</h3>
          <p className="text-sm text-text-muted mb-6 max-w-sm">
            Thêm phân loại để nhóm các món ăn theo danh mục (VD: Trà sữa, Cà phê, Nước ép...).
          </p>
          <button onClick={openAdd} className="btn-primary inline-flex items-center gap-2">
            <Plus size={16} />
            <span>Thêm phân loại đầu tiên</span>
          </button>
        </div>
      ) : (
        <div className="card-base overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-border-subtle text-xs font-semibold text-text-secondary uppercase tracking-wider">
            <div className="col-span-4">Tên phân loại</div>
            <div className="col-span-3">Slug</div>
            <div className="col-span-2">Thứ tự</div>
            <div className="col-span-2">Trạng thái</div>
            <div className="col-span-1">Thao tác</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border-subtle">
            {categories.map((cat, idx) => (
              <div
                key={cat.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 hover:bg-gray-50 transition-colors duration-150 animate-fade-in"
                style={{ animationDelay: `${idx * 0.03}s` }}
              >
                {/* Name */}
                <div className="md:col-span-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center flex-shrink-0">
                    <Tag size={15} className="text-primary" />
                  </div>
                  <span className="text-sm font-medium text-primary">{cat.name}</span>
                </div>

                {/* Slug */}
                <div className="md:col-span-3 flex items-center">
                  <code className="text-xs font-mono text-text-muted bg-gray-100 px-2 py-1 rounded">
                    {cat.slug}
                  </code>
                </div>

                {/* Sort order */}
                <div className="md:col-span-2 flex items-center">
                  <span className="text-sm text-text-secondary">{cat.sort_order}</span>
                </div>

                {/* Active status */}
                <div className="md:col-span-2 flex items-center">
                  <button
                    onClick={() => handleToggleActive(cat)}
                    className={`
                      px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150 border
                      ${cat.is_active
                        ? 'bg-accent-green/10 text-accent-green border-accent-green/20 hover:bg-accent-green/20'
                        : 'bg-gray-100 text-text-muted border-gray-200 hover:bg-gray-200'
                      }
                    `}
                  >
                    {cat.is_active ? '● Hoạt động' : '○ Ẩn'}
                  </button>
                </div>

                {/* Actions */}
                <div className="md:col-span-1 flex items-center gap-1 justify-start md:justify-end">
                  <button
                    onClick={() => openEdit(cat)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-primary hover:bg-gray-100 cursor-pointer transition-colors duration-150"
                    aria-label="Sửa"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-accent-red hover:bg-red-50 cursor-pointer transition-colors duration-150"
                    aria-label="Xoá"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Modal content */}
          <div className="relative w-full max-w-md bg-surface-card rounded-2xl shadow-2xl border border-border-subtle animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border-subtle">
              <h2 className="text-base font-bold text-primary">
                {editCategory ? 'Sửa phân loại' : 'Thêm phân loại mới'}
              </h2>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-primary hover:bg-gray-100 cursor-pointer transition-colors duration-150"
                aria-label="Đóng"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-accent-red">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-primary" htmlFor="catName">
                  Tên phân loại <span className="text-accent-red">*</span>
                </label>
                <input
                  id="catName"
                  type="text"
                  value={nameInput}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="VD: Trà sữa, Cà phê, Nước ép..."
                  className="input-field"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-primary" htmlFor="catSlug">
                  Slug <span className="text-text-muted font-normal">(URL thân thiện)</span>
                </label>
                <input
                  id="catSlug"
                  type="text"
                  value={form.slug}
                  onChange={e => setForm(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                  placeholder="tra-sua"
                  className="input-field font-mono text-sm"
                />
                <p className="text-[11px] text-text-muted">
                  Đường dẫn: /thuc-pham?category={form.slug || 'slug-cua-ban'}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-primary" htmlFor="catOrder">
                  Thứ tự hiển thị
                </label>
                <input
                  id="catOrder"
                  type="number"
                  min={0}
                  value={form.sort_order}
                  onChange={e => setForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  className="input-field"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, is_active: !prev.is_active }))}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full cursor-pointer transition-colors duration-200
                    ${form.is_active ? 'bg-accent-green' : 'bg-gray-300'}
                  `}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                      form.is_active ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-primary">
                  {form.is_active ? 'Hiển thị trên trang chủ' : 'Ẩn khỏi trang chủ'}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-border-subtle">
              <button onClick={closeModal} className="btn-secondary flex-1">
                Huỷ
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <><Loader2 size={14} className="animate-spin" /><span>Đang lưu...</span></>
                ) : (
                  <span>{editCategory ? 'Lưu thay đổi' : 'Tạo mới'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
