import { render, screen } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Heavy module mocks (keep UI tests fast + client-only)
// ---------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_k: string, fallback?: string) => fallback ?? _k }),
}))

vi.mock('@tabler/icons-react', () => ({
  IconDatabase: () => <span data-testid="icon-database" />,
  IconAlertTriangle: () => <span data-testid="icon-alert" />,
  IconUsers: () => <span data-testid="icon-users" />,
  IconHistory: () => <span data-testid="icon-history" />,
  IconServer: () => <span data-testid="icon-server" />,
  IconList: () => <span data-testid="icon-list" />,
}))

vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
    <div role="alert" data-variant={variant}>
      {children}
    </div>
  ),
  AlertTitle: ({ children }: { children: React.ReactNode }) => <strong>{children}</strong>,
  AlertDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
    <span data-testid="badge" data-variant={variant}>
      {children}
    </span>
  ),
}))

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsList: ({ children }: { children: React.ReactNode }) => <div role="tablist">{children}</div>,
  TabsTrigger: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <button role="tab" data-value={value}>
      {children}
    </button>
  ),
  TabsContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/modules/database-admin/api/db-admin.queries', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/modules/database-admin/api/db-admin.queries')>()
  return {
    ...actual,
    useDbAdminStatus: vi.fn(),
    useDbProfiles: vi.fn(() => ({ data: [], isLoading: false, error: null })),
    useDbAuditLog: vi.fn(() => ({ data: [], isLoading: false })),
    useDbMigrations: vi.fn(() => ({ data: [], isLoading: false })),
    useSaveDbProfile: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
    useDeleteDbProfile: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
    useActivateDbProfile: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
    useTestDbConnection: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
    useDryRunDbMigrations: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
    useRunDbMigrations: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  }
})

vi.mock('@/modules/database-admin/ui/ProfilesTab', () => ({
  ProfilesTab: ({ encryptionAvailable }: { encryptionAvailable: boolean }) => (
    <div data-testid="profiles-tab" data-encryption={String(encryptionAvailable)} />
  ),
}))

vi.mock('@/modules/database-admin/ui/MigrationsTab', () => ({
  MigrationsTab: () => <div data-testid="migrations-tab" />,
}))

vi.mock('@/modules/database-admin/ui/AuditTab', () => ({
  AuditTab: () => <div data-testid="audit-tab" />,
}))

// ---------------------------------------------------------------------------
// Subject under test (loaded after mocks)
// ---------------------------------------------------------------------------

import type { Mock } from 'vitest'
import { useDbAdminStatus } from '@/modules/database-admin/api/db-admin.queries'
import { DatabaseAdminPage } from '@/modules/database-admin/ui/DatabaseAdminPage'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DatabaseAdminPage', () => {
  it('renders title', () => {
    ;(useDbAdminStatus as Mock).mockReturnValue({ data: null, isLoading: true })
    render(<DatabaseAdminPage />)
    expect(screen.getByText('Database administration')).toBeTruthy()
  })

  it('shows "Using .env DATABASE_URL" badge when no active profile', () => {
    ;(useDbAdminStatus as Mock).mockReturnValue({
      data: { encryptionAvailable: true, activeProfileId: null, profileCount: 0 },
      isLoading: false,
    })
    render(<DatabaseAdminPage />)
    expect(screen.getByText('Using .env DATABASE_URL')).toBeTruthy()
  })

  it('shows "Using override profile" badge when active profile set', () => {
    ;(useDbAdminStatus as Mock).mockReturnValue({
      data: { encryptionAvailable: true, activeProfileId: 'pid1', profileCount: 1 },
      isLoading: false,
    })
    render(<DatabaseAdminPage />)
    expect(screen.getByText('Using override profile')).toBeTruthy()
  })

  it('renders encryption missing alert when encryptionAvailable=false', () => {
    ;(useDbAdminStatus as Mock).mockReturnValue({
      data: { encryptionAvailable: false, activeProfileId: null, profileCount: 0 },
      isLoading: false,
    })
    render(<DatabaseAdminPage />)
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByText('Encryption secret missing')).toBeTruthy()
  })

  it('does NOT render alert when encryption is available', () => {
    ;(useDbAdminStatus as Mock).mockReturnValue({
      data: { encryptionAvailable: true, activeProfileId: null, profileCount: 0 },
      isLoading: false,
    })
    render(<DatabaseAdminPage />)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('renders the three tabs', () => {
    ;(useDbAdminStatus as Mock).mockReturnValue({
      data: { encryptionAvailable: true, activeProfileId: null, profileCount: 0 },
      isLoading: false,
    })
    render(<DatabaseAdminPage />)
    expect(screen.getByText('Profiles')).toBeTruthy()
    expect(screen.getByText('Migrations')).toBeTruthy()
    expect(screen.getByText('Audit log')).toBeTruthy()
  })
})
