// ────────────────────────────────────────────────────────────────────────────
//  RosterPage.js  –  Página principal para editar los rosters semanales
// ────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import {
  Table, Select, Typography, Button,
  message, Tag, Tooltip, Spin, Popconfirm
} from 'antd';
import axios from 'axios';
import fetchEmployees from '../api/employees';
import { PlusOutlined, CloseOutlined, SaveOutlined } from '@ant-design/icons';

import { SHIFT_COLORS } from '../constants/colors';   // 🎨 Colores centralizados

const { Option } = Select;
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const RosterPage = () => {
  /* ──────────────── 🗄️  ESTADOS PRINCIPALES ──────────────── */

  const [saveSuccess, setSaveSuccess] = useState(false); // ✅ Guardado exitoso
  const [shakeError, setShakeError] = useState(false);   // ❌ Fallo visual
  const [saving, setSaving] = useState(false); // 💾 estado de guardado
  const [data, setData] = useState([]);         // 🧍‍♂️ Empleados + turnos
  const [weekStart, setWeekStart] = useState('2025-07-29');             // 📆 (placeholder)
  const [shifts, setShifts] = useState([]);     // 📂 Config de shifts
  const [loading, setLoading] = useState(true); // ⏳ Spinner inicial
  const [editingCell, setEditingCell] = useState(null); // { row, day } | null
  const [hoveredCell, setHoveredCell] = useState(null); // 🧠 NUEVO

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
      fetch('/api/rosters').then(r => r.json()) // ✅ ahora carga el archivo real
    ])
    .then(([employees, shiftArr, roster]) => {
      setShifts(shiftArr);                           // 1) guardar shifts primero

      if (roster?.data?.length) {
        const normalized = roster.data.map(r => normalizeRow(r, shiftArr));
        setData(normalized);
        setWeekStart(roster.weekStart);              // ✅ actualiza weekStart si viene del backend
      } else {
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

  const clearShift = (rowIndex, day) => {
    const updated = [...data];
    updated[rowIndex][day] = { shift: '', time: '' };
    setData(updated);
  };

  /* ──────────────── 💾 GUARDAR ROSTER ──────────────── */
const handleSave = () => {
  setSaving(true);
  setSaveSuccess(false);
  setShakeError(false);

  const payload = data.map(row => {
    const entry = { name: row.name };
    days.forEach(d => {
      const cell = row[d] || {};
      if (cell.shift === 'OFF' || cell.shift === 'ACC' || cell.shift === 'ANNUAL L.') {
        entry[d] = cell.shift;
      } else if (cell.time) {
        entry[d] = cell.time;
      } else {
        entry[d] = '';
      }
    });
    return entry;
  });

  axios.post('/api/rosters', { weekStart, data: payload })
    .then(() => {
      setSaveSuccess(true); // ✅ cambia color
      setTimeout(() => setSaveSuccess(false), 3000); // ⏱️ vuelve a normal
    })
    .catch((err) => {
      console.error('❌ Save failed:', err);
      setShakeError(true); // ❗ activa shake
      setTimeout(() => setShakeError(false), 600);   // corta shake
      message.error('Error saving roster');
    })
    .finally(() => {
      setSaving(false);
    });
};



  /* ──────────────── 🧱 COLUMNAS DINÁMICAS ──────────────── */
  const columns = [
    { title: 'Name', dataIndex: 'name', fixed: 'left', width: 120 },
    ...days.map(day => ({
      title: day,
      dataIndex: day,
      render: (_, __, rowIndex) => {
        const cell = data[rowIndex][day] || {};
        const { shift = '', time = '' } = cell;

        const isEditing = editingCell &&
                          editingCell.row === rowIndex &&
                          editingCell.day === day;

        if (isEditing) {
          return (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
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

        if (shift) {
          return (
            <Tooltip title={shift}>
  <Tag
    color={SHIFT_COLORS[shift] || 'blue'}
    style={{
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      lineHeight: '32px',
      fontSize: 12,
      borderRadius: 0,
      position: 'relative' // 🆕 para posicionar el ícono fijo
    }}
    onClick={() => setEditingCell({ row: rowIndex, day })}
    onMouseEnter={() => setHoveredCell({ row: rowIndex, day })}
    onMouseLeave={() => setHoveredCell(null)}
  >
    <span>{time || shift}</span>
<Popconfirm
  title="Remove shift?"
  okText="Yes"
  cancelText="No"
  onConfirm={(e) => {
    e.stopPropagation();
    clearShift(rowIndex, day);
  }}
  onCancel={(e) => e.stopPropagation()}
>
  <CloseOutlined
    style={{
      position: 'absolute',
      top: '50%',
      right: 6,
      transform: 'translateY(-50%)',
      fontSize: 12,
      color: '#444',
      background: 'rgba(255,255,255,0.8)',
      borderRadius: '50%',
      padding: 2,
      opacity: hoveredCell?.row === rowIndex && hoveredCell?.day === day ? 1 : 0,
      pointerEvents: hoveredCell?.row === rowIndex && hoveredCell?.day === day ? 'auto' : 'none',
      transition: 'opacity 0.2s ease'
    }}
    onClick={(e) => e.stopPropagation()}
  />
</Popconfirm>

  </Tag>
</Tooltip>

          );
        }

        return (
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            size="small"
            style={{ width: '100%' }}
            onClick={() => setEditingCell({ row: rowIndex, day })}
          />
        );
      }
    }))
  ];

  /* ──────────────── 🖼 RENDER FINAL ──────────────── */
  return (
    <Spin spinning={loading}>
      <Typography.Title level={2} style={{ marginBottom: 8 }}>
        Roster
      </Typography.Title>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Tag color="#69c0ff">AM Shift</Tag>
        <Tag color="#ff7875">PM Shift</Tag>
        <Tag color="#d9d9d9">OFF</Tag>
      </div>

      <Typography.Paragraph>
        <strong>Week Starting:</strong> {weekStart || '—'}
      </Typography.Paragraph>

      <Button
  type="primary"
  icon={<SaveOutlined />}
  loading={saving}
  disabled={saving}
  onClick={handleSave}
  className={shakeError ? 'shake' : ''}
  style={{
    marginBottom: 16,
    borderRadius: 8,
    paddingInline: 20,
    fontWeight: 'bold',
    backgroundColor: saveSuccess ? '#52c41a' : '#1890ff', // ✅ verde si guardó bien
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    transition: 'background-color 0.3s ease'
  }}
>
  {saveSuccess ? 'Saved!' : 'Save Roster'}
</Button>



      <Table
        className="compact-rows"
        columns={columns}
        dataSource={data.map((r, i) => ({ ...r, key: i }))}
        pagination={false}
        scroll={{ x: true }}
        bordered
        style={{ borderRadius: 8, overflow: 'hidden' }} // 🎨 Estilo aplicado a tabla
      />
    </Spin>
  );
};

export default RosterPage;
