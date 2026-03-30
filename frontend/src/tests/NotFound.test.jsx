import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NotFound from '../pages/NotFound/NotFound'

function renderNotFound() {
  return render(
    <MemoryRouter>
      <NotFound />
    </MemoryRouter>,
  )
}

describe('NotFound', () => {
  it('renders 404 heading', () => {
    renderNotFound()
    expect(screen.getByText('404')).toBeInTheDocument()
  })

  it('shows descriptive message', () => {
    renderNotFound()
    expect(screen.getByText(/doesn't exist/i)).toBeInTheDocument()
  })

  it('has a link back to /home', () => {
    renderNotFound()
    const link = screen.getByRole('link', { name: /go home/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/home')
  })
})
