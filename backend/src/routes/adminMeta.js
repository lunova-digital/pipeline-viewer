const express = require('express')
const router = express.Router()
const { pool } = require('../db')

// POST /api/v1/admin/meta/categories
router.post('/categories', async (req, res) => {
  try {
    const { id, label, color } = req.body
    if (!id || !label || !color) return res.status(400).json({ error: 'Missing required fields' })
    await pool.query(
      'INSERT INTO categories (id, label, color) VALUES ($1, $2, $3)',
      [id, label, color]
    )
    res.json({ success: true })
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Category ID already exists' })
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/v1/admin/meta/categories/:id
router.delete('/categories/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/v1/admin/meta/statuses
router.post('/statuses', async (req, res) => {
  try {
    const { id, label } = req.body
    if (!id || !label) return res.status(400).json({ error: 'Missing required fields' })
    await pool.query(
      'INSERT INTO statuses (id, label) VALUES ($1, $2)',
      [id, label]
    )
    res.json({ success: true })
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Status ID already exists' })
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/v1/admin/meta/statuses/:id
router.delete('/statuses/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM statuses WHERE id = $1', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
