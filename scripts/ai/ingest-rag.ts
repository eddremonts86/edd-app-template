/**
 * RAG ingestion script for edd-app-template.
 * Indexes users data into ChromaDB for AI context.
 * Extend with your app-specific data as needed.
 */
import { getDb } from '@/shared/lib/db'
import { users } from '@/shared/lib/db/schema'

async function main() {
  const db = getDb()
  const allUsers = await db.select({ id: users.id, name: users.name, email: users.email }).from(users)

  console.log(`Ingesting ${allUsers.length} users into RAG index...`)
  // TODO: inject into ChromaDB via your AI ingestion pipeline
  console.log('Ingestion placeholder complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
