import { sql } from 'drizzle-orm'
import { loadDb } from './load'

type DbTx = Parameters<Awaited<ReturnType<typeof loadDb>>['transaction']>[0] extends (
  tx: infer T,
) => Promise<unknown>
  ? T
  : never

export async function withRls<T>(userId: string | null, run: (tx: DbTx) => Promise<T>): Promise<T> {
  const db = await loadDb()

  return db.transaction(async (tx) => {
    await tx.execute(sql`set local app.current_user_id = ${userId ?? ''}`)
    return run(tx as DbTx)
  })
}
