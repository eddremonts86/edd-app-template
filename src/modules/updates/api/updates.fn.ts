import { createServerFn } from '@tanstack/react-start'
import { starterUpdatesSubscriptionSchema, type StarterUpdatesSubscriptionResult } from '../model'

const subscribedEmails = new Set<string>()

export const subscribeToStarterUpdatesFn = createServerFn({ method: 'POST' })
  .inputValidator(starterUpdatesSubscriptionSchema)
  .handler(async ({ data }): Promise<StarterUpdatesSubscriptionResult> => {
    const email = data.email.trim().toLowerCase()

    if (subscribedEmails.has(email)) {
      return {
        status: 'already-subscribed',
        email,
      }
    }

    subscribedEmails.add(email)

    return {
      status: 'subscribed',
      email,
    }
  })
