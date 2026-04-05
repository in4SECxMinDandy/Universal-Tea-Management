import { UtensilsCrossed, Heart, Star, Truck } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="page-container-narrow py-12 sm:py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/5 mb-6">
          <UtensilsCrossed size={28} className="text-primary" />
        </div>
        <h1 className="section-heading mb-3">Về UniTEA</h1>
        <p className="text-text-secondary max-w-2xl mx-auto text-balance">
          Chúng tôi mang đến trải nghiệm ẩm thực tuyệt vời ngay tại nhà bạn —
          với chất lượng hàng đầu và dịch vụ tận tâm.
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {[
          {
            icon: Heart,
            title: 'Chất lượng tuyệt đối',
            desc: 'Mỗi món ăn đều được chọn lọc kỹ lưỡng từ nguyên liệu tươi ngon nhất.',
          },
          {
            icon: Star,
            title: 'Đội ngũ chuyên nghiệp',
            desc: 'Đầu bếp giàu kinh nghiệm và nhân viên phục vụ tận tâm.',
          },
          {
            icon: Truck,
            title: 'Giao hàng nhanh chóng',
            desc: 'Hệ thống giao hàng hiện đại, đảm bảo món ăn đến tay bạn còn nóng hổi.',
          },
        ].map((item) => (
          <div key={item.title} className="card-base p-6 text-center card-hover">
            <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center mx-auto mb-4">
              <item.icon size={22} className="text-primary" />
            </div>
            <h3 className="font-semibold text-primary mb-2">{item.title}</h3>
            <p className="text-sm text-text-secondary">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Story */}
      <div className="card-base p-8 sm:p-10">
        <h2 className="text-xl font-bold text-primary mb-4">Câu chuyện của chúng tôi</h2>
        <div className="space-y-4 text-text-secondary text-sm leading-relaxed">
          <p>
            Chào mừng bạn đến với <strong className="text-primary">UniTEA</strong> — cửa hàng đồ ăn ngon hàng đầu.
            Chúng tôi cung cấp các món ăn đa dạng, từ cơm, phở đến nước uống và tráng miệng,
            đảm bảo chất lượng và giá cả hợp lý.
          </p>
          <p>
            Với sứ mệnh mang đến trải nghiệm ẩm thực tuyệt vời, chúng tôi không ngừng cải thiện
            chất lượng sản phẩm và dịch vụ. Đặt hàng trực tuyến dễ dàng qua ứng dụng của chúng tôi
            và nhận hàng tận nơi trong thời gian nhanh nhất.
          </p>
          <p>
            Cảm ơn bạn đã tin tưởng và đồng hành cùng <strong className="text-primary">UniTEA</strong>.
            Sự hài lòng của bạn là thành công của chúng tôi.
          </p>
        </div>
      </div>
    </div>
  )
}
