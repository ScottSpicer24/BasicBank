import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Register from '../pages/Register/Register'

const mockRegister = vi.fn()
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ register: mockRegister }),
}))

function renderRegister() {
  return render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>,
  )
}

describe('Register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders name, email, password fields and submit button', () => {
    renderRegister()
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument()
  })

  it('has a link to login page', () => {
    renderRegister()
    const link = screen.getByRole('link', { name: /login/i })
    expect(link).toHaveAttribute('href', '/login')
  })

  it('calls register and navigates to /login on success', async () => {
    mockRegister.mockResolvedValueOnce({})
    const user = userEvent.setup()
    renderRegister()

    await user.type(screen.getByLabelText(/name/i), 'Jane Doe')
    await user.type(screen.getByLabelText(/email/i), 'jane@example.com')
    await user.type(screen.getByLabelText(/password/i), 'secret123')
    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('Jane Doe', 'jane@example.com', 'secret123')
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })

  it('shows error message on failed registration', async () => {
    mockRegister.mockRejectedValueOnce({
      response: { data: { detail: 'Email already registered' } },
    })
    const user = userEvent.setup()
    renderRegister()

    await user.type(screen.getByLabelText(/name/i), 'Jane Doe')
    await user.type(screen.getByLabelText(/email/i), 'taken@example.com')
    await user.type(screen.getByLabelText(/password/i), 'secret123')
    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText('Email already registered')).toBeInTheDocument()
    })
  })

  it('disables submit button while loading', async () => {
    let resolve
    mockRegister.mockReturnValueOnce(new Promise((r) => { resolve = r }))
    const user = userEvent.setup()
    renderRegister()

    await user.type(screen.getByLabelText(/name/i), 'X')
    await user.type(screen.getByLabelText(/email/i), 'x@y.com')
    await user.type(screen.getByLabelText(/password/i), 'pass')
    await user.click(screen.getByRole('button', { name: /register/i }))

    expect(screen.getByRole('button', { name: /registering/i })).toBeDisabled()
    resolve({})
  })
})
