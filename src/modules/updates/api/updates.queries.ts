import { useTQMutation } from '@/shared/lib/query'
import {
  type StarterUpdatesSubscriptionInput,
  type StarterUpdatesSubscriptionResult,
} from '../model'
import { subscribeToStarterUpdatesFn } from './updates.fn'

export function useStarterUpdatesSubscriptionMutation() {
  return useTQMutation<
    StarterUpdatesSubscriptionResult,
    Error,
    StarterUpdatesSubscriptionInput,
    unknown
  >(['updates', 'subscribe'], (data) => subscribeToStarterUpdatesFn({ data }), {
    showSuccessToast: false,
  })
}
