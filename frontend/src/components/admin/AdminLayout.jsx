import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { setAdminKey } from '../../api/client'
import './AdminLayout.css'

const NAV = [
  { to: '/admin', label: '🏠 Dashboard', end: true },
  { to: '/admin/pipelines', label: '🛢 Pipelines' },
  { to: '/admin/stations', label: '📍 Stations' },
  { to: '/admin/settings', label: '⚙️ Settings' }
]

export default function AdminLayout() {
  const navigate = useNavigate()

  function handleLogout() {
    setAdminKey(null)
    navigate('/admin/login')
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <span>⛽</span>
          <span>Station Map</span>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <a href="/" className="nav-link" target="_blank" rel="noopener noreferrer">🗺 View Map</a>
          <button className="nav-link nav-logout" onClick={handleLogout}>🚪 Logout</button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
