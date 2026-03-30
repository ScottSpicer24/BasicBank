import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Home from '../pages/Home/Home'

const mockLogout = vi.fn()
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ logout: mockLogout, token: 'fake-token' }),
}))

const mockGet = vi.fn()
const mockPost = vi.fn()
const mockPut = vi.fn()

vi.mock('../api/api', () => ({
  API: {
    get: (...args) => mockGet(...args),
    post: (...args) => mockPost(...args),
    put: (...args) => mockPut(...args),
  },
}))

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  )
}

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGet.mockResolvedValue({ data: [] })
  })

  it('renders header with title and logout button', () => {
    renderHome()
    expect(screen.getByText('BasicBank')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument()
  })

  it('opens create account modal when button is clicked', async () => {
    const user = userEvent.setup()
    renderHome()

    expect(screen.queryByLabelText(/account type/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(screen.getByLabelText(/account type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/initial balance/i)).toBeInTheDocument()
  })

  it('shows empty state when no accounts exist', async () => {
    renderHome()
    await waitFor(() => {
      expect(screen.getByText(/no accounts yet/i)).toBeInTheDocument()
    })
  })

  it('calls logout and navigates to /login', async () => {
    mockLogout.mockResolvedValueOnce()
    const user = userEvent.setup()
    renderHome()

    await user.click(screen.getByRole('button', { name: /logout/i }))

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })

  it('creates a new account via modal and closes modal on success', async () => {
    mockGet
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [{ account_id: 'acc123' }] })
      .mockResolvedValueOnce({ data: { balance: 100, account_type: 'checking', user_id: 'u1' } })
    mockPost.mockResolvedValueOnce({
      data: { account_id: 'acc123', message: 'Account created successfully' },
    })

    const user = userEvent.setup()
    renderHome()

    await user.click(screen.getByRole('button', { name: /create account/i }))
    await user.type(screen.getByLabelText(/initial balance/i), '100')
    await user.click(screen.getByRole('button', { name: /^create account$/i }))

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/api/accounts/', {
        balance: 100,
        account_type: 'checking',
      })
    })

    await waitFor(() => {
      expect(screen.queryByLabelText(/initial balance/i)).not.toBeInTheDocument()
    })
  })

  it('fetches and displays existing accounts on mount', async () => {
    mockGet
      .mockResolvedValueOnce({ data: [{ account_id: 'id1' }, { account_id: 'id2' }] })
      .mockResolvedValueOnce({ data: { balance: 500, account_type: 'savings', user_id: 'u1' } })
      .mockResolvedValueOnce({ data: { balance: 200, account_type: 'checking', user_id: 'u1' } })

    renderHome()

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/api/accounts/')
      expect(mockGet).toHaveBeenCalledWith('/api/accounts/id1')
      expect(mockGet).toHaveBeenCalledWith('/api/accounts/id2')
    })

    await waitFor(() => {
      expect(screen.getByText('savings')).toBeInTheDocument()
      expect(screen.getByText('$500.00')).toBeInTheDocument()
      expect(screen.getByText('checking')).toBeInTheDocument()
      expect(screen.getByText('$200.00')).toBeInTheDocument()
    })
  })
})
