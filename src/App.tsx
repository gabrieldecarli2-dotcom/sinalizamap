import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from './layouts/AdminLayout'
import { Login } from './pages/Login'
import { CampoPorPerfil } from './pages/CampoPorPerfil'
import { Configuracoes } from './pages/Configuracoes'
import { Dashboard } from './pages/Dashboard'
import { DetalheSinalizacao } from './pages/DetalheSinalizacao'
import { EditarSinalizacao } from './pages/EditarSinalizacao'
import { EditarIrregularidade } from './pages/EditarIrregularidade'
import { ListaIrregularidades } from './pages/ListaIrregularidades'
import { ListaSinalizacoes } from './pages/ListaSinalizacoes'
import { Manutencoes } from './pages/Manutencoes'
import { Mapa } from './pages/Mapa'
import { NovaIrregularidade } from './pages/NovaIrregularidade'
import { NovaSinalizacao } from './pages/NovaSinalizacao'
import { Perfil } from './pages/Perfil'
import { Relatorios } from './pages/Relatorios'
import { Usuarios } from './pages/Usuarios'
import { AdminRoute } from './routes/AdminRoute'
import { ProtectedRoute } from './routes/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/campo" element={<CampoPorPerfil />} />
        <Route path="/irregularidades/nova" element={<NovaIrregularidade />} />
        <Route path="/irregularidades/:id/editar" element={<EditarIrregularidade />} />
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/mapa" element={<Mapa />} />
            <Route path="/sinalizacoes" element={<ListaSinalizacoes />} />
            <Route path="/irregularidades" element={<ListaIrregularidades />} />
            <Route path="/sinalizacoes/nova" element={<NovaSinalizacao />} />
            <Route path="/sinalizacoes/:id/editar" element={<EditarSinalizacao />} />
            <Route path="/sinalizacoes/:id" element={<DetalheSinalizacao />} />
            <Route path="/manutencoes" element={<Manutencoes />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/perfil" element={<Perfil />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
