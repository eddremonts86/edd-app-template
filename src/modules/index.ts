export { getExplicitlyDisabledModuleIds, getExplicitlyEnabledModuleIds } from './core/config'
export { getDashboardPageTitle, getSidebarNavigation } from './core/navigation'
export { getEnabledModules, getModuleById, getModuleByRoute, moduleRegistry } from './core/registry'
export { isSet, resolveCapabilities } from './core/capability'
export { getCapabilitiesFn } from './core/capability.fn'
export { useCapability } from './core/use-capability'
export type {
  AppModuleCapability,
  AppModuleManifest,
  AppModuleNavigationItem,
  AppModuleNavigationSection,
  AppModuleRouteDefinition,
  ModuleActionId,
  ModuleBadgeId,
  WidgetDefinition,
  WidgetSize,
} from './core/types'
export {
  getRegisteredWidgets,
  getWidgetById,
  type ResolvedWidget,
  useWidgetConfig,
  type UseWidgetConfigReturn,
  WidgetRenderer,
  WidgetGrid,
  WidgetConfigurator,
  WidgetEditModeProvider,
  useWidgetEditMode,
  SortableWidgetItem,
  type EnrichedWidget,
} from './core/widget'
