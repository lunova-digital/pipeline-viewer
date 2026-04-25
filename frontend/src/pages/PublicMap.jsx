import { useState, useCallback, useEffect } from 'react'
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

// Read a localStorage value safely
function readStorage(key, fallback) {
  try {
    const val = localStorage.getItem(key)
    return val !== null ? val : fallback
  } catch {
    return fallback
  }
}

function writeStorage(key, value) {
  try { localStorage.setItem(key, String(value)) } catch {}
}

export default function PublicMap() {
  // Persist active layer (dark / satellite / osm) to localStorage
  const [activeLayer, setActiveLayer] = useState(() => {
    const saved = readStorage('map_layer', 'dark')
    return saved in TILES ? saved : 'dark'
  })

  // Persist label toggle to localStorage
  const [showLabels, setShowLabels] = useState(() => readStorage('map_labels', 'false') === 'true')

  const [metaOptions, setMetaOptions] = useState({ categories: [], statuses: [] })
  const [filters, setFilters] = useState({ categories: [], statuses: [] })
  const [selectedPipeline, setSelectedPipeline] = useState(null)
  const [selectedStation, setSelectedStation] = useState(null)
  const [mapInstance, setMapInstance] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE}/meta`)
      .then(res => res.json())
      .then(data => {
        setMetaOptions(data)
        // Default to all checked
        setFilters({
          categories: data.categories.map(c => c.id),
          statuses: data.statuses.map(s => s.id)
        })
      })
      .catch(err => console.error('Failed to fetch meta options:', err))
  }, [])

  // Persist layer preference whenever it changes
  useEffect(() => { writeStorage('map_layer', activeLayer) }, [activeLayer])

  // Persist label preference whenever it changes
  useEffect(() => { writeStorage('map_labels', showLabels) }, [showLabels])

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
      </div>

      <FilterPanel filters={filters} onChange={setFilters} metaOptions={metaOptions} />
      <Legend />

      {(selectedPipeline || selectedStation) && (
        <DetailPanel
          pipeline={selectedPipeline}
          station={selectedStation}
          onClose={handleClose}
        />
      )}

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
        <StationLayer onSelect={handleStationClick} showLabels={showLabels} />
      </MapContainer>
    </div>
  )
}
