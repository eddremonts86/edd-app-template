/**
 * Applies all correct translations:
 * 1. Adds 48 "orphan" keys from es/dk to en/common.json
 * 2. Replaces English placeholders in es/common.json with proper Spanish
 * 3. Replaces English placeholders in dk/common.json with proper Danish
 *
 * Usage: tsx scripts/i18n/apply-translations.ts
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const LOCALES = resolve('src/shared/lib/i18n/locales')

type Json = string | number | boolean | null | JsonObj | Json[]
interface JsonObj {
  [k: string]: Json
}

function load(p: string): JsonObj {
  return JSON.parse(readFileSync(p, 'utf-8')) as JsonObj
}
function save(p: string, d: JsonObj) {
  writeFileSync(p, `${JSON.stringify(d, null, 2)}\n`, 'utf-8')
}

/** Set a dot-notation key deep inside an object, creating sub-objects as needed */
function setKey(obj: JsonObj, path: string, value: Json) {
  const parts = path.split('.')
  let cur: JsonObj = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i]
    if (cur[p] === undefined || typeof cur[p] !== 'object' || Array.isArray(cur[p])) {
      cur[p] = {}
    }
    cur = cur[p] as JsonObj
  }
  cur[parts[parts.length - 1]] = value
}

// ─── Patches ───────────────────────────────────────────────────────────────────

/** Keys to ADD to en/common.json (they were only in es/dk) */
const EN_ADDITIONS: Record<string, Json> = {
  // From es extras
  'projects.description': 'Manage your projects and teams.',
  'projects.create': 'Create Project',
  'projects.edit': 'Edit Project',
  'projects.delete': 'Delete Project',
  'projects.deleteConfirm': 'Are you sure you want to delete this project?',
  'projects.form.datesLabel': 'Dates',
  'projects.form.addNewUser': 'Add new user',
  'projects.types.internal': 'Internal',
  'projects.types.external': 'External',
  'projects.types.research': 'Research',
  'projects.types.maintenance': 'Maintenance',
  'projects.priorities.low': 'Low',
  'projects.priorities.medium': 'Medium',
  'projects.priorities.high': 'High',
  'projects.tabs.general': 'General',
  'projects.tabs.team': 'Team',
  'projects.roles.owner': 'Owner',
  'projects.roles.manager': 'Manager',
  'projects.roles.contributor': 'Contributor',
  'projects.roles.viewer': 'Viewer',
  'projects.toast.created': 'Project created successfully',
  'projects.toast.updated': 'Project updated successfully',
  'projects.toast.deleted': 'Project deleted successfully',
  'projects.error.fetch': 'Failed to load projects.',
  'projects.members.projectPlaceholder': 'Select project...',
  'projects.members.selectProjectFirst': 'Select a project first to view members.',
  'projects.members.noMembers': 'No members in this project.',
  'users.description': 'Manage platform users.',
  'users.create': 'New User',
  'users.edit': 'Edit User',
  'users.delete': 'Delete User',
  'users.form.generateAvatar': 'Generate avatar',
  'users.roles.admin': 'Administrator',
  'users.roles.user': 'User',
  'ai.chat.welcome': 'Hello! How can I help you today?',
  'ai.chat.clear': 'Clear chat',
  'ai.chat.stop': 'Stop generation',
  'todos.form.statusTesting': 'Testing',
  'todos.form.statusOnHold': 'On Hold',
  'todos.form.statusBlocked': 'Blocked',
  'todos.form.statusCancelled': 'Cancelled',
  // From dk extras
  'dashboard.stats.activeNowContext': '{{value}} {{context}}',
  'dashboard.recentTransactions': 'Recent transactions',
  'dashboard.recentSummary': 'You have made {{count}} sales this month.',
  'dashboard.table.customer': 'Customer',
  'dashboard.table.status': 'Status',
  'dashboard.table.date': 'Date',
  'dashboard.table.amount': 'Amount',
}

/** Full Spanish translations for es placeholder keys */
const ES_PATCHES: Record<string, Json> = {
  'common.none': 'Ninguno',
  'common.saving': 'Guardando...',
  'themeToggle.light': 'Tema claro',
  'themeToggle.dark': 'Tema oscuro',
  'themeToggle.system': 'Tema del sistema',
  'sidebar.main.dashboard': 'Panel',
  // Projects
  'projects.actions.new': 'Nuevo Proyecto',
  'projects.actions.edit': 'Editar Proyecto',
  'projects.actions.delete': 'Eliminar Proyecto',
  'projects.form.statusPlaceholder': 'Seleccionar estado',
  'projects.form.typePlaceholder': 'Seleccionar tipo',
  'projects.form.priorityPlaceholder': 'Seleccionar prioridad',
  'projects.form.departmentLabel': 'Departamento',
  'projects.form.departmentPlaceholder': 'Seleccionar departamento',
  'projects.form.tabs.general': 'General',
  'projects.form.tabs.team': 'Equipo',
  'projects.error.create': 'Error al crear el proyecto',
  'projects.members.registerDescription':
    'Crea un nuevo usuario y agrégalo al equipo del proyecto.',
  'projects.type.internal': 'Interno',
  'projects.type.external': 'Externo',
  'projects.type.research': 'Investigación',
  'projects.type.maintenance': 'Mantenimiento',
  'projects.priority.low': 'Baja',
  'projects.priority.medium': 'Media',
  'projects.priority.high': 'Alta',
  'projects.member.role': 'Rol',
  'projects.member.owner': 'Propietario',
  'projects.member.manager': 'Gestor',
  'projects.member.contributor': 'Colaborador',
  'projects.member.viewer': 'Observador',
  'projects.member.add': 'Añadir miembro',
  'projects.member.remove': 'Eliminar miembro',
  'projects.member.updateRole': 'Actualizar rol',
  'projects.member.joinedAt': 'Se unió el',
  // Users
  'users.form.roleAdmin': 'Administrador',
  'users.form.roleSuperAdmin': 'Super Administrador',
  'users.form.avatarLabel': 'URL del avatar',
  'users.form.rolePlaceholder': 'Seleccionar rol',
  'users.form.avatarRandom': 'Aleatorio',
  'users.confirm.delete': '¿Estás seguro de que quieres eliminar este usuario?',
  'users.loadingMore': 'Sincronizando...',
  'users.loadMore': 'Cargar más usuarios',
  'users.error.title': 'Error de conexión',
  'users.error.description':
    'No pudimos sincronizar la lista de usuarios. Por favor, inténtalo de nuevo.',
  'users.error.retry': 'Reintentar',
  // Contact
  'contactMessages.table.email': 'Correo electrónico',
  // AI
  'ai.chat.send': 'Enviar',
  'ai.chat.typing': 'La IA está escribiendo...',
  'ai.chat.offline': 'Sin conexión. Conéctate para enviar mensajes.',
  'ai.chat.empty': 'Inicia la conversación con una pregunta.',
  'ai.chat.providers': 'Estado del proveedor',
  'ai.chat.thinking': 'Proceso de pensamiento',
  'ai.chat.dropFiles': 'Suelta archivos aquí para subir',
  'ai.chat.pressEnter': 'Pulsa Enter para enviar',
  'ai.chat.emptyDescription':
    '¿En qué puedo ayudarte hoy? Puedes preguntar sobre tus datos, configurar el panel o subir una imagen para analizar.',
  'ai.chat.assistantName': 'Asistente Inteligente',
  'ai.chat.supportAssistant': 'Asistente de Soporte',
  'ai.chat.agentInactive': 'El asistente no está disponible actualmente',
  'ai.chat.retry': 'Reintentar',
  'ai.chat.connectionError': 'Error de conexión con el servidor',
  'ai.chat.emptyResponse':
    'La IA devolvió una respuesta vacía. Intenta preguntar de nuevo o reformula tu pregunta.',
  'ai.chat.fileAutoInstruction':
    'Analiza el archivo adjunto. Si contiene una lista de tareas o elementos, crea una tarea para cada uno usando bloques de acción CREAR TAREA.',
  'ai.chat.fileAnalyzeInstruction':
    'Analiza el archivo adjunto y proporciona un resumen o acciones relevantes.',
  'ai.chat.conversations': 'Conversaciones',
  'ai.chat.newConversation': 'Nueva conversación',
  'ai.chat.deleteConversation': 'Eliminar conversación',
  'ai.chat.deleteAllConversations': 'Eliminar todo',
  'ai.chat.confirmDeleteConversation': '¿Estás seguro de que quieres eliminar esta conversación?',
  'ai.chat.confirmDeleteAll': '¿Estás seguro de que quieres eliminar todas las conversaciones?',
  'ai.chat.noConversations': 'Sin conversaciones aún',
  'ai.chat.today': 'Hoy',
  'ai.chat.yesterday': 'Ayer',
  'ai.chat.previousDays': 'Últimos 7 días',
  'ai.chat.older': 'Más antiguos',
  'ai.chat.untitledConversation': 'Nueva conversación',
  // Validation
  'validation.invalidColor': 'Color no válido',
  'validation.invalidDate': 'Fecha no válida',
  'validation.futureDate': 'La fecha debe ser en el futuro',
  'validation.minAmount': 'Debe ser mayor que 0',
  // Dashboard
  'dashboard.overview.contactByType.types.webapp': 'Aplicación web',
  'dashboard.title': 'Panel',
  'dashboard.description': 'Bienvenido a tu panel.',
  'dashboard.stats.netBalance': 'Saldo neto',
  'dashboard.stats.totalRevenue': 'Ingresos totales',
  'dashboard.stats.totalExpenses': 'Gastos totales',
  'dashboard.stats.pendingApproval': 'Pendiente de aprobación',
  'dashboard.stats.subscriptions': 'Suscripciones',
  'dashboard.stats.sales': 'Ventas',
  'dashboard.stats.activeNow': 'Activos ahora',
  'dashboard.stats.activeProjects': 'Proyectos activos',
  'dashboard.stats.change': '{{value}} respecto al mes anterior',
  'dashboard.recentTasks.title': 'Tareas recientes',
  'dashboard.recentTasks.description': 'La actividad más reciente de tu equipo.',
  'dashboard.workload.title': 'Carga de trabajo del equipo',
  'dashboard.workload.description': 'Distribución de tareas entre los miembros del equipo.',
  'dashboard.error.title': 'Error al cargar el panel',
  'dashboard.error.description':
    'No pudimos cargar los datos del panel. Por favor, inténtalo de nuevo más tarde.',
  'dashboard.upcomingTasks.title': 'Tareas próximas (próximos 7 días)',
  'dashboard.upcomingTasks.description': 'Tareas con vencimiento esta semana.',
  'dashboard.upcomingTasks.filterByResponsible': 'Responsable',
  'dashboard.upcomingTasks.noTasks': 'No hay tareas próximas para esta semana.',
  'dashboard.upcomingTasks.noFilteredResults':
    'No se encontraron tareas para los filtros seleccionados.',
  // Budgets
  'budgets.scopes.personal': 'Personal',
  'budgets.summary.balance': 'Saldo',
  'budgets.detail.balance': 'Saldo',
  'budgets.report.balance': 'Saldo',
  'budgets.recurrences.type': 'Tipo',
  'budgets.recurrences.typeExpense': 'Gasto',
  'budgets.recurrences.typeIncome': 'Ingreso',
  // Categories
  'categories.nameLabel': 'Nombre',
  'categories.namePlaceholder': 'Nombre de categoría',
  'categories.colorLabel': 'Color',
  'categories.save': 'Guardar categoría',
  'categories.summary': 'Mostrando {{shown}} de {{total}} categorías',
  // Settings
  'settings.title': 'Configuración',
  'settings.description': 'Administra tus preferencias del panel y configuración de la aplicación.',
  'settings.sections.interface': 'Configuración de interfaz',
  'settings.sections.development': 'Herramientas de desarrollo',
  'settings.language.title': 'Idioma',
  'settings.language.description':
    'Selecciona tu idioma de visualización preferido. Los cambios se aplican inmediatamente.',
  'settings.theme.title': 'Tema',
  'settings.theme.description': 'Elige tu esquema de color preferido para la interfaz.',
  'settings.devtools.title': 'Herramientas de desarrollador',
  'settings.devtools.description': 'Mostrar u ocultar TanStack DevTools en la interfaz.',
  'settings.devtools.show': 'Mostrar DevTools',
  'settings.devtools.showDescription': 'Mostrar panel TanStack DevTools para depuración.',
  'settings.actions.save': 'Guardar cambios',
  'settings.actions.reset': 'Restaurar valores predeterminados',
  'settings.actions.saving': 'Guardando...',
  'settings.messages.saved': 'Configuración guardada correctamente.',
  'settings.messages.reset': 'Configuración restaurada a los valores predeterminados.',
  'settings.messages.error': 'Error al guardar la configuración. Por favor, inténtalo de nuevo.',
  'settings.ai.title': 'Configuración de IA',
  'settings.ai.description':
    'Configura los parámetros del servicio de IA, incluyendo la URL base, el token de acceso y los endpoints.',
  'settings.ai.sections.status': 'Estado del sistema',
  'settings.ai.sections.configurations': 'Configuraciones',
  'settings.ai.sections.logs': 'Registros',
  'settings.ai.sections.statusDescription':
    'Comprueba la disponibilidad de tus modelos locales y remotos.',
  'settings.ai.sections.fallback': 'Prioridad de respaldo del sistema',
  'settings.ai.sections.connection': 'Detalles de conexión',
  'settings.ai.sections.parameters': 'Parámetros del modelo',
  'settings.ai.sections.endpoints': 'Configuración de endpoints',
  'settings.ai.tabs.system': 'Sistema',
  'settings.ai.tabs.ai': 'Configuración de IA',
  'settings.ai.fields.provider': 'Proveedor de IA',
  'settings.ai.fields.baseUrl': 'URL base',
  'settings.ai.fields.port': 'Puerto',
  'settings.ai.fields.token': 'Token de acceso (opcional)',
  'settings.ai.fields.apiKey': 'Clave API',
  'settings.ai.fields.model': 'ID de modelo',
  'settings.ai.fields.temperature': 'Temperatura',
  'settings.ai.fields.maxTokens': 'Tokens máximos',
  'settings.ai.fields.frequencyPenalty': 'Penalización de frecuencia',
  'settings.ai.fields.presencePenalty': 'Penalización de presencia',
  'settings.ai.fields.chatEndpoint': 'Endpoint de chat',
  'settings.ai.fields.modelsEndpoint': 'Endpoint de modelos',
  'settings.ai.fields.loadEndpoint': 'Endpoint de carga',
  'settings.ai.fields.downloadEndpoint': 'Endpoint de descarga',
  'settings.ai.fields.statusEndpoint': 'Endpoint de estado',
  'settings.ai.fields.timeout': 'Tiempo de espera (ms)',
  'settings.ai.fields.additionalParams': 'Parámetros adicionales (JSON)',
  'settings.ai.actions.save': 'Guardar configuración',
  'settings.ai.actions.reset': 'Restaurar valores predeterminados',
  'settings.ai.actions.test': 'Probar conexión',
  'settings.ai.actions.confirmReset':
    '¿Estás seguro de que quieres restablecer la configuración de IA a los valores predeterminados?',
  'settings.ai.messages.saved': 'Configuración de IA guardada correctamente.',
  'settings.ai.messages.reset': 'Configuración de IA restablecida.',
  'settings.ai.messages.testSuccess': 'Conexión con el servicio de IA establecida correctamente.',
  'settings.ai.messages.testError': 'Error al conectar con el servicio de IA.',
  'settings.ai.messages.checkingStatus': 'Comprobando el estado del servicio...',
  'settings.ai.messages.fallbackDescription':
    'El sistema intentará automáticamente el siguiente proveedor disponible si el activo falla.',
  'settings.ai.messages.active': 'Activo',
  'settings.ai.messages.noModels': 'No se encontraron modelos',
  'settings.ai.messages.modelsCount': '{{count}} modelos',
  // Analytics
  'analytics.title': 'Análisis',
  'analytics.pageViews': 'Vistas de página',
  'analytics.overview': 'Resumen',
  'analytics.placeholder': 'Gráfico de análisis próximamente...',
  'analytics.netBalance': 'Saldo neto',
  'analytics.netBalanceDesc': 'Ingresos menos gastos',
  'analytics.totalRevenue': 'Ingresos totales',
  'analytics.totalRevenueDesc': 'Total de ingresos aprobados',
  'analytics.totalExpenses': 'Gastos totales',
  'analytics.totalExpensesDesc': 'Total de gastos aprobados',
  'analytics.activeProjects': 'Proyectos activos',
  'analytics.activeProjectsDesc': 'Proyectos actualmente activos',
  'analytics.taskCompletion': 'Completitud de tareas',
  'analytics.tasks': 'tareas',
  'analytics.activeUsers': 'Usuarios activos',
  'analytics.activeUsersDesc': 'Total de usuarios registrados',
  'analytics.error': 'Error al cargar los KPIs',
  'analytics.searchPlaceholder': 'Buscar...',
  'analytics.export': 'Exportar',
  'analytics.last7Days': 'Últimos 7 días',
  'analytics.last30Days': 'Últimos 30 días',
  'analytics.last90Days': 'Últimos 90 días',
  'analytics.financialTrend.title': 'Tendencia financiera',
  'analytics.financialTrend.description': 'Ingresos y gastos en los últimos {{days}} días',
  'analytics.financialTrend.error': 'Error al cargar datos financieros',
  'analytics.financialTrend.income': 'Ingresos',
  'analytics.financialTrend.expenses': 'Gastos',
  'analytics.taskCompletionTrend.title': 'Tendencia de completitud de tareas',
  'analytics.taskCompletionTrend.description': 'Tareas completadas en los últimos {{days}} días',
  'analytics.taskCompletionTrend.label': 'Tareas completadas',
  'analytics.taskDistribution.byStatus': 'Tareas por estado',
  'analytics.taskDistribution.byStatusDesc': 'Distribución actual de tareas',
  'analytics.taskDistribution.byPriority': 'Tareas por prioridad',
  'analytics.taskDistribution.byPriorityDesc': 'Desglose por prioridad',
  'analytics.taskDistribution.label': 'Tareas',
  'analytics.taskDistribution.error': 'Error al cargar datos de tareas',
  'analytics.projectPerformance.title': 'Rendimiento de proyectos',
  'analytics.projectPerformance.description':
    'Resumen del progreso del proyecto y el uso del presupuesto',
  'analytics.projectPerformance.searchPlaceholder': 'Buscar proyectos...',
  'analytics.projectPerformance.columns.name': 'Nombre del proyecto',
  'analytics.projectPerformance.columns.status': 'Estado',
  'analytics.projectPerformance.columns.budget': 'Presupuesto utilizado',
  'analytics.projectPerformance.columns.completion': 'Completitud de tareas',
  'analytics.projectPerformance.columns.tasks': 'Tareas',
  'analytics.projectPerformance.status.active': 'Activo',
  'analytics.projectPerformance.status.completed': 'Completado',
  'analytics.projectPerformance.status.on_hold': 'En espera',
  // Section cards
  'sectionCards.totalRevenue.title': 'Ingresos totales',
  'sectionCards.totalRevenue.trend': 'Tendencia al alza este mes',
  'sectionCards.totalRevenue.detail': 'Visitantes en los últimos 6 meses',
  'sectionCards.newCustomers.title': 'Nuevos clientes',
  'sectionCards.newCustomers.trend': 'Bajó un 20% en este periodo',
  'sectionCards.newCustomers.detail': 'La adquisición necesita atención',
  'sectionCards.activeAccounts.title': 'Cuentas activas',
  'sectionCards.activeAccounts.trend': 'Retención de usuarios sólida',
  'sectionCards.activeAccounts.detail': 'El compromiso supera los objetivos',
  'sectionCards.growthRate.title': 'Tasa de crecimiento',
  'sectionCards.growthRate.trend': 'Aumento de rendimiento constante',
  'sectionCards.growthRate.detail': 'Cumple las proyecciones de crecimiento',
  // Chart
  'chart.timeRange.placeholder': 'Seleccionar un rango',
  'chart.timeRange.90d': 'Últimos 3 meses',
  'chart.timeRange.30d': 'Últimos 30 días',
  'chart.timeRange.7d': 'Últimos 7 días',
  // Transactions
  'transactions.title': 'Transacciones',
  'transactions.summary': 'Mostrando {{shown}} de {{total}} transacciones',
  'transactions.actions.add': 'Añadir transacción',
  'transactions.actions.save': 'Guardar transacción',
  'transactions.actions.edit': 'Editar',
  'transactions.actions.delete': 'Eliminar',
  'transactions.actions.create': 'Crear transacción',
  'transactions.form.customerNameLabel': 'Nombre del cliente',
  'transactions.form.customerNamePlaceholder': 'Nombre del cliente',
  'transactions.form.customerEmailLabel': 'Correo del cliente',
  'transactions.form.customerEmailPlaceholder': 'Correo del cliente',
  'transactions.form.statusLabel': 'Estado',
  'transactions.form.statusPlaceholder': 'Seleccionar estado',
  'transactions.form.statusApproved': 'Aprobado',
  'transactions.form.statusPending': 'Pendiente',
  'transactions.form.statusRejected': 'Rechazado',
  'transactions.form.amountLabel': 'Importe',
  'transactions.form.dateLabel': 'Fecha',
  'transactions.form.userLabel': 'Usuario',
  'transactions.form.userPlaceholder': 'Seleccionar usuario',
  'transactions.form.projectLabel': 'Proyecto',
  'transactions.form.projectPlaceholder': 'Seleccionar proyecto',
  'transactions.form.createDescription': 'Crea un nuevo registro de transacción.',
  'transactions.form.editDescription': 'Edita los detalles de la transacción.',
  'transactions.table.customer': 'Cliente',
  'transactions.table.status': 'Estado',
  'transactions.table.date': 'Fecha',
  'transactions.table.amount': 'Importe',
  'transactions.status.approved': 'Aprobado',
  'transactions.status.pending': 'Pendiente',
  'transactions.status.rejected': 'Rechazado',
  'transactions.confirm.delete': '¿Estás seguro de que quieres eliminar esta transacción?',
  'transactions.error.description': 'Ocurrió un error al cargar las transacciones.',
  'transactions.toast.created': 'Transacción creada correctamente',
  'transactions.toast.updated': 'Transacción actualizada correctamente',
  'transactions.toast.deleted': 'Transacción eliminada correctamente',
  'transactions.history': 'Historial de transacciones',
  'transactions.pending.title': 'Requiere tu aprobación',
  'transactions.pending.approveConfirm': '¿Estás seguro de que quieres aprobar esta transacción?',
  'transactions.pending.approveSuccess': 'Transacción aprobada correctamente',
  'transactions.pending.rejectPrompt': 'Por favor, proporciona una razón para el rechazo:',
  'transactions.pending.rejectSuccess': 'Transacción rechazada correctamente',
  'transactions.pending.approve': 'Aprobar',
  'transactions.pending.reject': 'Rechazar',
  // Home
  'home.hero.badge': 'MODULAR • TIPADO • PROBADO • ENV-FIRST',
  'home.footer.links.essence.title': 'Plantilla',
  // Keys that were in dk-extras but needed in es too
  'dashboard.stats.activeNowContext': '{{value}} {{context}}',
  'dashboard.recentTransactions': 'Transacciones recientes',
  'dashboard.recentSummary': 'Has realizado {{count}} ventas este mes.',
  'dashboard.table.customer': 'Cliente',
  'dashboard.table.status': 'Estado',
  'dashboard.table.date': 'Fecha',
  'dashboard.table.amount': 'Importe',
}

/** Full Danish translations for dk placeholder keys */
const DK_PATCHES: Record<string, Json> = {
  'nav.timeline': 'Køreplan',
  'common.filter': 'Filter',
  'common.stop': 'Stop',
  'common.send': 'Send',
  'common.pin': 'Fastgør',
  'common.unpin': 'Frigør',
  'common.pinVisible': 'Pin synlig',
  'common.none': 'Ingen',
  'common.saving': 'Gemmer...',
  'ai.chat.send': 'Send',
  'ai.chat.dropFiles': 'Slip filer her for at uploade',
  'ai.chat.pressEnter': 'Tryk Enter for at sende',
  'ai.chat.emptyDescription':
    'Hvordan kan jeg hjælpe dig i dag? Du kan stille spørgsmål om dine data, konfigurere dashboardet eller uploade et billede til analyse.',
  'ai.chat.assistantName': 'Smart Assistent',
  'settings.ai.sections.status': 'Systemstatus',
  'settings.ai.sections.configurations': 'Konfigurationer',
  'settings.ai.sections.statusDescription':
    'Kontrollér tilgængeligheden af dine lokale og fjernmodeller.',
  'settings.ai.sections.fallback': 'Systemets reserveprioritet',
  'settings.ai.tabs.system': 'System',
  'settings.ai.messages.checkingStatus': 'Kontrollerer servicestatus...',
  'settings.ai.messages.fallbackDescription':
    'Systemet vil automatisk prøve den næste tilgængelige udbyder, hvis den aktive fejler.',
  'settings.ai.messages.active': 'Aktiv',
  'settings.ai.messages.noModels': 'Ingen modeller fundet',
  'settings.ai.messages.modelsCount': '{{count}} modeller',
  'dashboard.overview.contactByType.types.webapp': 'Webapplikation',
  'dashboard.overview.providers.local': 'Lokal',
  'dashboard.title': 'Dashboard',
  'dashboard.description': 'Velkommen til dit dashboard.',
  'dashboard.recentTasks.title': 'Seneste opgaver',
  'dashboard.recentTasks.description': 'Dit teams seneste aktivitet.',
  'dashboard.workload.title': 'Teamets arbejdsbelastning',
  'dashboard.workload.description': 'Opgavefordeling på tværs af teammedlemmer.',
  'projects.form.teamEmpty': 'Ingen brugere fundet.',
  'projects.form.tabs.general': 'Generelt',
  'projects.form.tabs.team': 'Team',
  'projects.members.title': 'Teammedlemmer',
  'projects.members.description':
    'Administrer hvem der har adgang til dette projekt og deres roller.',
  'projects.members.add': 'Tilføj medlem',
  'projects.members.register': 'Registrer nyt medlem',
  'projects.members.registerDescription': 'Opret en ny bruger og tilføj dem til projektteamet.',
  'projects.members.searchUsers': 'Søg brugere...',
  'projects.members.searchMembers': 'Søg teammedlemmer...',
  'projects.members.noAvailableUsers': 'Ingen flere brugere tilgængelige.',
  'projects.members.empty': 'Ingen medlemmer i dette projekt.',
  'projects.members.success.added': 'Medlem tilføjet korrekt',
  'projects.members.success.updated': 'Rolle opdateret korrekt',
  'projects.members.success.removed': 'Medlem fjernet korrekt',
  'projects.member.role': 'Rolle',
  'projects.member.owner': 'Ejer',
  'projects.member.manager': 'Leder',
  'projects.member.contributor': 'Bidragyder',
  'projects.member.viewer': 'Tilskuer',
  'projects.member.add': 'Tilføj medlem',
  'projects.member.remove': 'Fjern medlem',
  'projects.member.updateRole': 'Opdater rolle',
  'projects.member.joinedAt': 'Tilsluttede sig den',
  'todos.form.projectLabel': 'Projekt',
  'todos.form.projectPlaceholder': 'Vælg projekt',
  'todos.form.complexityLabel': 'Kompleksitet',
  'todos.form.complexityPlaceholder': '1-10 (f.eks. 5)',
  'todos.form.estimatedTimeLabel': 'Estimeret tid',
  'todos.form.estimatedTimePlaceholder': 'Timer (f.eks. 4)',
  'todos.form.actualTimeLabel': 'Faktisk tid',
  'todos.form.actualTimePlaceholder': 'Timer (f.eks. 2)',
  'todos.form.acceptanceCriteriaLabel': 'Acceptkriterier',
  'todos.form.acceptanceCriteriaPlaceholder': 'F.eks.: Funktionen skal være tilgængelig...',
  'todos.form.dependenciesLabel': 'Afhængigheder',
  'todos.form.dependenciesPlaceholder': 'Vælg opgaver...',
  'todos.form.sections.general.title': 'Generelle oplysninger',
  'todos.form.sections.general.description':
    'Definer de grundlæggende aspekter af opgaven, så alle forstår, hvad det handler om.',
  'todos.form.sections.planning.title': 'Planlægning og timing',
  'todos.form.sections.planning.description':
    'Sæt deadlines og estimer den indsats, der kræves for at fuldføre arbejdet.',
  'todos.form.sections.assignment.title': 'Tildeling og kontekst',
  'todos.form.sections.assignment.description':
    'Placer opgaven inden for et projekt og tildel den til den ansvarlige.',
  'todos.form.sections.tracking.title': 'Sporing og relationer',
  'todos.form.sections.tracking.description':
    'Administrer den aktuelle status og link denne opgave med andre afhængigheder.',
  'users.form.roleHelp': 'Rollen definerer brugerens tilladelser.',
  'users.form.jobTitleLabel': 'Jobtitel',
  'users.form.jobTitlePlaceholder': 'f.eks. Senior Udvikler',
  'users.form.departmentLabel': 'Afdeling',
  'users.form.departmentPlaceholder': 'Vælg afdeling',
  'users.form.reportsToLabel': 'Rapporterer til',
  'users.form.reportsToPlaceholder': 'Vælg leder',
  'users.form.reportsToHelp': 'Den person, som denne bruger rapporterer direkte til.',
  'users.form.sections.account.title': 'Kontooplysninger',
  'users.form.sections.account.description':
    'Administrer grundlæggende brugerdata og identitet på platformen.',
  'users.form.sections.professional.title': 'Professionelle oplysninger',
  'users.form.sections.professional.description':
    'Definer brugerens rolle og jobtitel i organisationen.',
  'users.form.sections.organization.title': 'Organisationsstruktur',
  'users.form.sections.organization.description':
    'Placer brugeren i en afdeling og definer deres rapporteringslinje.',
  'users.table.jobTitle': 'Jobtitel',
  'users.table.department': 'Afdeling',
  'budgets.summary.balance': 'Saldo',
  'budgets.detail.balance': 'Saldo',
  'budgets.recurrences.type': 'Type',
  'home.hero.badge': 'MODULÆR • TYPET • TESTET • ENV-FIRST',
  // Keys that were in es-extras but needed in dk too
  'ai.chat.welcome': 'Hej! Hvordan kan jeg hjælpe dig i dag?',
  'ai.chat.clear': 'Ryd chat',
  'ai.chat.stop': 'Stop generering',
  'projects.form.datesLabel': 'Datoer',
  'projects.form.addNewUser': 'Tilføj ny bruger',
  'projects.members.projectPlaceholder': 'Vælg projekt...',
  'projects.members.selectProjectFirst': 'Vælg et projekt først for at se medlemmer.',
  'projects.members.noMembers': 'Ingen medlemmer i dette projekt.',
  'projects.error.fetch': 'Kunne ikke indlæse projekter.',
  'projects.description': 'Administrer dine projekter og teams.',
  'projects.create': 'Opret Projekt',
  'projects.edit': 'Rediger Projekt',
  'projects.delete': 'Slet Projekt',
  'projects.deleteConfirm': 'Er du sikker på, at du vil slette dette projekt?',
  'projects.types.internal': 'Intern',
  'projects.types.external': 'Ekstern',
  'projects.types.research': 'Forskning',
  'projects.types.maintenance': 'Vedligeholdelse',
  'projects.priorities.low': 'Lav',
  'projects.priorities.medium': 'Mellem',
  'projects.priorities.high': 'Høj',
  'projects.tabs.general': 'Generelt',
  'projects.tabs.team': 'Team',
  'projects.roles.owner': 'Ejer',
  'projects.roles.manager': 'Leder',
  'projects.roles.contributor': 'Bidragyder',
  'projects.roles.viewer': 'Tilskuer',
  'projects.toast.created': 'Projekt oprettet korrekt',
  'projects.toast.updated': 'Projekt opdateret korrekt',
  'projects.toast.deleted': 'Projekt slettet korrekt',
  'todos.form.statusTesting': 'Under test',
  'todos.form.statusOnHold': 'På hold',
  'todos.form.statusBlocked': 'Blokeret',
  'todos.form.statusCancelled': 'Annulleret',
  'users.form.generateAvatar': 'Generer avatar',
  'users.description': 'Administrer platformsbrugere.',
  'users.create': 'Ny Bruger',
  'users.edit': 'Rediger Bruger',
  'users.delete': 'Slet Bruger',
  'users.roles.admin': 'Administrator',
  'users.roles.user': 'Bruger',
}

// ─── Apply ──────────────────────────────────────────────────────────────────────

function applyPatch(data: JsonObj, patch: Record<string, Json>, label: string) {
  let count = 0
  for (const [key, value] of Object.entries(patch)) {
    setKey(data, key, value)
    count++
  }
  console.log(`  ✅  ${label}: applied ${count} translation(s)`)
  return count
}

function main() {
  console.log('\n🌐  Applying translations...\n')

  const enPath = `${LOCALES}/en/common.json`
  const esPath = `${LOCALES}/es/common.json`
  const dkPath = `${LOCALES}/dk/common.json`

  const en = load(enPath)
  const es = load(esPath)
  const dk = load(dkPath)

  // 1. Add missing keys to en
  applyPatch(en, EN_ADDITIONS, 'en/common.json (new keys)')
  save(enPath, en)

  // 2. Translate placeholders in es
  applyPatch(es, ES_PATCHES, 'es/common.json')
  save(esPath, es)

  // 3. Translate placeholders in dk
  applyPatch(dk, DK_PATCHES, 'dk/common.json')
  save(dkPath, dk)

  console.log('\nDone. Run pnpm i18n:check to verify.\n')
}

main()
