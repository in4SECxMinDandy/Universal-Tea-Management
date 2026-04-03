export interface Category {
  id: string
  name: string
  slug?: string
  is_active?: boolean
  sort_order?: number
}

export interface FoodCategory {
  id: string
  name: string
  slug?: string
  is_active: boolean
  sort_order: number
  created_at?: string
}

export interface Food {
  id: string
  name: string
  slug: string
  price: number
  image_url: string | null
  description: string | null
  is_available: boolean
  is_featured: boolean
  category_id: string | null
  stock_quantity: number
  category: { name: string } | null
  created_by?: string
  sort_order?: number
  created_at?: string
  updated_at?: string
}

export interface FoodWithCategory extends Food {
  category: { name: string } | null
}
