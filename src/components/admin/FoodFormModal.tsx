'use client'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { X, Upload, Loader2, CheckCircle2 } from 'lucide-react'
import type { Category, Food } from '@/lib/types'

function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export default function FoodFormModal({
  food, categories, onClose, onSaved
}: {
  food: Food | null
  categories: Category[]
  onClose: () => void
  onSaved: () => void | Promise<void>
}) {
  const [form, setForm] = useState({
    name: food?.name ?? '',
    price: food?.price ?? '',
    category_id: food?.category_id ?? '',
    description: food?.description ?? '',
    is_available: food?.is_available ?? true,
    is_featured: food?.is_featured ?? false,
    stock_quantity: food?.stock_quantity ?? 0,
    image_url: food?.image_url ?? '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  // --- Xử lý sự kiện khi ấn Lưu (Submit) form (Hỗ trợ cả tạo mới và cập nhật) ---
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSaved(false)

    let imageUrl = form.image_url

    if (file) {
      setUploadProgress(true)
      const ext = file.name.split('.').pop()
      const path = `${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('food-images')
        .upload(path, file)
      setUploadProgress(false)
      if (uploadError) {
        alert('Upload ảnh thất bại')
        setLoading(false)
        return
      }
      const { data: { publicUrl } } = supabase.storage
        .from('food-images')
        .getPublicUrl(path)
      imageUrl = publicUrl
    }

    const payload = {
      name: form.name,
      slug: slugify(form.name),
      price: parseFloat(form.price as string),
      category_id: form.category_id || null,
      description: form.description || null,
      is_available: form.is_available,
      is_featured: form.is_featured,
      stock_quantity: parseInt(String(form.stock_quantity)),
      image_url: imageUrl || null,
    }

    if (food) {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const { error } = await supabase
        .from('foods')
        .update({
          ...payload,
          updated_by: session?.user?.id ?? null,
        })
        .eq('id', food.id)

      if (error) {
        alert(error.message)
        setLoading(false)
        return
      }
    } else {
      const { data: { session } } = await supabase.auth.getSession()
      const { error } = await supabase.from('foods').insert({ ...payload, created_by: session?.user?.id })
      if (error) {
        alert(error.message)
        setLoading(false)
        return
      }
    }

    setLoading(false)
    setSaved(true)
    setTimeout(() => {
      void onSaved()
    }, 800)
  }

  return (
    <div
      className="fixed inset-0 bg-primary/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* --- Lớp nền tối (Overlay) cho phép tạo hiệu ứng popup Modal. Tự động đóng nếu click ngoài khung --- */}
      {/* Khung giao diện trung tâm cửa sổ Modal */}
      <div data-testid="food-form-modal" className="bg-surface-card rounded-2xl shadow-modal w-full max-w-lg max-h-[90vh] overflow-hidden animate-scale-in">
        {/* --- Khu vực Header: Chứa Tiêu đề Popup và Nút đóng --- */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <div>
            <h2 className="text-lg font-bold text-primary">
              {food ? 'Sửa món' : 'Thêm món mới'}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              {food ? 'Cập nhật thông tin món ăn' : 'Điền thông tin để thêm món mới'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors duration-150 text-text-secondary hover:text-primary"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* --- Giao diện Nhập liệu chính (Sử dụng cuộn dọc Scrollbar khi nội dung dài) --- */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Ô nhập thông tin: Tên món ăn */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-primary">Tên món <span className="text-accent-red">*</span></label>
            <input
              data-testid="food-form-name"
              type="text"
              placeholder="VD: Cơm gà xối mỡ"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="input-field"
              required
            />
          </div>

          {/* Ô nhập thông tin: Giá bán (Bắt buộc kiểu chữ số) */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-primary">Giá (VNĐ) <span className="text-accent-red">*</span></label>
            <input
              data-testid="food-form-price"
              type="number"
              placeholder="VD: 45000"
              value={form.price}
              onChange={e => setForm({ ...form, price: e.target.value })}
              className="input-field"
              required
              min="0"
            />
          </div>

          {/* Dropdown danh sách hệ thống: Lựa chọn Danh Mục phân loại món */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-primary">Danh mục</label>
            <select
              value={form.category_id}
              onChange={e => setForm({ ...form, category_id: e.target.value })}
              className="input-field"
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Ô văn bản đa dòng (Textarea): Mô tả chi tiết thành phần, hương vị món */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-primary">Mô tả</label>
            <textarea
              data-testid="food-form-description"
              placeholder="Mô tả ngắn về món ăn..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="input-field resize-none"
              rows={3}
            />
          </div>

          {/* Ô nhập thông tin: Số lượng giới hạn còn trong Kho/Quán */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-primary">Số lượng tồn kho</label>
            <input
              data-testid="food-form-stock"
              type="number"
              placeholder="VD: 50"
              value={form.stock_quantity}
              onChange={e => setForm({ ...form, stock_quantity: parseInt(e.target.value) || 0 })}
              className="input-field"
              min="0"
            />
          </div>

          {/* Công tắc Toggle UI: Đổi trạng thái hiển thị Nổi bật hoặc Cho phép bán */}
          <div className="flex gap-6">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  data-testid="food-form-available"
                  type="checkbox"
                  checked={form.is_available}
                  onChange={e => setForm({ ...form, is_available: e.target.checked })}
                  className="sr-only"
                />
                <div className={`
                  w-10 h-6 rounded-full transition-colors duration-200
                  ${form.is_available ? 'bg-accent-green' : 'bg-gray-200'}
                `} />
                <div className={`
                  absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
                  ${form.is_available ? 'translate-x-4' : 'translate-x-0'}
                `} />
              </div>
              <span className="text-sm font-medium text-primary group-hover:text-primary-dark transition-colors">
                Đang bán
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  data-testid="food-form-featured"
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={e => setForm({ ...form, is_featured: e.target.checked })}
                  className="sr-only"
                />
                <div className={`
                  w-10 h-6 rounded-full transition-colors duration-200
                  ${form.is_featured ? 'bg-accent-amber' : 'bg-gray-200'}
                `} />
                <div className={`
                  absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
                  ${form.is_featured ? 'translate-x-4' : 'translate-x-0'}
                `} />
              </div>
              <span className="text-sm font-medium text-primary group-hover:text-primary-dark transition-colors">
                Nổi bật
              </span>
            </label>
          </div>

          {/* Khu vực thao tác tập tin: Tải hình ảnh minh hoạ món ăn lên máy chủ Supabase Storage */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-primary">Hình ảnh</label>
            <label
              htmlFor="food-image-upload"
              className={`
                flex flex-col items-center justify-center gap-2 w-full h-32
                border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200
                ${file ? 'border-accent-green bg-accent-green-light/30' : 'border-border-subtle hover:border-primary hover:bg-gray-50'}
              `}
            >
              {file ? (
                <>
                  <CheckCircle2 size={24} className="text-accent-green" />
                  <span className="text-sm font-medium text-accent-green">{file.name}</span>
                </>
              ) : (
                <>
                  <Upload size={24} className="text-text-muted" />
                  <span className="text-sm text-text-muted">
                    {form.image_url ? 'Thay đổi ảnh...' : 'Tải ảnh lên'}
                  </span>
                </>
              )}
              <input
                data-testid="food-form-image"
                id="food-image-upload"
                type="file"
                accept="image/*"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
                className="sr-only"
              />
            </label>
          </div>

          {/* Không gian giao diện Xem Trước ảnh (Preview) ngay khi người dùng pick xong */}
          {(form.image_url || file) && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-primary">Xem trước</label>
              {file ? (
                <div className="relative h-32 rounded-xl overflow-hidden bg-gray-100">
                  <Image
                    src={previewUrl!}
                    alt="preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="relative h-32 rounded-xl overflow-hidden bg-gray-100">
                  <Image
                    src={form.image_url}
                    alt="preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
            </div>
          )}

          {/* --- Các Nút Hành Động Ở Dưới (Lưu xác nhận / Huỷ form) --- */}
          <div className="flex gap-3 pt-2 border-t border-border-subtle">
            <button
              type="submit"
              disabled={loading || !form.name || !form.price}
              data-testid="food-form-submit"
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {uploadProgress ? 'Đang tải ảnh...' : 'Đang lưu...'}
                </>
              ) : saved ? (
                <>
                  <CheckCircle2 size={16} />
                  Đã lưu!
                </>
              ) : (
                food ? 'Cập nhật' : 'Thêm món'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary flex-1"
            >
              Huỷ
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
