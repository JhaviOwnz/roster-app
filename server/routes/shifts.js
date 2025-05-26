// Core modules
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// 📂 Ruta absoluta al archivo de configuración de turnos
const shiftConfigPath = path.join(__dirname, '..', 'db', 'shiftConfig.json');

/**
 * ✅ GET /api/shifts
 * Devuelve todos los turnos desde el archivo JSON
 */
router.get('/', (req, res) => {
  fs.readFile(shiftConfigPath, 'utf8', (err, data) => {
    if (err) {
      console.error('❌ Error reading shift config:', err);
      return res.status(500).json({ error: 'Could not read shift config.' });
    }

    try {
      const shifts = JSON.parse(data);
      res.json(shifts);
    } catch (parseError) {
      console.error('❌ Malformed shift JSON:', parseError);
      res.status(500).json({ error: 'Malformed shift config.' });
    }
  });
});

/**
 * ✅ PUT /api/shifts
 * Reemplaza todos los turnos en el archivo JSON
 * Espera un array de objetos con formato: { id, name, times }
 */
router.put('/', (req, res) => {
  console.log("✅ PUT /api/shifts triggered");
  const newShifts = req.body;

  // Validación: debe ser un array
  if (!Array.isArray(newShifts)) {
    return res.status(400).json({ error: 'Invalid data format. Expected an array.' });
  }
  console.log("Received data to save:", newShifts);

  fs.writeFile(shiftConfigPath, JSON.stringify(newShifts, null, 2), 'utf8', (err) => {
    if (err) {
      console.error('❌ Error saving shifts:', err);
      return res.status(500).json({ error: 'Could not save shifts.' });
    }

    res.json({ success: true });
  });
});

module.exports = router;
