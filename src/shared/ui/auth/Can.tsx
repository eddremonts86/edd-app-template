import * as React from 'react'
import { useAppAuth } from '@/shared/lib/auth/app-auth'
import { hasPermissionForRole } from '@/shared/lib/auth/permission-map'

interface CanProps {
  permission?: string
  anyOf?: string[]
  allOf?: string[]
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function Can({ permission, anyOf, allOf, fallback = null, children }: Readonly<CanProps>) {
  const auth = useAppAuth()

  if (!auth.isLoaded || !auth.user) return <>{fallback}</>

  const role = auth.user.role
  const checks: boolean[] = []

  if (permission) {
    checks.push(hasPermissionForRole(role, permission))
  }

  if (anyOf && anyOf.length > 0) {
    checks.push(anyOf.some((candidate) => hasPermissionForRole(role, candidate)))
  }

  if (allOf && allOf.length > 0) {
    checks.push(allOf.every((candidate) => hasPermissionForRole(role, candidate)))
  }

  if (checks.length === 0) return <>{children}</>
  return checks.every(Boolean) ? <>{children}</> : <>{fallback}</>
}
