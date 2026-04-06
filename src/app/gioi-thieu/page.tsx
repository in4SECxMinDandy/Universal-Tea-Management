import { Heart, Award, Truck, Leaf, Star, Users, Clock } from 'lucide-react'

const milestones = [
  { year: '2021', title: 'Khởi đầu', desc: 'universaltea ra đời tại Sài Gòn với cửa hàng đầu tiên' },
  { year: '2022', title: 'Mở rộng', desc: 'Thêm dòng bánh ngọt cao cấp và mở chi nhánh thứ 2' },
  { year: '2023', title: 'Công nghệ', desc: 'Ra mắt hệ thống đặt hàng trực tuyến thông minh' },
  { year: '2024', title: 'Khẳng định', desc: 'Đạt 3000+ khách hàng thân thiết, đánh giá 4.9 sao' },
]

const values = [
  {
    icon: Leaf,
    title: 'Nguyên Liệu Thượng Hạng',
    desc: 'Trà oolong từ Đài Loan, matcha Uji từ Nhật Bản, bơ Échiré từ Pháp — chúng tôi chỉ sử dụng những nguyên liệu tốt nhất.',
  },
  {
    icon: Award,
    title: 'Nghệ Nhân Pha Chế',
    desc: 'Đội ngũ barista được đào tạo chuyên sâu, mỗi ly trà sữa là một tác phẩm pha chế đậm chất nghệ thuật.',
  },
  {
    icon: Heart,
    title: 'Tâm Huyết Từng Chi Tiết',
    desc: 'Từ ly trà sữa đến chiếc bánh croissant, mỗi sản ph���m đều được hoàn thiện với sự chỉn chu tuyệt đối.',
  },
  {
    icon: Truck,
    title: 'Giao Hàng Tận Tâm',
    desc: 'Hệ thống giao hàng nhanh chóng, đảm bảo mỗi sản phẩm đến tay bạn trong trạng thái hoàn hảo nhất.',
  },
]

const stats = [
  { icon: Star, value: '4.9', label: 'Đánh giá trung bình' },
  { icon: Users, value: '3,000+', label: 'Khách hàng thân thiết' },
  { icon: Clock, value: '15 phút', label: 'Thời gian giao hàng TB' },
  { icon: Award, value: '50+', label: 'Món trong thực đơn' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden luxury-gradient py-24 sm:py-32">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[400px] h-[400px] bg-gold/5 rounded-full blur-[100px]" />
          <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-gold/5 rounded-full blur-[100px]" />
        </div>
        <div className="relative page-container text-center">
          <div className="gold-line mx-auto mb-8" />
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white tracking-tight mb-6 animate-fade-in-up">
            Câu Chuyện <span className="gold-gradient-text">universaltea</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto text-balance animate-fade-in-up animate-stagger-1 font-light">
            Nơi nghệ thuật pha trà gặp gỡ tinh hoa bánh ngọt,
            tạo nên trải nghiệm thưởng thức đẳng cấp.
          </p>
        </div>
      </section>

      <section className="page-container py-20 sm:py-24">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="gold-line mx-auto mb-6" />
          <h2 className="section-heading mb-6">Triết Lý Của Chúng Tôi</h2>
          <p className="text-text-secondary leading-relaxed text-lg">
            universaltea được sinh ra từ niềm đam mê mãnh liệt với trà và bánh ngọt.
            Chúng tôi tin rằng mỗi ly trà sữa, mỗi chiếc bánh không chỉ đơn giản
            là thức uống hay món ăn — đó là những trải nghiệm đáng nhớ, những khoảnh khắc
            ngọt ngào được tạo nên bằng sự tận tâm và chất lượng không thỏa hiệp.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {values.map((item, idx) => (
            <div
              key={item.title}
              className="group p-8 rounded-2xl border border-border-subtle bg-white hover:shadow-luxury hover:border-gold/20 transition-all duration-500 ease-luxury animate-fade-in-up"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold/10 to-gold/5 flex items-center justify-center mb-5 group-hover:from-gold/20 group-hover:to-gold/10 transition-all duration-500">
                <item.icon size={24} className="text-gold" />
              </div>
              <h3 className="font-display font-bold text-primary text-xl mb-3">{item.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <div className="page-container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div
                key={stat.label}
                className="text-center animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mx-auto mb-4">
                  <stat.icon size={20} className="text-gold" />
                </div>
                <div className="text-3xl font-display font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-text-secondary">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-container py-20 sm:py-24">
        <div className="text-center mb-16">
          <div className="gold-line mx-auto mb-6" />
          <h2 className="section-heading mb-3">Hành Trình Phát Triển</h2>
          <p className="section-subheading">Từ cửa hàng nhỏ đến thương hiệu được yêu thích</p>
        </div>

        <div className="max-w-2xl mx-auto">
          {milestones.map((item, idx) => (
            <div
              key={item.year}
              className="flex gap-6 mb-8 last:mb-0 animate-fade-in-up"
              style={{ animationDelay: `${idx * 0.15}s` }}
            >
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-display font-bold text-sm">{item.year}</span>
                </div>
                {idx < milestones.length - 1 && (
                  <div className="w-px h-full bg-gold/20 mt-3" />
                )}
              </div>
              <div className="pb-8">
                <h3 className="font-display font-bold text-primary text-lg mb-1">{item.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="page-container pb-20 sm:pb-24">
        <div className="luxury-gradient rounded-3xl p-10 sm:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-[300px] h-[300px] bg-gold/5 rounded-full blur-[80px]" />
          </div>
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
              Sẵn Sàng Trải Nghiệm?
            </h2>
            <p className="text-white/50 mb-8 max-w-md mx-auto">
              Khám phá thực đơn phong phú của universaltea ngay hôm nay
            </p>
            <a
              href="/thuc-pham"
              className="btn-primary inline-flex items-center gap-2 rounded-full px-8 py-4 text-base"
            >
              Xem thực đơn
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
