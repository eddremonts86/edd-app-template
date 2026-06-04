import type { Register } from '@tanstack/react-router'
import { createStartHandler, defaultStreamHandler } from '@tanstack/react-start/server'
import type { RequestHandler } from '@tanstack/react-start/server'
import { installDbAdminResolver } from '@/modules/database-admin/server/db-resolver-bridge.server'

// Install the database-admin override resolver at server startup.
// The function is guarded against double-installation so this is safe to call once per process.
installDbAdminResolver()

const fetch = createStartHandler(defaultStreamHandler)

export type ServerEntry = { fetch: RequestHandler<Register> }

export function createServerEntry(entry: ServerEntry): ServerEntry {
  return {
    async fetch(...args) {
      return await entry.fetch(...args)
    },
  }
}

export default createServerEntry({ fetch })
