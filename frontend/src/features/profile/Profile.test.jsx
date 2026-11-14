import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test/renderWithProviders'
import Profile from './Profile'

describe('Profile', () => {
  it('prefills the profile, omits blank passwords, and saves the details', async () => {
    const updateProfile = vi.fn().mockResolvedValue({})
    renderWithProviders(<Profile />, { auth: { updateProfile } })

    expect(screen.getByLabelText('Full Name')).toHaveValue('Jan Niño')
    expect(screen.getByLabelText('Email')).toHaveValue('jan.nino@school.edu')

    fireEvent.change(screen.getByLabelText('Year & Section'), {
      target: { value: 'BSIT 4A' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(updateProfile).toHaveBeenCalledTimes(1))
    expect(updateProfile).toHaveBeenCalledWith({
      name: 'Jan Niño',
      email: 'jan.nino@school.edu',
      student_id: '2023-00123',
      year_section: 'BSIT 4A',
    })
    expect(await screen.findByText('Profile updated.')).toBeInTheDocument()
  })
})
