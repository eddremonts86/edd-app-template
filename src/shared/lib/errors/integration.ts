/**
 * The one error an integration raises when it is asked to work without
 * configuration.
 *
 * Every integration resolves to `undefined` rather than throwing
 * (docs/architecture/integration-conventions.md §3.1). This exists for the
 * opt-in loud path — `requireX()` — used by apps that genuinely cannot function
 * without the provider, and by storage, where a silent fallback would let
 * uploads appear to work while the bytes went nowhere.
 *
 * It carries the module id so a handler can say which integration is missing
 * without pattern-matching on a message, and it never carries key material.
 */
export class IntegrationUnavailableError extends Error {
  constructor(
    readonly moduleId: string,
    message = `The "${moduleId}" integration is not configured`,
  ) {
    super(message)
    this.name = 'IntegrationUnavailableError'
  }
}
