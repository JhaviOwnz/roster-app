// Import core modules
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

// 🛡️ Middleware
app.use(cors());                          // Permite acceso desde frontend
app.use(express.json());                 // Soporte para JSON en body de requests

// 📁 API ROUTES
// Modularizamos las rutas para mantener limpio este archivo
app.use('/api/rosters', require('./routes/rosters'));
app.use('/api/shifts', require('./routes/shifts'));  // GET y PUT de shifts (desde shiftConfig.json)

// 👥 EMPLOYEES ENDPOINT
app.get("/api/employees", (req, res) => {
  const employeesPath = path.join(__dirname, "db", "employees.json");

  fs.readFile(employeesPath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading employees file:", err);
      return res.status(500).json({ error: "Could not read employees data." });
    }

    try {
      const employees = JSON.parse(data);
      res.json(employees);  // ✅ Devuelve lista de empleados
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      res.status(500).json({ error: "Malformed employees data." });
    }
  });
});

// 🚀 SERVER LISTEN
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
