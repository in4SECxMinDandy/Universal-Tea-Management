import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import React from 'react'
import FoodCard from './FoodCard'

// Mock next/image
vi.mock('next/image', () => ({
  default: function MockImage(props: {
    src: string
    alt: string
    fill?: boolean
    sizes?: string
    className?: string
  }) {
    return React.createElement('img', {
      'data-testid': 'mock-image',
      src: props.src,
      alt: props.alt,
    })
  }
}))

const mockFood = {
  id: '1',
  name: 'Trà sữa truyền thống',
  slug: 'tra-sua-truyen-thong',
  price: 25000,
  image_url: 'https://example.com/image.jpg',
  is_available: true,
  is_featured: false,
  category: {
    id: '1',
    name: 'Trà sữa',
    slug: 'tra-sua',
  },
}

describe('FoodCard', () => {
  it('hiển thị thông tin thực phẩm', () => {
    render(<FoodCard food={mockFood} />)
    
    expect(screen.getByText('Trà sữa truyền thống')).toBeInTheDocument()
    expect(screen.getByText('Trà sữa')).toBeInTheDocument()
  })

  it('hiển thị giá tiền', () => {
    render(<FoodCard food={mockFood} />)
    
    expect(screen.getByText(/25\.000\s*/)).toBeInTheDocument()
  })

  it('hiển thị trạng thái còn hàng', () => {
    render(<FoodCard food={mockFood} />)
    
    expect(screen.getByText('Còn hàng')).toBeInTheDocument()
  })

  it('hiển thị trạng thái hết hàng', () => {
    const unavailableFood = { ...mockFood, is_available: false }
    render(<FoodCard food={unavailableFood} />)
    
    expect(screen.getByText('Vui lòng quay lại sau')).toBeInTheDocument()
  })

  it('hiển thị badge nổi bật', () => {
    const featuredFood = { ...mockFood, is_featured: true }
    render(<FoodCard food={featuredFood} />)
    
    expect(screen.getByText('Nổi bật')).toBeInTheDocument()
  })

  it('hiển thị placeholder khi không có hình', () => {
    const noImageFood = { ...mockFood, image_url: null }
    render(<FoodCard food={noImageFood} />)
    
    expect(screen.getByText('Không có hình')).toBeInTheDocument()
  })
})
