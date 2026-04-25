import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { loadAdminKey, isAuthenticated } from './api/client'
import PublicMap from './pages/PublicMap'
import Login from './pages/admin/Login'
import AdminLayout from './components/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import PipelineList from './pages/admin/PipelineList'
import PipelineForm from './pages/admin/PipelineForm'
import StationList from './pages/admin/StationList'
import StationForm from './pages/admin/StationForm'
import MetadataManager from './pages/admin/MetadataManager'

function PrivateRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/admin/login" replace />
}

export default function App() {
  useEffect(() => { loadAdminKey() }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicMap />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin" element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="pipelines" element={<PipelineList />} />
          <Route path="pipelines/new" element={<PipelineForm />} />
          <Route path="pipelines/:id/edit" element={<PipelineForm />} />
          <Route path="stations" element={<StationList />} />
          <Route path="stations/new" element={<StationForm />} />
          <Route path="stations/:id/edit" element={<StationForm />} />
          <Route path="settings" element={<MetadataManager />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
