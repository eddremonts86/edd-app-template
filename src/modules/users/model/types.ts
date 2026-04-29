/**
 * Template User type — extend with app-specific fields in your derived app.
 */
export interface User {
  id: string
  name: string
  email: string
  avatar: string | null
  authUserId?: string | null
  createdAt: string
  updatedAt?: string
}
