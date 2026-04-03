import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg mb-2">UniTEA</h3>
            <p className="text-sm text-gray-500">Cửa hàng đồ ăn ngon — Giao tận nơi</p>
          </div>
          <div className="flex gap-6">
            <Link href="/" className="text-sm text-gray-500 hover:text-primary cursor-pointer transition-colors">Trang chủ</Link>
            <Link href="/gioi-thieu" className="text-sm text-gray-500 hover:text-primary cursor-pointer transition-colors">Giới thiệu</Link>
            <Link href="/thuc-pham" className="text-sm text-gray-500 hover:text-primary cursor-pointer transition-colors">Thực phẩm</Link>
          </div>
        </div>
        <div className="border-t mt-6 pt-6 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} UniTEA. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
