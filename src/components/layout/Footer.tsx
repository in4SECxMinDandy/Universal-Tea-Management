import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="mt-auto bg-primary text-white/80">
      <div className="page-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
                <span className="text-white font-display font-bold text-sm">U</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-display font-bold text-white leading-tight">UniTEA</span>
                <span className="text-[9px] uppercase tracking-[0.2em] text-gold font-medium leading-tight">Tea & Bakery</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-white/60">
              Trà sữa thượng hạng & bánh ngọt tinh tế.
              <br />Nâng tầm trải nghiệm thưởng thức mỗi ngày.
            </p>
            <div className="gold-line" />
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-gold uppercase tracking-[0.15em]">
              Khám phá
            </h4>
            <nav className="flex flex-col gap-3">
              {[
                { href: '/', label: 'Trang chủ' },
                { href: '/gioi-thieu', label: 'Câu chuyện thương hiệu' },
                { href: '/thuc-pham', label: 'Thực đơn' },
                { href: '/login', label: 'Đăng nhập' },
              ].map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-white/50 hover:text-gold cursor-pointer transition-colors duration-300 inline-flex items-center gap-1.5 group"
                >
                  {link.label}
                  <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0.5" />
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-gold uppercase tracking-[0.15em]">
              Liên hệ
            </h4>
            <p className="text-sm text-white/50">
              Hỗ trợ 24/7 qua chat trực tuyến
            </p>
            <p className="text-sm text-white/50">
              Quét mã QR tại cửa hàng để bắt đầu đặt hàng
            </p>
            <div className="flex items-center gap-2 text-xs text-gold/60 pt-2">
              <span className="w-1 h-1 bg-gold rounded-full" />
              <span>Chế biến từ nguyên liệu cao cấp</span>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} UniTEA. All rights reserved.
          </p>
          <p className="text-xs text-white/30 font-display italic">
            Crafted with passion for tea & pastry lovers
          </p>
        </div>
      </div>
    </footer>
  )
}
