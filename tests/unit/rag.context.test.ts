import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  injectDynamicContext,
  detectIntent,
  detectActionIntent,
  loadAppKnowledge,
  buildAppNavigationContext,
  buildActionInstructions,
} from '@/modules/ai/rag/context'

// This suite used to assert a different application — todos, transactions,
// categories, analytics, projects and a team page. None of those exist here,
// and the assistant was answering from that fiction: asked where to find
// contact messages it replied that the feature does not exist and listed six
// routes that return 404. The assertions below describe the routes this app
// actually serves.

vi.mock('@/shared/lib/db', () => {
  const mockSelect = {
    from: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    then: vi.fn((resolve) => resolve([])),
  }

  const mockDb = {
    select: vi.fn(() => mockSelect),
    $count: vi.fn().mockResolvedValue(0),
  }

  return { db: mockDb, getDb: vi.fn(() => mockDb) }
})

vi.mock('@/shared/lib/db/schema', () => ({
  users: { name: 'users' },
  contactMessages: { createdAt: 'created_at' },
}))

vi.mock('drizzle-orm', () => ({
  desc: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Intent Detection', () => {
  it('detects user intents in English and Spanish', () => {
    expect(detectIntent('how many users are there?')).toContain('users')
    expect(detectIntent('cuantos usuarios hay?')).toContain('users')
  })

  it('detects contact-message intents', () => {
    expect(detectIntent('show me the contact messages')).toContain('contactMessages')
    expect(detectIntent('tengo mensajes sin leer?')).toContain('contactMessages')
  })

  it('detects settings intents', () => {
    expect(detectIntent('how do I change the theme?')).toContain('settings')
    expect(detectIntent('quiero cambiar el idioma')).toContain('settings')
  })

  it('detects AI configuration intents', () => {
    expect(detectIntent('which model is active?')).toContain('ai')
    expect(detectIntent('cambiar el proveedor a minimax')).toContain('ai')
  })

  it('detects database intents', () => {
    expect(detectIntent('show the migrations')).toContain('database')
  })

  it('detects navigation intents', () => {
    expect(detectIntent('where can I find the users?')).toContain('navigation')
    expect(detectIntent('donde esta la configuracion?')).toContain('navigation')
  })

  it('detects several intents in one query', () => {
    const intents = detectIntent('where do I see users and contact messages?')
    expect(intents).toContain('users')
    expect(intents).toContain('contactMessages')
    expect(intents).toContain('navigation')
  })

  it('returns no intent for an unrelated query', () => {
    expect(detectIntent('tell me a joke')).toEqual([])
  })

  it('matches keywords as words, not substrings', () => {
    // "Copenhagen" contains "open"; it is not a navigation question.
    expect(detectIntent('what is the weather in Copenhagen?')).toEqual([])
  })
})

describe('injectDynamicContext', () => {
  it('includes the navigation for a user query', async () => {
    const context = await injectDynamicContext('Donde puedo ver los usuarios?', 'es')
    expect(context).toContain('/dashboard/users')
    expect(context).toContain('/dashboard')
  })

  it('includes the contact-messages route when asked about messages', async () => {
    const context = await injectDynamicContext('Where can I see contact messages?', 'en')
    expect(context).toContain('/dashboard/contact-messages')
  })

  it('points settings questions at the language and theme page', async () => {
    const context = await injectDynamicContext('How do I change the language?', 'en')
    expect(context).toContain('/dashboard/settings/system')
  })

  it('points AI questions at the AI configuration page', async () => {
    const context = await injectDynamicContext('Which AI model is configured?', 'en')
    expect(context).toContain('/dashboard/settings/ia_config')
  })

  it('never offers a route this app does not serve', async () => {
    const context = await injectDynamicContext('what can I do in this dashboard?', 'en')
    for (const gone of [
      '/dashboard/todos',
      '/dashboard/analytics',
      '/dashboard/projects',
      '/dashboard/team',
      '/dashboard/categories',
      '/dashboard/transactions',
    ]) {
      expect(context).not.toContain(gone)
    }
  })

  it('returns a string for an unrelated query', async () => {
    const context = await injectDynamicContext('tell me a joke', 'en')
    expect(typeof context).toBe('string')
  })
})

describe('App Knowledge Base', () => {
  it('loads', async () => {
    const knowledge = await loadAppKnowledge()
    expect(knowledge).not.toBeNull()
  })

  it('describes every dashboard route the app serves', async () => {
    const knowledge = await loadAppKnowledge()
    const urls = knowledge!.navigation.main
      .concat(knowledge!.navigation.secondary)
      .map((item) => item.url)

    for (const url of [
      '/dashboard',
      '/dashboard/users',
      '/dashboard/contact-messages',
      '/dashboard/help',
      '/dashboard/settings/system',
      '/dashboard/settings/ia_config',
      '/dashboard/admin/database',
    ]) {
      expect(urls).toContain(url)
    }
  })

  it('has a page entry for every navigation url', async () => {
    const knowledge = await loadAppKnowledge()
    const urls = knowledge!.navigation.main
      .concat(knowledge!.navigation.secondary)
      .map((item) => item.url)
      .filter((url): url is string => Boolean(url))

    for (const url of urls) {
      expect(Object.keys(knowledge!.pages)).toContain(url)
    }
  })

  it('answers where to find each section', async () => {
    const knowledge = await loadAppKnowledge()
    const answers = knowledge!.commonQuestions.whereToFind
    expect(answers.users).toContain('/dashboard/users')
    expect(answers.contactMessages).toContain('/dashboard/contact-messages')
    expect(answers.database).toContain('/dashboard/admin/database')
  })
})

describe('buildAppNavigationContext', () => {
  it('lists the real sections', async () => {
    const knowledge = await loadAppKnowledge()
    const context = buildAppNavigationContext(knowledge!, 'en')
    expect(context).toContain('Users')
    expect(context).toContain('Contact Messages')
    expect(context).toContain('/dashboard/users')
    expect(context).toContain('/dashboard/contact-messages')
  })

  it('builds a Spanish context too', async () => {
    const knowledge = await loadAppKnowledge()
    const context = buildAppNavigationContext(knowledge!, 'es')
    expect(context).toContain('/dashboard/users')
  })
})

describe('detectActionIntent', () => {
  it('detects create + user in Spanish', () => {
    expect(detectActionIntent('Crea un usuario llamado Ana')).toEqual({
      action: 'create',
      entity: 'user',
    })
  })

  it('detects create + user in English', () => {
    expect(detectActionIntent('add a new user called Ana')).toEqual({
      action: 'create',
      entity: 'user',
    })
  })

  it('detects delete + user', () => {
    expect(detectActionIntent('delete the user Ana')).toEqual({
      action: 'delete',
      entity: 'user',
    })
  })

  it('detects edit + user', () => {
    expect(detectActionIntent('edita el usuario Ana')).toEqual({
      action: 'edit',
      entity: 'user',
    })
  })

  it('returns null when there is no action', () => {
    expect(detectActionIntent('how many users are there?')).toBeNull()
  })

  it('returns null for an entity this app does not have', () => {
    expect(detectActionIntent('crea una tarea llamada Revisar docs')).toBeNull()
  })
})

describe('buildActionInstructions', () => {
  it('builds create instructions in English', () => {
    const result = buildActionInstructions({ action: 'create', entity: 'user' }, 'en')
    expect(result).toContain('[ACTION REQUIRED]')
    expect(result).toContain('CREATE')
    expect(result).toContain('user')
    expect(result).toContain('```action')
    expect(result).toContain('create_user')
    expect(result).toContain('language MUST be "action"')
  })

  it('builds create instructions in Spanish', () => {
    const result = buildActionInstructions({ action: 'create', entity: 'user' }, 'es')
    expect(result).toContain('usuario')
    expect(result).toContain('create_user')
  })

  it('builds delete instructions that warn the action is final', () => {
    const result = buildActionInstructions({ action: 'delete', entity: 'user' }, 'en')
    expect(result).toContain('DELETE')
    expect(result).toContain('delete_user')
    expect(result).toContain('cannot be undone')
  })

  it('builds edit instructions with a partial schema', () => {
    const result = buildActionInstructions({ action: 'edit', entity: 'user' }, 'en')
    expect(result).toContain('update_user')
    expect(result).toContain('ONLY include the fields that need to change')
  })
})
