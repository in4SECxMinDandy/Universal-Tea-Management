import Link from 'next/link'
import { ShoppingBag, Heart, ArrowRight } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border-subtle bg-surface-card">
      <div className="page-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <ShoppingBag size={16} className="text-white" />
              </div>
              <span className="text-lg font-bold text-primary">UniTEA</span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              Cửa hàng đồ ăn ngon — Giao tận nơi. Chất lượng tạo nên niềm tin.
            </p>
            <p className="text-xs text-text-muted">
              Đặt hàng dễ dàng, giao hàng nhanh chóng.
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-primary uppercase tracking-wider">
              Điều hướng
            </h4>
            <nav className="flex flex-col gap-2">
              <Link
                href="/"
                className="text-sm text-text-secondary hover:text-primary cursor-pointer transition-colors duration-150 inline-flex items-center gap-1 group"
              >
                Trang chủ
                <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
              </Link>
              <Link
                href="/gioi-thieu"
                className="text-sm text-text-secondary hover:text-primary cursor-pointer transition-colors duration-150 inline-flex items-center gap-1 group"
              >
                Giới thiệu
                <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
              </Link>
              <Link
                href="/thuc-pham"
                className="text-sm text-text-secondary hover:text-primary cursor-pointer transition-colors duration-150 inline-flex items-center gap-1 group"
              >
                Thực phẩm
                <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
              </Link>
              <Link
                href="/login"
                className="text-sm text-text-secondary hover:text-primary cursor-pointer transition-colors duration-150 inline-flex items-center gap-1 group"
              >
                Đăng nhập
                <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
              </Link>
            </nav>
          </div>

          {/* Contact info */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-primary uppercase tracking-wider">
              Liên hệ
            </h4>
            <p className="text-sm text-text-secondary">
              Hỗ trợ 24/7 qua chat trực tuyến
            </p>
            <p className="text-sm text-text-muted">
              Quét mã QR tại cửa hàng để bắt đầu
            </p>
            <div className="flex items-center gap-1.5 text-xs text-text-muted pt-1">
              <Heart size={12} className="text-accent-red fill-accent-red" />
              <span>Yêu thương từ UniTEA</span>
            </div>
          </div>
        </div>

        <div className="border-t border-border-subtle mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} UniTEA. All rights reserved.
          </p>
          <p className="text-xs text-text-muted">
            Made with care for Vietnamese food lovers
          </p>
        </div>
      </div>
    </footer>
  )
}
