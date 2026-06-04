/**
 * Server-only loader for the database-admin server functions.
 *
 * Mirrors the convention used by `src/shared/lib/db/load.ts`: this file is
 * imported statically by `db-admin.fn.ts`, but its body only declares an
 * async function — so the heavy server modules (postgres, node:crypto,
 * filesystem) are never pulled into the client bundle.
 *
 * Never import this from client-side code.
 */
export async function loadDbAdminServer() {
  const nodeCrypto = 'node:crypto'
  const [
    crypto,
    authorize,
    authServer,
    dbModule,
    auditStore,
    configStore,
    connectionTester,
    cryptoModule,
    migrationRunner,
  ] = await Promise.all([
    import(/* @vite-ignore */ nodeCrypto),
    import('@/shared/lib/auth/authorize'),
    import('@/shared/lib/auth/server'),
    import('@/shared/lib/db/index'),
    import('../server/audit-store'),
    import('../server/config-store'),
    import('../server/connection-tester'),
    import('../server/crypto'),
    import('../server/migration-runner'),
  ])
  return {
    randomUUID: crypto.randomUUID as () => string,
    requireSuperAdmin: authorize.requireSuperAdmin,
    requireAuthUser: authServer.requireAuthUser,
    invalidateDb: dbModule.invalidateDb,
    appendAuditEntry: auditStore.appendAuditEntry,
    readAuditStore: auditStore.readAuditStore,
    composeConnectionUrl: configStore.composeConnectionUrl,
    encryptProfileSensitiveFields: configStore.encryptProfileSensitiveFields,
    readDbConfigStore: configStore.readDbConfigStore,
    writeDbConfigStore: configStore.writeDbConfigStore,
    testDatabaseConnection: connectionTester.testDatabaseConnection,
    isEncryptionAvailable: cryptoModule.isEncryptionAvailable,
    listMigrationStatus: migrationRunner.listMigrationStatus,
    runMigrations: migrationRunner.runMigrations,
  }
}
