'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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
  onSaved: () => void
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
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    let imageUrl = form.image_url

    if (file) {
      const ext = file.name.split('.').pop()
      const path = `${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('food-images')
        .upload(path, file)
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
      const { error } = await supabase.from('foods').update(payload).eq('id', food.id)
      if (error) alert(error.message)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('foods').insert({ ...payload, created_by: user?.id })
      if (error) alert(error.message)
    }

    setLoading(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{food ? 'Sửa món' : 'Thêm món'}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Tên món"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="border px-3 py-2 rounded"
            required
          />
          <input
            type="number"
            placeholder="Giá (VNĐ)"
            value={form.price}
            onChange={e => setForm({ ...form, price: e.target.value })}
            className="border px-3 py-2 rounded"
            required
            min="0"
          />
          <select
            value={form.category_id}
            onChange={e => setForm({ ...form, category_id: e.target.value })}
            className="border px-3 py-2 rounded"
          >
            <option value="">-- Chọn danh mục --</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <textarea
            placeholder="Mô tả"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            className="border px-3 py-2 rounded"
            rows={3}
          />
          <input
            type="number"
            placeholder="Số lượng tồn kho"
            value={form.stock_quantity}
            onChange={e => setForm({ ...form, stock_quantity: parseInt(e.target.value) || 0 })}
            className="border px-3 py-2 rounded"
            min="0"
          />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_available}
                onChange={e => setForm({ ...form, is_available: e.target.checked })}
              />
              Đang bán
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={e => setForm({ ...form, is_featured: e.target.checked })}
              />
              Nổi bật
            </label>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
            className="border px-3 py-2 rounded"
          />
          {form.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.image_url} alt="preview" className="h-24 object-cover rounded" />
          )}
          <div className="flex gap-2 mt-2">
            <button type="submit" disabled={loading} className="flex-1 bg-black text-white py-2 rounded cursor-pointer disabled:opacity-50 transition-colors hover:bg-gray-800">
              {loading ? 'Đang lưu...' : 'Lưu'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded cursor-pointer transition-colors hover:bg-gray-50">
              Huỷ
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
