// ────────────────────────────────────────────────────────────────────────────
//  RosterPage.js  –  Página principal para editar los rosters semanales
// ────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import {
  Table, Select, Typography, Button,
  message, Tag, Tooltip, Spin
} from 'antd';
import axios from 'axios';
import fetchEmployees from '../api/employees';
import { SHIFT_COLORS } from '../constants/colors';   // 🎨 Colores centralizados

const { Option } = Select;
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const RosterPage = () => {
  /* ──────────────── 🗄️  ESTADOS PRINCIPALES ──────────────── */
  const [data, setData] = useState([]);         // 🧍‍♂️ Empleados + turnos
  const [weekStart, setWeekStart] = useState('2025-07-29');             // 📆 (placeholder)
  const [shifts, setShifts] = useState([]);     // 📂 Config de shifts
  const [loading, setLoading] = useState(true); // ⏳ Spinner inicial
  const [editingCell, setEditingCell] = useState(null); // { row, day } | null

  /* ──────────────── 🔄 CARGA INICIAL 🔄 ──────────────── */
  // Convierte una fila del default JSON a objetos { shift, time }
const normalizeRow = (row, shifts) => {
  const newRow = { name: row.name };

  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  days.forEach(day => {
    const val = row[day];

    // 1) Celda vacía
    if (!val) { newRow[day] = {}; return; }

    // 2) Razones OFF (OFF, ACC, SICK, etc.)
    if (['OFF','ACC','SICK','Annual L.'].includes(val)) {
      newRow[day] = { shift: val, time: '' };
      return;
    }

    // 3) Horarios → deducir AM o PM fijándonos en shiftConfig
    const match = shifts.find(s => s.times && s.times.includes(val));
    if (match) {
      newRow[day] = { shift: match.name, time: val };
    } else {
      // fallback: solo guarda la hora
      newRow[day] = { shift: '', time: val };
    }
  });

  return newRow;
};

useEffect(() => {
  Promise.all([
    fetchEmployees(),
    fetch('/api/shifts').then(r => r.json()),
    fetch('/api/rosters/default').then(r => r.json())
  ])
  .then(([employees, shiftArr, rosterDefault]) => {
    setShifts(shiftArr);                           // 1) guardar shifts primero

    if (rosterDefault?.data?.length) {
      // 2) Normalizar cada fila según shiftArr
      const normalized = rosterDefault.data.map(r => normalizeRow(r, shiftArr));
      setData(normalized);
      // opcional: setWeekStart(rosterDefault.weekStart);
    } else {
      // fallback vacío como antes
      const rows = employees.map(e => ({
        name: e.name,
        Mon:{}, Tue:{}, Wed:{}, Thu:{}, Fri:{}, Sat:{}, Sun:{}
      }));
      setData(rows);
    }
  })
  .catch(() => message.error('Error loading data'))
  .finally(() => setLoading(false));
}, []);


  /* ──────────────── 🔬 UTILS: DIVIDIR SHIFTS ──────────────── */
  const timeOptions = shifts.filter(s => s.times.length > 0);   // AM / PM
  const offOptions  = shifts.filter(s => s.times.length === 0); // OFF, ACC…

  /* ──────────────── ✏️ HANDLERS DE EDICIÓN ──────────────── */
  const handleShiftChange = (value, rowIndex, day) => {
    const updated = [...data];
    updated[rowIndex][day] = { shift: value, time: '' }; // reset time
    setData(updated);
  };

  const handleTimeChange = (value, rowIndex, day) => {
    const updated = [...data];
    updated[rowIndex][day] = { ...updated[rowIndex][day], time: value };
    setData(updated);
    setEditingCell(null); // 🔑 salir de edición al elegir hora
  };

  /* ──────────────── 💾 GUARDAR ROSTER ──────────────── */
  const handleSave = () => {
    const payload = data.map(row => {
      const entry = { name: row.name };
      days.forEach(d => {
        const cell = row[d] || {};
        if (cell.shift === 'OFF' || cell.shift === 'ACC' || cell.shift === 'ANNUAL L.') {
  entry[d] = cell.shift;
} else if (cell.time) {
  entry[d] = cell.time; // ej: "09:00-17:00"
} else {
  entry[d] = ''; // vacío si no hay nada válido
}
      });
      return entry;
    });

    axios.post('/api/rosters', { weekStart, data: payload })
      .then(() => message.success('Roster saved!'))
      .catch(() => message.error('Error saving roster'));
  };

  /* ──────────────── 🧱 COLUMNAS DINÁMICAS ──────────────── */
  const columns = [
    { title: 'Name', dataIndex: 'name', fixed: 'left', width: 120 },

    // Generación de columnas Mon-Sun
    ...days.map(day => ({
      title: day,
      dataIndex: day,

      // Render por celda
      render: (_, __, rowIndex) => {
        const cell = data[rowIndex][day] || {};
        const { shift = '', time = '' } = cell;

        /* a) Modo edición -------------------------------------------------- */
        const isEditing = editingCell &&
                          editingCell.row === rowIndex &&
                          editingCell.day === day;

        if (isEditing) {
          return (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Select de turno */}
              <Select
                value={shift || undefined}
                placeholder="Shift"
                onChange={val => handleShiftChange(val, rowIndex, day)}
                style={{ width: '100%', marginBottom: 4 }}
              >
                {[...timeOptions, ...offOptions].map(s => (
                  <Option key={s.name} value={s.name}>{s.name}</Option>
                ))}
              </Select>

              {/* Select de horario (solo AM/PM) */}
              {shift && timeOptions.find(s => s.name === shift) && (
                <Select
                  value={time || undefined}
                  placeholder="Time"
                  onChange={val => handleTimeChange(val, rowIndex, day)}
                  style={{ width: '100%' }}
                >
                  {timeOptions
                    .find(s => s.name === shift)
                    .times.map(t => (
                      <Option key={t} value={t}>{t}</Option>
                    ))}
                </Select>
              )}
            </div>
          );
        }

        /* b) Vista “colapsada” (Tag coloreado) ----------------------------- */
        if (shift) {
          return (
            <Tooltip title={shift}>
<Tag
  color={SHIFT_COLORS[shift] || 'blue'}
  style={{
    cursor: 'pointer',
    display: 'block',
    width: '100%',
    height: '100%',          // rellena celda
    lineHeight: '32px',      // = height de celda
    fontSize: 12,
    textAlign: 'center',
    paddingInline: 0,
    borderRadius: 0          // opcional, look “barra” recta
  }}
  onClick={() => setEditingCell({ row: rowIndex, day })}
>
  {time || shift}
</Tag>
            </Tooltip>
          );
        }

        /* c) Celda vacía --------------------------------------------------- */
        return (
          <div
            style={{ cursor: 'pointer', color: '#bfbfbf' }}
            onClick={() => setEditingCell({ row: rowIndex, day })}
          >
            +
          </div>
        );
      }
    }))
  ];

  /* ──────────────── 🖼 RENDER FINAL ──────────────── */
  return (
    <Spin spinning={loading}>
      {/* Título */}
      <Typography.Title level={2} style={{ marginBottom: 8 }}>
        Roster
      </Typography.Title>

      {/* Leyenda de colores */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Tag color="#69c0ff">AM Shift</Tag>
        <Tag color="#ff7875">PM Shift</Tag>
        <Tag color="#d9d9d9">OFF</Tag>
      </div>

      <Typography.Paragraph>
        <strong>Week Starting:</strong> {weekStart || '—'}
      </Typography.Paragraph>

      {/* Botón de guardado */}
      <Button type="primary" onClick={handleSave} style={{ marginBottom: 16 }}>
        Save Roster
      </Button>

      {/* Tabla de roster */}
      <Table
        className="compact-rows"
        columns={columns}
        dataSource={data.map((r, i) => ({ ...r, key: i }))}
        pagination={false}
        scroll={{ x: true }}
        bordered
      />
    </Spin>
  );
};

export default RosterPage;
