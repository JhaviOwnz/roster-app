const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const rosterFile = path.join(__dirname, '../db/rosters.json');
const validDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const defaultRosterPath = path.join(__dirname, '../db/defaultRoster.json');

/**
 * ✅ GET /api/rosters
 * Retorna el roster completo almacenado
 */
router.get('/', (req, res) => {
  fs.readFile(rosterFile, 'utf-8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Error reading file' });
    res.json(JSON.parse(data));
  });
});
/* 🧪 GET /api/rosters/raw  –  Verifica el contenido plano del archivo */
router.get('/raw', (req, res) => {
  fs.readFile(rosterFile, 'utf-8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Error reading file' });
    res.type('text/plain').send(data);  // 👈 sin parsear
  });
});
/* GET /api/rosters/default  –  Devuelve la plantilla */
router.get('/default', (req, res) => {
  fs.readFile(defaultRosterPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading default roster:', err);
      return res.status(500).json({ error: 'Cannot read default roster' });
    }
    res.json(JSON.parse(data));
  });
});

/**
 * 🔁 Función compartida de validación y guardado
 */
function validateAndSaveRoster(req, res) {
  const newRoster = req.body;

  // 🔎 Validación básica de estructura
  if (
    !newRoster ||
    typeof newRoster.weekStart !== 'string' ||
    !Array.isArray(newRoster.data) ||
    newRoster.data.some(row =>
      typeof row.name !== 'string' ||
      validDays.some(day => typeof row[day] !== 'string')
    )
  ) {
    return res.status(400).json({ error: 'Invalid roster format' });
  }

  // 🧪 Validación de formato de turnos
  const shiftRegex = /^(OFF|ACC|ANNUAL L\.|\d{2}:\d{2}-\d{2}:\d{2})$/;
  const errors = [];

  newRoster.data.forEach((row, idx) => {
    validDays.forEach(day => {
      const shift = row[day];
      if (shift && !shiftRegex.test(shift)) {
        errors.push(`Invalid shift "${shift}" for ${row.name} on ${day}`);
      }
    });
  });

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Invalid shift values', details: errors });
  }

  // 💾 Guardar el archivo
  fs.writeFile(rosterFile, JSON.stringify(newRoster, null, 2), 'utf-8', (err) => {
    if (err) return res.status(500).json({ error: 'Error saving roster' });
    res.json({ status: 'Saved' });
  });
}

/**
 * ✅ POST /api/rosters
 * Guarda el roster semanal enviado por el frontend
 */
router.post('/', validateAndSaveRoster);

/**
 * ✅ PUT /api/rosters
 * Alternativa equivalente a POST – usado por algunos clientes
 */
router.put('/', validateAndSaveRoster);

module.exports = router;
