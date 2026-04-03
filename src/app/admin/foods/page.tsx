'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import FoodCard from '@/components/food/FoodCard'
import FoodFormModal from '@/components/admin/FoodFormModal'
import type { Food, Category } from '@/lib/types'

export default function AdminFoodsPage() {
  const [foods, setFoods] = useState<Food[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editFood, setEditFood] = useState<Food | null>(null)
  const supabase = createClient()

  async function loadFoods() {
    const { data } = await supabase
      .from('foods')
      .select('*, category:food_categories(name)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    if (data) setFoods(data as unknown as Food[])
    setLoading(false)
  }

  async function loadCategories() {
    const { data } = await supabase.from('food_categories').select('id, name')
    if (data) setCategories(data)
  }

  useEffect(() => {
    loadFoods()
    loadCategories()
  }, [])

  async function handleDelete(id: string) {
    if (!confirm('Xoá món này?')) return
    await supabase.from('foods').delete().eq('id', id)
    loadFoods()
  }

  function handleEdit(food: Food) {
    setEditFood(food)
    setModalOpen(true)
  }

  function handleAdd() {
    setEditFood(null)
    setModalOpen(true)
  }

  async function handleSaved() {
    setModalOpen(false)
    loadFoods()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý món ăn</h1>
        <button onClick={handleAdd} className="bg-black text-white px-4 py-2 rounded cursor-pointer transition-colors hover:bg-gray-800">
          + Thêm món
        </button>
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : foods.length === 0 ? (
        <p className="text-gray-500">Chưa có món nào.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {foods.map(food => (
            <div key={food.id} className="border rounded-lg p-4">
              <FoodCard food={food} />
              <div className="mt-3 flex gap-2">
                <button onClick={() => handleEdit(food)} className="text-sm border px-3 py-1 rounded cursor-pointer transition-colors hover:bg-gray-50">
                  Sửa
                </button>
                <button onClick={() => handleDelete(food.id)} className="text-sm border border-red-300 text-red-500 px-3 py-1 rounded cursor-pointer transition-colors hover:bg-red-50">
                  Xoá
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <FoodFormModal
          food={editFood}
          categories={categories}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
