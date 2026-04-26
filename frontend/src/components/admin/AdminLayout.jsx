import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { setAdminKey } from '../../api/client'
import './AdminLayout.css'

const NAV = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/pipelines', label: 'Pipelines' },
  { to: '/admin/stations', label: 'Stations' },
  { to: '/admin/settings', label: 'Settings' }
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleLogout() {
    setAdminKey(null)
    navigate('/admin/login')
  }

  function closeMobile() { setMobileOpen(false) }

  const sidebar = (
    <aside className={`admin-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-brand">
        <span>⛽</span>
        <span>Station Map</span>
      </div>
      <nav className="sidebar-nav">
        {NAV.map(n => (
          <NavLink key={n.to} to={n.to} end={n.end} onClick={closeMobile}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <a href="/" className="nav-link" target="_blank" rel="noopener noreferrer" onClick={closeMobile}>View Map</a>
        <button className="nav-link nav-logout" onClick={handleLogout}>Logout</button>
      </div>
    </aside>
  )

  return (
    <div className="admin-layout">
      {sidebar}
      {mobileOpen && <div className="sidebar-backdrop" onClick={closeMobile} />}

      <div className="admin-body">
        <header className="mobile-topbar">
          <button className="hamburger" onClick={() => setMobileOpen(o => !o)} aria-label="Menu">
            <span /><span /><span />
          </button>
          <span className="mobile-title">Station Map</span>
        </header>

        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
