const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const rosterFile = path.join(__dirname, '../db/rosters.json');

// GET: retornar el roster
router.get('/', (req, res) => {
  fs.readFile(rosterFile, 'utf-8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Error reading file' });
    res.json(JSON.parse(data));
  });
});

// POST: guardar un nuevo roster
router.post('/', (req, res) => {
  const newRoster = req.body;
  fs.writeFile(rosterFile, JSON.stringify(newRoster, null, 2), (err) => {
    if (err) return res.status(500).json({ error: 'Error saving roster' });
    res.json({ status: 'Saved' });
  });
});

module.exports = router;
