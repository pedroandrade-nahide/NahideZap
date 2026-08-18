'use client'

import { memo, useCallback } from 'react'
import {
  Zap,
  ChevronLeft,
  ChevronRight,
  Plus,
  LogOut,
  X,
  LucideIcon,
} from 'lucide-react'
import { PrefetchLink } from '@/components/ui/PrefetchLink'
import { cn } from '@/lib/utils'
import { useUnreadCount } from '@/hooks/useUnreadCount'

// =============================================================================
// TYPES
// =============================================================================

export interface NavItem {
  path: string
  label: string
  icon: LucideIcon
  badge?: string
  disabled?: boolean
  hidden?: boolean
}

export interface DashboardSidebarProps {
  pathname: string | null
  navItems: NavItem[]
  isSidebarExpanded: boolean
  isMobileMenuOpen: boolean
  isLoggingOut: boolean
  companyName: string | null
  onToggleSidebar: (expanded: boolean) => void
  onCloseMobileMenu: () => void
  onLogout: () => void
  onPrefetchRoute: (path: string) => void
}

// =============================================================================
// INBOX BADGE (Isolado para evitar re-render do sidebar inteiro)
// =============================================================================

/**
 * Badge de contagem não lida do Inbox.
 * Consome useUnreadCount diretamente para evitar que mudanças na contagem
 * causem re-render de todo o sidebar.
 */
const InboxUnreadBadge = memo(function InboxUnreadBadge({
  variant = 'compact',
}: {
  variant?: 'compact' | 'expanded'
}) {
  const { count } = useUnreadCount()

  if (!count || count === 0) return null

  const displayCount = count > 99 ? '99+' : String(count)

  if (variant === 'compact') {
    return (
      <span
        className="absolute -right-1 -top-1 rounded-full bg-emerald-500/90 px-0.5 py-[1px] text-[7px] font-semibold uppercase tracking-wider text-black"
        aria-label={`${count} mensagens não lidas`}
      >
        {displayCount}
      </span>
    )
  }

  return (
    <span
      className="rounded-full bg-emerald-500/20 px-1.5 py-[1px] text-[8px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-200 border border-emerald-500/30"
      aria-label={`${count} mensagens não lidas`}
    >
      {displayCount}
    </span>
  )
})

// =============================================================================
// COMPACT SIDEBAR (Icon-only)
// =============================================================================

const CompactSidebar = memo(function CompactSidebar({
  pathname,
  navItems,
  isSidebarExpanded,
  isLoggingOut,
  onToggleSidebar,
  onLogout,
  onPrefetchRoute,
}: Pick<
  DashboardSidebarProps,
  | 'pathname'
  | 'navItems'
  | 'isSidebarExpanded'
  | 'isLoggingOut'
  | 'onToggleSidebar'
  | 'onLogout'
  | 'onPrefetchRoute'
>) {
  return (
    <aside
      className={`hidden lg:flex fixed lg:static inset-y-0 left-0 z-50 w-14 bg-[var(--ds-bg-elevated)] border-r border-[var(--ds-border-subtle)] ${isSidebarExpanded ? 'lg:hidden' : ''}`}
      aria-label="Menu de navegação compacto"
    >
      <div className="flex h-full w-14 flex-col items-center gap-3 py-3">
        <button
          type="button"
          className="hidden lg:flex h-7 w-7 items-center justify-center rounded-md border border-[var(--ds-border-default)] text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] hover:bg-[var(--ds-bg-hover)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 focus-visible:outline-offset-2"
          onClick={() => onToggleSidebar(true)}
          title="Expandir menu"
          aria-label="Expandir menu de navegação"
        >
          <ChevronRight size={14} aria-hidden="true" />
        </button>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--ds-border-default)] bg-linear-to-br from-primary-600 to-primary-800 shadow-lg shadow-primary-900/20"
          role="img"
          aria-label="Logo NahideZap"
        >
          <Zap className="text-white" size={18} fill="currentColor" aria-hidden="true" />
        </div>
        <nav className="flex flex-1 flex-col items-center gap-1.5 pt-1" aria-label="Menu principal">
          {navItems.map((item) => {
            const isDisabled = item.disabled
            const isActive = pathname === item.path
            const baseClassName = `group relative flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-[var(--ds-text-secondary)] transition-colors ${
              isDisabled
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:border-[var(--ds-border-default)] hover:bg-[var(--ds-bg-hover)] hover:text-[var(--ds-text-primary)] focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ds-bg-base)]'
            } ${isActive ? 'bg-[var(--ds-bg-hover)] text-[var(--ds-text-primary)]' : ''}`

            // Inbox usa badge dinâmico, outros usam badge estático
            const badge = item.path === '/inbox' ? (
              <InboxUnreadBadge variant="compact" />
            ) : item.badge ? (
              <span
                className="absolute -right-1 -top-1 rounded-full bg-emerald-500/90 px-0.5 py-[1px] text-[7px] font-semibold uppercase tracking-wider text-black"
                aria-label={item.badge}
              >
                {item.badge}
              </span>
            ) : null

            const content = (
              <>
                <item.icon size={16} aria-hidden="true" />
                {badge}
              </>
            )

            if (isDisabled) {
              return (
                <span
                  key={item.path}
                  className={baseClassName}
                  title={`${item.label} (${item.badge})`}
                  aria-label={`${item.label} - ${item.badge}`}
                  aria-disabled="true"
                >
                  {content}
                </span>
              )
            }

            return (
              <PrefetchLink
                key={item.path}
                href={item.path}
                onMouseEnter={() => onPrefetchRoute(item.path)}
                aria-current={isActive ? 'page' : undefined}
                className={baseClassName}
                title={item.label}
                aria-label={item.label}
              >
                {content}
              </PrefetchLink>
            )
          })}
        </nav>
        <button
          onClick={onLogout}
          disabled={isLoggingOut}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--ds-border-default)] text-[var(--ds-text-secondary)] transition-colors hover:bg-[var(--ds-bg-hover)] hover:text-[var(--ds-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Sair"
          aria-label="Sair da conta"
        >
          {isLoggingOut ? (
            <div
              className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--ds-text-muted)] border-t-[var(--ds-text-primary)]"
              role="status"
              aria-label="Saindo..."
            />
          ) : (
            <LogOut size={16} aria-hidden="true" />
          )}
        </button>
        <div className="text-[10px] text-[var(--ds-text-muted)] font-mono" aria-label={`Versão ${process.env.NEXT_PUBLIC_APP_VERSION}`}>
          v{process.env.NEXT_PUBLIC_APP_VERSION}
        </div>
      </div>
    </aside>
  )
})

// =============================================================================
// EXPANDED SIDEBAR (Full labels)
// =============================================================================

const ExpandedSidebar = memo(function ExpandedSidebar({
  pathname,
  navItems,
  isSidebarExpanded,
  isMobileMenuOpen,
  isLoggingOut,
  companyName,
  onToggleSidebar,
  onCloseMobileMenu,
  onLogout,
  onPrefetchRoute,
}: DashboardSidebarProps) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-56 bg-[var(--ds-bg-elevated)] border-r border-[var(--ds-border-subtle)] transform transition-transform duration-200 ease-in-out",
        // Mobile (< lg): show only when menu is open
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
        // Desktop (lg+): controlled by isSidebarExpanded, overrides mobile class
        isSidebarExpanded ? 'lg:translate-x-0' : 'lg:-translate-x-full'
      )}
      aria-label="Menu de navegação expandido"
    >
      <div className="flex h-full flex-col p-4">
        <div className="h-16 flex items-center px-2 mb-6">
          <div
            className="w-10 h-10 bg-linear-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-primary-900/20 border border-[var(--ds-border-default)]"
            role="img"
            aria-label="Logo NahideZap"
          >
            <Zap className="text-white" size={20} fill="currentColor" aria-hidden="true" />
          </div>
          <div>
            <span className="text-xl font-bold text-[var(--ds-text-primary)] tracking-tight block">NahideZap</span>
          </div>
          <button
            type="button"
            className="ml-auto h-7 w-7 items-center justify-center rounded-md border border-[var(--ds-border-default)] text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] hover:bg-[var(--ds-bg-hover)] transition-colors hidden lg:flex focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 focus-visible:outline-offset-2"
            onClick={() => onToggleSidebar(false)}
            title="Recolher menu"
            aria-label="Recolher menu de navegação"
          >
            <ChevronLeft size={14} aria-hidden="true" />
          </button>
          <button
            className="ml-auto lg:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 focus-visible:outline-offset-2 rounded-md p-1"
            onClick={onCloseMobileMenu}
            aria-label="Fechar menu"
          >
            <X size={20} className="text-[var(--ds-text-secondary)]" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto no-scrollbar" aria-label="Menu principal">
          <div>
            <PrefetchLink
              href="/campaigns/new"
              className="group relative inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium transition-all shadow-lg shadow-primary-900/20 overflow-hidden focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ds-bg-base)]"
              aria-label="Criar nova campanha"
            >
              <div className="absolute inset-0 bg-primary-600 group-hover:bg-primary-500 transition-colors"></div>
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              <Plus size={16} className="relative z-10 text-white" aria-hidden="true" />
              <span className="relative z-10 text-white">Nova Campanha</span>
            </PrefetchLink>
          </div>

          <div className="space-y-1 px-2">
            <p className="px-2 text-xs font-semibold text-[var(--ds-text-muted)] uppercase tracking-wider mb-2">Menu</p>
            {navItems.map((item) => {
              const isDisabled = item.disabled
              const isActive = pathname === item.path
              const baseClassName = `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mb-1 ${
                isDisabled
                  ? 'opacity-50 cursor-not-allowed text-[var(--ds-text-muted)]'
                  : isActive
                    ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 font-medium border border-primary-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                    : 'text-[var(--ds-text-secondary)] hover:bg-[var(--ds-bg-hover)] hover:text-[var(--ds-text-primary)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500'
              }`

              // Inbox usa badge dinâmico, outros usam badge estático
              const badge = item.path === '/inbox' ? (
                <InboxUnreadBadge variant="expanded" />
              ) : item.badge ? (
                <span
                  className="rounded-full bg-emerald-500/20 px-1.5 py-[1px] text-[8px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-200 border border-emerald-500/30"
                  aria-label={item.badge}
                >
                  {item.badge}
                </span>
              ) : null

              const content = (
                <>
                  <item.icon size={20} aria-hidden="true" />
                  <span className="flex items-center gap-2">
                    {item.label}
                    {badge}
                  </span>
                </>
              )

              if (isDisabled) {
                return (
                  <span key={item.path} className={baseClassName} aria-disabled="true">
                    {content}
                  </span>
                )
              }

              return (
                <PrefetchLink
                  key={item.path}
                  href={item.path}
                  onClick={onCloseMobileMenu}
                  onMouseEnter={() => onPrefetchRoute(item.path)}
                  aria-current={isActive ? 'page' : undefined}
                  className={baseClassName}
                >
                  {content}
                </PrefetchLink>
              )
            })}
          </div>
        </nav>

        <div className="pt-4 mt-4 border-t border-[var(--ds-border-subtle)]">
          <button
            onClick={onLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--ds-bg-hover)] cursor-pointer transition-colors border border-transparent hover:border-[var(--ds-border-subtle)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Sair da conta"
            aria-label="Sair da conta"
          >
            <div
              className="w-9 h-9 rounded-full bg-[var(--ds-bg-surface)] border border-[var(--ds-border-default)] flex items-center justify-center overflow-hidden"
              aria-hidden="true"
            >
              <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                {(companyName || 'NahideZap').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-[var(--ds-text-primary)] truncate">{companyName || 'NahideZap'}</p>
              <p className="text-xs text-[var(--ds-text-muted)] truncate">Administrador</p>
            </div>
            {isLoggingOut ? (
              <div
                className="w-4 h-4 border-2 border-[var(--ds-text-muted)] border-t-[var(--ds-text-primary)] rounded-full animate-spin"
                role="status"
                aria-label="Saindo..."
              />
            ) : (
              <LogOut size={16} className="text-[var(--ds-text-muted)] hover:text-[var(--ds-text-primary)] transition-colors" aria-hidden="true" />
            )}
          </button>

          <div
            className="mt-2 text-[10px] text-[var(--ds-text-muted)] text-center font-mono"
            aria-label={`Versão ${process.env.NEXT_PUBLIC_APP_VERSION}`}
          >
            v{process.env.NEXT_PUBLIC_APP_VERSION}
          </div>
        </div>
      </div>
    </aside>
  )
})

// =============================================================================
// MAIN COMPONENT (exported)
// =============================================================================

/**
 * Dashboard Sidebar component - extracted from DashboardShell for isolation.
 * Memoized to prevent re-renders when parent state changes that don't affect sidebar.
 */
export const DashboardSidebar = memo(function DashboardSidebar(props: DashboardSidebarProps) {
  const {
    pathname,
    navItems,
    isSidebarExpanded,
    isMobileMenuOpen,
    isLoggingOut,
    companyName,
    onToggleSidebar,
    onCloseMobileMenu,
    onLogout,
    onPrefetchRoute,
  } = props

  return (
    <>
      <CompactSidebar
        pathname={pathname}
        navItems={navItems}
        isSidebarExpanded={isSidebarExpanded}
        isLoggingOut={isLoggingOut}
        onToggleSidebar={onToggleSidebar}
        onLogout={onLogout}
        onPrefetchRoute={onPrefetchRoute}
      />
      <ExpandedSidebar {...props} />
    </>
  )
})

export default DashboardSidebar
