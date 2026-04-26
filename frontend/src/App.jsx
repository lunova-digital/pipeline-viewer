import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { loadAdminKey, isAuthenticated, api } from './api/client'
import PublicMap from './pages/PublicMap'
import Login from './pages/admin/Login'
import AdminLayout from './components/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import PipelineList from './pages/admin/PipelineList'
import PipelineForm from './pages/admin/PipelineForm'
import StationList from './pages/admin/StationList'
import StationForm from './pages/admin/StationForm'
import MetadataManager from './pages/admin/MetadataManager'

function setMetaTag(attr, name, content) {
  if (!content) return
  let el = document.querySelector(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function PrivateRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/admin/login" replace />
}

export default function App() {
  useEffect(() => {
    loadAdminKey()
    api.get('/meta/settings').then(res => {
      const s = res.data
      if (s.site_title) document.title = s.site_title
      setMetaTag('name', 'description', s.site_description)
      setMetaTag('property', 'og:title', s.site_title)
      setMetaTag('property', 'og:description', s.site_description)
      setMetaTag('property', 'og:image', s.og_image_url)
      setMetaTag('name', 'twitter:title', s.site_title)
      setMetaTag('name', 'twitter:description', s.site_description)
      setMetaTag('name', 'twitter:image', s.og_image_url)
    }).catch(() => {})
  }, [])

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
