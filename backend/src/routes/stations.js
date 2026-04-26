const express = require('express')
const router = express.Router()
const { pool } = require('../db')

// GET /api/v1/stations?bbox=minLng,minLat,maxLng,maxLat&type=compressor
router.get('/', async (req, res) => {
  try {
    const { bbox, type } = req.query

    const conditions = []
    const params = []
    let idx = 1

    if (bbox) {
      const parts = bbox.split(',').map(Number)
      if (parts.length === 4 && parts.every(v => !isNaN(v))) {
        conditions.push(`ST_Intersects(s.geometry, ST_MakeEnvelope($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, 4326))`)
        params.push(...parts)
        idx += 4
      }
    }

    if (type) {
      const types = type.split(',').map(t => t.trim()).filter(Boolean)
      if (types.length) {
        conditions.push(`s.type = ANY($${idx}::text[])`)
        params.push(types)
        idx++
      }
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const result = await pool.query(
      `SELECT s.id, s.name, s.type, s.category, s.status, s.pipeline_id, s.description,
              p.name as pipeline_name, p.color as pipeline_color,
              ST_AsGeoJSON(s.geometry)::json as geometry
       FROM stations s
       LEFT JOIN pipelines p ON s.pipeline_id = p.id
       ${where}
       ORDER BY s.created_at DESC`,
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
          type: row.type,
          category: row.category,
          status: row.status,
          pipeline_id: row.pipeline_id,
          pipeline_name: row.pipeline_name,
          pipeline_color: row.pipeline_color,
          description: row.description
        }
      }))
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/v1/stations/search?q=...
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query
    if (!q) return res.json([])
    const result = await pool.query(
      `SELECT s.id, s.name, s.type,
              ST_Y(s.geometry) as lat, ST_X(s.geometry) as lng
       FROM stations s
       WHERE s.name ILIKE $1
       LIMIT 8`,
      [`%${q}%`]
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/v1/stations/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.id, s.name, s.type, s.category, s.status, s.pipeline_id, s.description, s.source, s.created_at,
              p.name as pipeline_name,
              ST_AsGeoJSON(s.geometry)::json as geometry
       FROM stations s
       LEFT JOIN pipelines p ON s.pipeline_id = p.id
       WHERE s.id = $1`,
      [req.params.id]
    )
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' })
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
