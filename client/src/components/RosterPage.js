import React, { useEffect, useState } from 'react';
import { Table, Select, Typography, Button, message, Tag, Spin } from 'antd';
import axios from 'axios';
import fetchEmployees from "../api/employees";

const { Option } = Select;
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const RosterPage = () => {
  const [data, setData] = useState([]); // 🧍‍♂️ Empleados y sus turnos semanales
  const [weekStart] = useState(''); // 📆 Fecha de inicio (placeholder para mejora futura)
  const [shifts, setShifts] = useState([]); // 📂 Shifts cargados desde backend
  const [loading, setLoading] = useState(true); // ⏳ Estado de carga inicial

// 🔄 Obtener empleados y shifts al iniciar
useEffect(() => {
  Promise.all([
    fetchEmployees(),
    fetch('/api/shifts').then(res => res.json()) // 👉 reemplaza axios.get
  ])
  .then(([employees, shifts]) => {
    const initialData = employees.map(emp => ({
      name: emp.name,
      Mon: {}, Tue: {}, Wed: {}, Thu: {}, Fri: {}, Sat: {}, Sun: {},
    }));
    setData(initialData);
    setShifts(shifts); // 👉 ya no es shiftRes.data porque fetch devuelve directamente los datos
  })
  .catch(() => message.error("Error loading data"))
  .finally(() => setLoading(false));
}, []);
  // 🧠 Separar turnos por tipo
  const timeOptions = shifts.filter(s => s.times.length > 0);
  const offOptions = shifts.filter(s => s.times.length === 0);

  // ✅ Guardar el roster al backend
  const handleSave = () => {
    const formatted = data.map(row => {
      const entry = { name: row.name };
      days.forEach(day => {
        entry[day] = row[day]?.time || row[day]?.shift || "";
      });
      return entry;
    });

    axios.post('/api/rosters', { weekStart, data: formatted })
      .then(() => message.success('Roster saved!'))
      .catch(() => message.error('Error saving roster'));
  };

  // ✏️ Cambiar el shift seleccionado
  const handleShiftChange = (value, rowIndex, day) => {
    const updated = [...data];
    updated[rowIndex][day] = { shift: value, time: '' };
    setData(updated);
  };

  // ⏰ Cambiar el horario seleccionado
  const handleTimeChange = (value, rowIndex, day) => {
    const updated = [...data];
    updated[rowIndex][day].time = value;
    setData(updated);
  };

  // 🧱 Columnas dinámicas
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      fixed: 'left',
      width: 120,
    },
    ...days.map(day => ({
      title: day,
      dataIndex: day,
      render: (_, record, rowIndex) => {
        const current = data[rowIndex][day] || {};
        const shift = current.shift || "";
        const time = current.time || "";

        // 🎨 Determinar color visual del tag final
        let bgColor = '';
        if (shift === 'OFF') bgColor = '#d9d9d9';
        else if (shift === 'AM') bgColor = '#69c0ff';
        else if (shift === 'PM') bgColor = '#ff7875';

        return (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Select
              value={shift || undefined}
              placeholder="Shift"
              onChange={(value) => handleShiftChange(value, rowIndex, day)}
              style={{ width: '100%', marginBottom: 4 }}
            >
              {timeOptions.map(s => (
                <Option key={s.name} value={s.name}>{s.name}</Option>
              ))}
              {offOptions.map(s => (
                <Option key={s.name} value={s.name}>{s.name}</Option>
              ))}
            </Select>

            {shift && timeOptions.find(s => s.name === shift) && (
              <Select
                value={time || undefined}
                placeholder="Time"
                onChange={(value) => handleTimeChange(value, rowIndex, day)}
                style={{ width: '100%', backgroundColor: bgColor, color: 'white' }}
              >
                {timeOptions.find(s => s.name === shift)?.times.map(t => (
                  <Option key={t} value={t}>{t}</Option>
                ))}
              </Select>
            )}

            {shift && offOptions.find(s => s.name === shift) && (
              <div
                style={{
                  width: '100%',
                  padding: '5px 8px',
                  backgroundColor: bgColor,
                  color: 'black',
                  textAlign: 'center',
                  borderRadius: 4
                }}
              >
                {shift}
              </div>
            )}
          </div>
        );
      }
    }))
  ];

  // 🖼 Render final
  return (
    <Spin spinning={loading}>
      <Typography.Title level={2} style={{ marginBottom: 8 }}>Roster</Typography.Title>

      {/* 🎨 Leyenda de colores */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <Tag color="#69c0ff">AM Shift</Tag>
        <Tag color="#ff7875">PM Shift</Tag>
        <Tag color="#d9d9d9">OFF</Tag>
      </div>

      <Typography.Paragraph><strong>Week Starting:</strong> {weekStart}</Typography.Paragraph>

      <Button type="primary" onClick={handleSave} style={{ marginBottom: 16 }}>
        Save Roster
      </Button>

      <Table
        columns={columns}
        dataSource={data.map((row, i) => ({ ...row, key: i }))}
        pagination={false}
        scroll={{ x: true }}
        bordered
      />
    </Spin>
  );
};

export default RosterPage;
