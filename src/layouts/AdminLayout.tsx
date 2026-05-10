import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import type { NavLinkRenderProps } from 'react-router-dom'
import {
  BarChart3,
  AlertTriangle,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  Settings,
  TrafficCone,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useUsuarioPerfil } from '../hooks/useUsuarioPerfil'

const navigation = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Tela de campo', href: '/campo', icon: Map },
  { label: 'Mapa', href: '/mapa', icon: Map },
  { label: 'Sinalizações', href: '/sinalizacoes', icon: TrafficCone },
  { label: 'Irregularidades', href: '/irregularidades', icon: AlertTriangle },
  { label: 'Manutenções', href: '/manutencoes', icon: Wrench },
  { label: 'Relatórios', href: '/relatorios', icon: BarChart3 },
  { label: 'Usuários', href: '/usuarios', icon: Users },
  { label: 'Configurações', href: '/configuracoes', icon: Settings },
]

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const { signOut, user } = useAuth()
  const perfil = useUsuarioPerfil()

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <aside
        className={`fixed inset-y-0 left-0 z-[1300] w-72 transform border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <div className="flex items-center gap-3">
            <div className="admin-bg grid h-10 w-10 place-items-center rounded-lg text-slate-950">
              <TrafficCone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-950">SinalizaMap</p>
              <p className="text-xs font-medium text-slate-500">Gestão viária</p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex h-[calc(100vh-4rem)] flex-col justify-between px-3 py-4">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon

              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }: NavLinkRenderProps) =>
                    `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? 'admin-bg-soft admin-text'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              )
            })}
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </button>
        </nav>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[1200] bg-slate-950/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Fechar navegação"
        />
      )}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-[900] flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-8">
          <button
            type="button"
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="hidden items-center gap-2 text-sm font-medium text-slate-500 lg:flex">
            <ClipboardList className="admin-text h-4 w-4" />
            Operação de campo
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">
                {user?.email ?? 'Usuário autenticado'}
              </p>
              <p className="text-xs text-slate-500">
                {perfil === 'admin' ? 'Admin' : 'Usuário'} · sessão ativa
              </p>
            </div>
            <Link
              to="/perfil"
              className="grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-700"
              aria-label="Abrir meu perfil"
            >
              {(user?.email?.[0] ?? 'S').toUpperCase()}
            </Link>
          </div>
        </header>

        <main className="px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
