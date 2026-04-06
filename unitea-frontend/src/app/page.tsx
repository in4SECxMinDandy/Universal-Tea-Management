import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import FoodCard from '@/components/food/FoodCard'
import { ArrowRight, Star } from 'lucide-react'
import type { Food } from '@/lib/types'

const mockFeatured = [
  {
    id: 'mock-1',
    name: 'Trà Sữa Oolong Hoàng Kim',
    slug: 'tra-sua-oolong-hoang-kim',
    price: 55000,
    image_url: 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=600&h=400&fit=crop',
    description: 'Trà oolong thượng hạng kết hợp sữa tươi Hokkaido',
    is_available: true,
    is_featured: true,
    category_id: null,
    stock_quantity: 50,
    category: { name: 'Trà Sữa' },
  },
  {
    id: 'mock-2',
    name: 'Bánh Croissant Bơ Pháp',
    slug: 'banh-croissant-bo-phap',
    price: 45000,
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=400&fit=crop',
    description: 'Croissant 36 lớp bơ Échiré nhập khẩu',
    is_available: true,
    is_featured: true,
    category_id: null,
    stock_quantity: 30,
    category: { name: 'Bánh Ngọt' },
  },
  {
    id: 'mock-3',
    name: 'Matcha Latte Nhật Bản',
    slug: 'matcha-latte-nhat-ban',
    price: 65000,
    image_url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&h=400&fit=crop',
    description: 'Bột matcha Uji grade A pha cùng sữa tươi',
    is_available: true,
    is_featured: true,
    category_id: null,
    stock_quantity: 40,
    category: { name: 'Trà Sữa' },
  },
  {
    id: 'mock-4',
    name: 'Tiramisu Cổ Điển',
    slug: 'tiramisu-co-dien',
    price: 75000,
    image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&h=400&fit=crop',
    description: 'Tiramisu kem mascarpone Italy chính hiệu',
    is_available: true,
    is_featured: true,
    category_id: null,
    stock_quantity: 20,
    category: { name: 'Bánh Ngọt' },
  },
  {
    id: 'mock-5',
    name: 'Hồng Trà Vải Thiều',
    slug: 'hong-tra-vai-thieu',
    price: 50000,
    image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&h=400&fit=crop',
    description: 'Hồng trà Ceylon kết hợp vải thiều tươi',
    is_available: true,
    is_featured: true,
    category_id: null,
    stock_quantity: 45,
    category: { name: 'Trà Sữa' },
  },
  {
    id: 'mock-6',
    name: 'Éclair Socola Bỉ',
    slug: 'eclair-socola-bi',
    price: 60000,
    image_url: 'https://images.unsplash.com/photo-1509482560494-4126f8225994?w=600&h=400&fit=crop',
    description: 'Éclair nhân kem socola Bỉ Callebaut',
    is_available: true,
    is_featured: true,
    category_id: null,
    stock_quantity: 25,
    category: { name: 'Bánh Ngọt' },
  },
]

const categories = [
  { icon: '🍵', title: 'Trà Sữa Thượng Hạng', desc: 'Nguyên liệu nhập khẩu, pha chế theo công thức độc quyền' },
  { icon: '🥐', title: 'Bánh Ngọt Tinh Tế', desc: 'Nướng tươi mỗi ngày bởi đầu bếp giàu kinh nghiệm' },
  { icon: '🍰', title: 'Tráng Miệng Đặc Biệt', desc: 'Những tuyệt phẩm cho khoảnh khắc ngọt ngào' },
]

export default async function HomePage() {
  const supabase = await createClient()
  const { data: dbFeatured } = await supabase
    .from('foods')
    .select('*, category:food_categories(name)')
    .eq('is_featured', true)
    .eq('is_available', true)
    .is('deleted_at', null)
    .limit(6)

  const featured = (dbFeatured && dbFeatured.length > 0) ? dbFeatured : mockFeatured

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden luxury-gradient py-28 sm:py-36 lg:py-44">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[100px]" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold/[0.02] rounded-full blur-[120px]" />
        </div>

        <div className="relative page-container text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-gold/20 bg-gold/5 text-gold text-sm font-medium mb-8 animate-fade-in">
            <Star size={14} className="fill-gold" />
            <span className="tracking-wide">Premium Tea & Bakery</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold text-white tracking-tight text-balance mb-6 animate-fade-in-up">
            Nâng Tầm{' '}
            <span className="gold-gradient-text">Trải Nghiệm</span>
            <br />
            Thưởng Thức
          </h1>

          <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-12 text-balance animate-fade-in-up animate-stagger-1 font-light">
            Trà sữa thượng hạng pha chế từ nguyên liệu nhập khẩu.
            <br className="hidden sm:block" />
            Bánh ngọt tinh tế nướng tươi mỗi ngày.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animate-stagger-2">
            <Link
              href="/thuc-pham"
              className="btn-primary inline-flex items-center gap-2 text-base rounded-full px-8 py-4"
            >
              Khám phá thực đơn
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/gioi-thieu"
              className="btn-secondary inline-flex items-center gap-2 text-base rounded-full px-8 py-4 border-gold/30 text-gold/80 hover:bg-gold hover:text-white"
            >
              Về universaltea
            </Link>
          </div>

          <div className="flex items-center justify-center gap-10 sm:gap-16 mt-20 animate-fade-in-up animate-stagger-3">
            {[
              { value: '50+', label: 'Thức uống & bánh' },
              { value: '3000+', label: 'Khách hàng hài lòng' },
              { value: '4.9', label: 'Đánh giá' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-display font-bold text-gold">{stat.value}</div>
                <div className="text-xs sm:text-sm text-white/40 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-container py-20 sm:py-24">
        <div className="text-center mb-16">
          <div className="gold-line mx-auto mb-6" />
          <h2 className="section-heading mb-3">Tinh Hoa Từ Chúng Tôi</h2>
          <p className="section-subheading max-w-xl mx-auto">
            Ba giá trị cốt lõi tạo nên thương hiệu universaltea
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((cat, idx) => (
            <div
              key={cat.title}
              className="text-center p-8 rounded-2xl border border-border-subtle bg-white hover:shadow-luxury hover:-translate-y-2 transition-all duration-500 ease-luxury animate-fade-in-up"
              style={{ animationDelay: `${idx * 0.15}s` }}
            >
              <div className="text-4xl mb-5">{cat.icon}</div>
              <h3 className="font-display font-bold text-primary text-lg mb-3">{cat.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{cat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <div className="page-container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="gold-line mb-4" />
              <h2 className="section-heading">Được Yêu Thích</h2>
              <p className="section-subheading">Những món đặc trưng của universaltea</p>
            </div>
            <Link
              href="/thuc-pham"
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-gold hover:gap-3 transition-all duration-300 cursor-pointer"
            >
              Xem tất cả
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(featured as unknown as Food[]).map((food, idx) => (
              <div
                key={food.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <FoodCard food={food} />
              </div>
            ))}
          </div>

          <div className="sm:hidden mt-8 text-center">
            <Link href="/thuc-pham" className="btn-secondary text-sm rounded-full px-6">
              Xem tất cả thực đơn
            </Link>
          </div>
        </div>
      </section>

      <section className="page-container py-20 sm:py-24">
        <div className="luxury-gradient rounded-3xl p-10 sm:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-[300px] h-[300px] bg-gold/5 rounded-full blur-[80px]" />
            <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] bg-gold/5 rounded-full blur-[80px]" />
          </div>
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
              Đặt Hàng Ngay Hôm Nay
            </h2>
            <p className="text-white/50 mb-8 max-w-md mx-auto">
              Trải nghiệm hương vị thượng hạng được giao tận nơi
            </p>
            <Link
              href="/thuc-pham"
              className="btn-primary inline-flex items-center gap-2 rounded-full px-8 py-4 text-base"
            >
              Xem thực đơn
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
