import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import OrderForm from './OrderForm'

describe('OrderForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            success: true,
            order: {
              id: 'order-1',
              status: 'pending',
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      )
    )
  })

  it('asks anonymous users to sign in before ordering', () => {
    render(
      <OrderForm
        foodId="food-1"
        price={25000}
        isAvailable
        stockQuantity={10}
        userId={null}
      />
    )

    expect(screen.getByText(/đăng nhập để đặt hàng/i)).toBeInTheDocument()
  })

  it('submits a valid order and shows success feedback', async () => {
    const user = userEvent.setup()

    render(
      <OrderForm
        foodId="food-1"
        price={25000}
        isAvailable
        stockQuantity={10}
        userId="user-1"
      />
    )

    await user.click(screen.getByRole('button', { name: /xác nhận/i }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          food_id: 'food-1',
          quantity: 1,
          note: null,
        }),
      })
    })
    expect(screen.getByText(/đặt hàng thành công/i)).toBeInTheDocument()
  })

  it('shows a friendly stock message without logging an exception', async () => {
    const user = userEvent.setup()
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            error: 'Insufficient stock',
          }),
          {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      )
    )

    render(
      <OrderForm
        foodId="food-1"
        price={25000}
        isAvailable
        stockQuantity={10}
        userId="user-1"
      />
    )

    await user.click(screen.getByRole('button', { name: /xác nhận/i }))

    await waitFor(() => {
      expect(screen.getByText(/không còn đủ số lượng/i)).toBeInTheDocument()
    })
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })
})
