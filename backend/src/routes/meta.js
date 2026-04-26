const express = require('express')
const router = express.Router()
const { pool } = require('../db')

// Capitalize helper
const initCap = (str) => {
  if (!str) return ''
  return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
}

router.get('/', async (req, res) => {
  try {
    const catsResult        = await pool.query('SELECT id, label, color FROM categories ORDER BY label')
    const statsResult       = await pool.query('SELECT id, label FROM statuses ORDER BY label')
    const typesResult       = await pool.query('SELECT id, label, color FROM station_types ORDER BY label')
    const stationCatsResult = await pool.query('SELECT id, label, color FROM station_categories ORDER BY label')

    res.json({
      categories:        catsResult.rows,
      statuses:          statsResult.rows,
      station_types:     typesResult.rows,
      station_categories: stationCatsResult.rows,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT key, value FROM site_settings ORDER BY key')
    const settings = Object.fromEntries(result.rows.map(r => [r.key, r.value]))
    res.json(settings)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
