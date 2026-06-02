import { z } from 'zod'

export const starterUpdatesSubscriptionSchema = z.object({
  email: z.string().trim().email().max(254),
})

export type StarterUpdatesSubscriptionInput = z.infer<typeof starterUpdatesSubscriptionSchema>

export type StarterUpdatesSubscriptionResult = {
  status: 'subscribed' | 'already-subscribed'
  email: string
}
