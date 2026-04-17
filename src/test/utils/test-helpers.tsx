import { QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'

import { AuthProvider } from '@/contexts/AuthContext'
import { createQueryClient } from '@/lib/react-query/client'

export function renderWithQueryClient(ui: ReactElement) {
  const queryClient = createQueryClient()
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

export function renderWithAuth(
  ui: ReactElement,
  options: {
    initialUser?: Parameters<typeof AuthProvider>[0]['initialUser']
    initialAdmin?: boolean
  } = {}
) {
  return render(
    <AuthProvider initialUser={options.initialUser ?? null} initialAdmin={options.initialAdmin ?? false}>
      {ui}
    </AuthProvider>
  )
}

export function renderWithProviders(ui: ReactElement) {
  const queryClient = createQueryClient()

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{ui}</AuthProvider>
    </QueryClientProvider>
  )
}

export function createMockFile(name: string, bytes: number[], type: string) {
  return new File([new Uint8Array(bytes)], name, { type })
}
