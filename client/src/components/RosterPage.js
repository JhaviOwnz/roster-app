// ────────────────────────────────────────────────────────────────────────────
//  RosterPage.js  –  Página principal para editar los rosters semanales
// ────────────────────────────────────────────────────────────────────────────

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import React, { useEffect, useState } from 'react';
import {
  Table, Select, Typography, Tag, Tooltip, Spin
} from 'antd';
import axios from 'axios';
import fetchEmployees from '../api/employees';
import { PlusOutlined, CloseOutlined, SaveOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion'; // 🎬 animaciones modernas
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
  const [saving, setSaving] = useState(false);         // ⏳ Guardando...
  const [saveSuccess, setSaveSuccess] = useState(false); // ✅ Guardado exitoso
  const [shakeError, setShakeError] = useState(false);   // ❌ Fallo visual
  const [isExportingPDF, setIsExportingPDF] = useState(false); // 🖨️ Modo exportación

  /* ──────────────── 🔄 CARGA INICIAL 🔄 ──────────────── */
  const normalizeRow = (row, shifts) => {
    const newRow = { name: row.name };
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    days.forEach(day => {
      const val = row[day];
      if (!val) { newRow[day] = {}; return; }
      if (['OFF','ACC','SICK','Annual L.'].includes(val)) {
        newRow[day] = { shift: val, time: '' };
        return;
      }
      const match = shifts.find(s => s.times && s.times.includes(val));
      if (match) {
        newRow[day] = { shift: match.name, time: val };
      } else {
        newRow[day] = { shift: '', time: val };
      }
    });
    return newRow;
  };

  useEffect(() => {
    Promise.all([
      fetchEmployees(),
      fetch('/api/shifts').then(r => r.json()),
      fetch('/api/rosters').then(r => r.json())
    ])
    .then(([employees, shiftArr, roster]) => {
      setShifts(shiftArr);
      if (roster?.data?.length) {
        const normalized = roster.data.map(r => normalizeRow(r, shiftArr));
        setData(normalized);
        setWeekStart(roster.weekStart);
      } else {
        const rows = employees.map(e => ({
          name: e.name,
          Mon:{}, Tue:{}, Wed:{}, Thu:{}, Fri:{}, Sat:{}, Sun:{}
        }));
        setData(rows);
      }
    })
    .catch(() => console.error('Error loading data'))
    .finally(() => setLoading(false));
  }, []);

  const timeOptions = shifts.filter(s => s.times.length > 0);
  const offOptions  = shifts.filter(s => s.times.length === 0);

  const handleShiftChange = (value, rowIndex, day) => {
    const updated = [...data];
    updated[rowIndex][day] = { shift: value, time: '' };
    setData(updated);
  };

  const handleTimeChange = (value, rowIndex, day) => {
    const updated = [...data];
    updated[rowIndex][day] = { ...updated[rowIndex][day], time: value };
    setData(updated);
    setEditingCell(null);
  };

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
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      })
      .catch((err) => {
        console.error('❌ Save failed:', err);
        setShakeError(true);
        setTimeout(() => setShakeError(false), 600);
      })
      .finally(() => {
        setSaving(false);
      });
  };

  const handleExportPDF = () => {
    setIsExportingPDF(true); // 🚩 activamos modo export
    const input = document.getElementById('roster-table');

    html2canvas(input, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'pt', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.setFontSize(16);
      pdf.setTextColor('#333');
      pdf.text(`Roster - Week Starting: ${weekStart}`, 40, 30);
      pdf.addImage(imgData, 'PNG', 20, 40, pdfWidth - 40, pdfHeight);
      pdf.save(`Roster_${weekStart}.pdf`);
    }).finally(() => {
      setIsExportingPDF(false); // 🔚 desactivamos modo export
    });
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', fixed: 'left', width: 120 },
    ...days.map(day => ({
      title: day,
      dataIndex: day,
      render: (_, __, rowIndex) => {
        const cell = data[rowIndex][day] || {};
        const { shift = '', time = '' } = cell;
        const isEditing = editingCell && editingCell.row === rowIndex && editingCell.day === day;

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
          const softColor = SHIFT_COLORS[shift] || '#91caff';
          return (
            <Tooltip title={shift}>
              <Tag
                color={softColor}
                style={{
                    cursor: 'pointer',
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    lineHeight: '32px',
                    fontSize: 12,
                    textAlign: 'center',
                    paddingInline: 0,
                    borderRadius: 6,
                    fontWeight: 500,                 // 🔸 más marcado
                    boxShadow: 'inset 0 0 0 1px #ccc' // 🔸 más bloque visual
                  }}
                onClick={() => setEditingCell({ row: rowIndex, day })}
              >
                {(!isExportingPDF || shift || time) ? (time || shift) : ''}
              </Tag>
            </Tooltip>
          );
        }

        if (!isExportingPDF) {
          return (
            <div
              style={{ cursor: 'pointer', color: '#bfbfbf' }}
              onClick={() => setEditingCell({ row: rowIndex, day })}
            >
              +
            </div>
          );
        }

        return null; // 🚫 no mostrar + al exportar
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
        <Tag color="#91caff">AM Shift</Tag>
        <Tag color="#ffb3b3">PM Shift</Tag>
        <Tag color="#bfbfbf">OFF</Tag>
      </div>

      <Typography.Paragraph>
        <strong>Week Starting:</strong> {weekStart || '—'}
      </Typography.Paragraph>

      <motion.button
        whileTap={{ scale: 0.96 }}
        whileHover={{ scale: 1.03 }}
        animate={{
          backgroundColor: saveSuccess ? "#4BB543" : "#1677ff",
          transition: { duration: 0.3 }
        }}
        className={`ant-btn ant-btn-primary ${saving ? 'ant-btn-loading' : ''} ${shakeError ? 'shake' : ''}`}
        disabled={saving}
        onClick={handleSave}
        style={{
          borderRadius: 12,
          padding: '10px 24px',
          fontWeight: 600,
          fontSize: 15,
          color: 'white',
          backgroundColor: saveSuccess ? "#4BB543" : "#1677ff",
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
          border: 'none',
          transition: 'all 0.3s ease',
          marginBottom: 20
        }}
      >
        {saveSuccess ? '✅ Saved' : '💾 Save Roster'}
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.96 }}
        whileHover={{ scale: 1.03 }}
        onClick={handleExportPDF}
        style={{
          marginBottom: 20,
          marginLeft: 12,
          borderRadius: 12,
          padding: '10px 24px',
          fontWeight: 600,
          fontSize: 15,
          color: '#1677ff',
          backgroundColor: '#ffffff',
          border: '1px solid #1677ff',
          boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
          transition: 'all 0.3s ease'
        }}
      >
        📄 Export PDF
      </motion.button>

      <Table
        id="roster-table"
        className="compact-rows"
        columns={columns}
        dataSource={data.map((r, i) => ({ ...r, key: i }))}
        pagination={false}
        scroll={{ x: true }}
        bordered
        style={{ borderRadius: 8, overflow: 'hidden' }}
      />
    </Spin>
  );
};

export default RosterPage;
