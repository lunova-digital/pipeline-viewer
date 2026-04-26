import { useState, useCallback, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import BaseLayerSwitcher from '../components/map/BaseLayerSwitcher'
import PipelineLayer from '../components/map/PipelineLayer'
import StationLayer from '../components/map/StationLayer'
import FilterPanel from '../components/map/FilterPanel'
import DetailPanel from '../components/map/DetailPanel'
import Legend from '../components/map/Legend'
import SearchBar from '../components/map/SearchBar'
import LabelToggle from '../components/map/LabelToggle'
import './PublicMap.css'

const TILES = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com">Esri</a>, DigitalGlobe, GeoEye',
    maxZoom: 18
  },
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }
}

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

function MapController({ onReady }) {
  const map = useMap()
  useEffect(() => { onReady(map) }, []) // eslint-disable-line
  return null
}

function readStorage(key, fallback) {
  try {
    const val = localStorage.getItem(key)
    return val !== null ? val : fallback
  } catch { return fallback }
}

function writeStorage(key, value) {
  try { localStorage.setItem(key, String(value)) } catch {}
}

// Compute bounding box from GeoJSON LineString coordinates
function coordsBounds(coords) {
  const lngs = coords.map(c => c[0])
  const lats = coords.map(c => c[1])
  return [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]]
}

function copyToClipboard(text) {
  if (navigator.clipboard) return navigator.clipboard.writeText(text)
  const el = document.createElement('textarea')
  el.value = text
  document.body.appendChild(el)
  el.select()
  document.execCommand('copy')
  document.body.removeChild(el)
  return Promise.resolve()
}

export default function PublicMap() {
  const [activeLayer, setActiveLayer] = useState(() => {
    const saved = readStorage('map_layer', 'dark')
    return saved in TILES ? saved : 'dark'
  })
  const [showLabels, setShowLabels] = useState(() => readStorage('map_labels', 'false') === 'true')
  const [metaOptions, setMetaOptions] = useState({ categories: [], statuses: [], station_types: [] })
  const [filters, setFilters] = useState({ categories: [], statuses: [], station_types: [] })
  const [selectedPipeline, setSelectedPipeline] = useState(null)
  const [selectedStation, setSelectedStation] = useState(null)
  const [mapInstance, setMapInstance] = useState(null)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  // Parse sharing URL params once on mount
  const urlParams = useRef(new URLSearchParams(window.location.search))
  const sharedPipelineId = urlParams.current.get('pipeline')
  const sharedStationId  = urlParams.current.get('station')
  const sharedLat  = urlParams.current.get('lat')
  const sharedLng  = urlParams.current.get('lng')
  const sharedZoom = urlParams.current.get('zoom')

  useEffect(() => {
    fetch(`${API_BASE}/meta`)
      .then(res => res.json())
      .then(data => {
        setMetaOptions(data)
        setFilters({
          categories:    data.categories.map(c => c.id),
          statuses:      data.statuses.map(s => s.id),
          station_types: data.station_types ? data.station_types.map(t => t.id) : []
        })
      })
      .catch(err => console.error('Failed to fetch meta options:', err))
  }, [])

  useEffect(() => { writeStorage('map_layer', activeLayer) }, [activeLayer])
  useEffect(() => { writeStorage('map_labels', showLabels) }, [showLabels])

  // Fly to shared location once map is ready
  useEffect(() => {
    if (!mapInstance) return

    if (sharedPipelineId) {
      fetch(`${API_BASE}/pipelines/${sharedPipelineId}`)
        .then(r => r.json())
        .then(data => {
          if (data.error) return
          const bounds = coordsBounds(data.geometry.coordinates)
          mapInstance.fitBounds(bounds, { padding: [60, 60], maxZoom: 10 })
          setSelectedPipeline({
            id: data.id, name: data.name, color: data.color,
            category: data.category, status: data.status,
            countries: data.countries, length_km: data.length_km,
            description: data.description
          })
        })
        .catch(() => {})
    } else if (sharedStationId) {
      fetch(`${API_BASE}/stations/${sharedStationId}`)
        .then(r => r.json())
        .then(data => {
          if (data.error) return
          const [lng, lat] = data.geometry.coordinates
          mapInstance.flyTo([lat, lng], 10)
          setSelectedStation({
            id: data.id, name: data.name, type: data.type,
            pipeline_name: data.pipeline_name, description: data.description
          })
        })
        .catch(() => {})
    } else if (sharedLat && sharedLng) {
      mapInstance.flyTo(
        [parseFloat(sharedLat), parseFloat(sharedLng)],
        parseInt(sharedZoom) || 8
      )
    }
  }, [mapInstance]) // eslint-disable-line

  function showToast(msg) {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }

  function handleShareView() {
    if (!mapInstance) return
    const c = mapInstance.getCenter()
    const z = Math.round(mapInstance.getZoom())
    const url = `${window.location.origin}/?lat=${c.lat.toFixed(5)}&lng=${c.lng.toFixed(5)}&zoom=${z}`
    copyToClipboard(url).then(() => showToast('View link copied to clipboard'))
  }

  function handleSharePipeline(id) {
    const url = `${window.location.origin}/?pipeline=${id}`
    copyToClipboard(url).then(() => showToast('Pipeline link copied to clipboard'))
  }

  function handleShareStation(id) {
    const url = `${window.location.origin}/?station=${id}`
    copyToClipboard(url).then(() => showToast('Station link copied to clipboard'))
  }

  const tile = TILES[activeLayer]

  const handlePipelineClick = useCallback(props => {
    setSelectedStation(null)
    setSelectedPipeline(props)
  }, [])

  const handleStationClick = useCallback(props => {
    setSelectedPipeline(null)
    setSelectedStation(props)
  }, [])

  const handleClose = useCallback(() => {
    setSelectedPipeline(null)
    setSelectedStation(null)
  }, [])

  return (
    <div className="public-map">
      <a href="/admin" className="map-brand" title="Admin Panel">
        <span>⛽</span>
        <span className="brand-text">Station Map</span>
      </a>

      <SearchBar map={mapInstance} />

      <div className="map-controls-top-right">
        <BaseLayerSwitcher active={activeLayer} onChange={setActiveLayer} />
        <LabelToggle showLabels={showLabels} onChange={setShowLabels} />
        <button className="share-view-btn" onClick={handleShareView} title="Share current view">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          <span>Share View</span>
        </button>
      </div>

      <FilterPanel filters={filters} onChange={setFilters} metaOptions={metaOptions} />
      <Legend />

      {(selectedPipeline || selectedStation) && (
        <DetailPanel
          pipeline={selectedPipeline}
          station={selectedStation}
          onClose={handleClose}
          onShare={selectedPipeline
            ? () => handleSharePipeline(selectedPipeline.id)
            : () => handleShareStation(selectedStation.id)
          }
        />
      )}

      {toast && <div className="map-toast">{toast}</div>}

      <MapContainer
        center={[25, 20]}
        zoom={3}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        attributionControl={true}
      >
        <MapController onReady={setMapInstance} />
        <TileLayer key={activeLayer} url={tile.url} attribution={tile.attribution} maxZoom={tile.maxZoom} />
        <PipelineLayer filters={filters} onSelect={handlePipelineClick} showLabels={showLabels} />
        <StationLayer filters={filters} metaOptions={metaOptions} onSelect={handleStationClick} showLabels={showLabels} />
      </MapContainer>
    </div>
  )
}
