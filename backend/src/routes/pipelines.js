const express = require('express')
const router = express.Router()
const { pool } = require('../db')

// GET /api/v1/pipelines/search?q=...
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query
    if (!q) return res.json([])
    const result = await pool.query(
      `SELECT id, name, category, color,
              ST_AsGeoJSON(ST_Envelope(geometry))::json as envelope
       FROM pipelines WHERE name ILIKE $1 LIMIT 10`,
      [`%${q}%`]
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/v1/pipelines?bbox=minLng,minLat,maxLng,maxLat&category=gas,oil&status=operational&zoom=5
router.get('/', async (req, res) => {
  try {
    const { bbox, category, status, zoom } = req.query

    const z = parseInt(zoom) || 10
    let geomExpr
    if (z < 5) {
      geomExpr = 'ST_SimplifyPreserveTopology(geometry, 0.1)'
    } else if (z < 8) {
      geomExpr = 'ST_SimplifyPreserveTopology(geometry, 0.01)'
    } else {
      geomExpr = 'geometry'
    }

    const conditions = []
    const params = []
    let idx = 1

    if (bbox) {
      const parts = bbox.split(',').map(Number)
      if (parts.length === 4 && parts.every(v => !isNaN(v))) {
        conditions.push(`ST_Intersects(geometry, ST_MakeEnvelope($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, 4326))`)
        params.push(...parts)
        idx += 4
      }
    }

    if (category) {
      const cats = category.split(',').map(c => c.trim()).filter(Boolean)
      if (cats.length) {
        conditions.push(`category = ANY($${idx}::text[])`)
        params.push(cats)
        idx++
      }
    }

    if (status) {
      const statuses = status.split(',').map(s => s.trim()).filter(Boolean)
      if (statuses.length) {
        conditions.push(`status = ANY($${idx}::text[])`)
        params.push(statuses)
        idx++
      }
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const result = await pool.query(
      `SELECT id, name, color, category, status, countries, length_km,
              ST_AsGeoJSON(${geomExpr})::json as geometry
       FROM pipelines ${where} ORDER BY created_at DESC`,
      params
    )

    res.json({
      type: 'FeatureCollection',
      features: result.rows.map(row => ({
        type: 'Feature',
        geometry: row.geometry,
        properties: {
          id: row.id,
          name: row.name,
          color: row.color,
          category: row.category,
          status: row.status,
          countries: row.countries,
          length_km: row.length_km
        }
      }))
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/v1/pipelines/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, color, category, status, countries, description, length_km, source, created_at,
              ST_AsGeoJSON(geometry)::json as geometry
       FROM pipelines WHERE id = $1`,
      [req.params.id]
    )
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' })
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/v1/pipelines/:id/geojson — downloadable file
router.get('/:id/geojson', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, color, category, status, countries, description, length_km,
              ST_AsGeoJSON(geometry)::json as geometry
       FROM pipelines WHERE id = $1`,
      [req.params.id]
    )
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' })
    const row = result.rows[0]
    const filename = row.name.replace(/[^a-z0-9]/gi, '_') + '.geojson'
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Type', 'application/geo+json')
    res.json({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: row.geometry,
        properties: {
          id: row.id, name: row.name, color: row.color,
          category: row.category, status: row.status,
          countries: row.countries, description: row.description,
          length_km: row.length_km
        }
      }]
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
