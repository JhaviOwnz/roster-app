import React, { useEffect, useState } from 'react';
import { Table, Input, Typography, Button, message, Tag } from 'antd';
import axios from 'axios';
import fetchEmployees from "../api/employees";

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const RosterPage = () => {
  // 📆 Estado para el roster semanal y datos de empleados
  const [data, setData] = useState([]);
  const [weekStart] = useState(''); // ✉️ Este campo podría expandirse para seleccionar semana

  // 📅 Obtener datos iniciales de empleados desde backend
  useEffect(() => {
    fetchEmployees()
      .then(employees => {
        const initialData = employees.map(emp => ({
          name: emp.name,
          Mon: "",
          Tue: "",
          Wed: "",
          Thu: "",
          Fri: "",
          Sat: "",
          Sun: "",
        }));
        setData(initialData);
      })
      .catch(err => console.error("Error loading employees:", err));
  }, []);

  // 🖫 Enviar datos al backend para guardarlos
  const handleSave = () => {
    axios.post('/api/rosters', { weekStart, data })
      .then(() => message.success('Roster saved!'))
      .catch(() => message.error('Error saving roster'));
  };

  // 📂 Actualizar valores del roster al editar celdas
  const handleInputChange = (value, rowIndex, day) => {
    const updated = [...data];
    updated[rowIndex][day] = value.toUpperCase();
    setData(updated);
  };

  // 🎨 Asignar color según tipo de turno
  const getShiftColor = (text) => {
    if (!text) return undefined;
    if (text === 'OFF' || text === 'ACC') return '#595959';
    if (text === 'ANNUAL L.') return '#faad14';
    if (/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(text)) return '#1890ff';
    return '#d4380d'; // Turno inválido o desconocido
  };

  // 🔢 Definir columnas para cada día + nombre
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      fixed: 'left',
      width: 100,
    },
    ...days.map(day => ({
      title: day,
      dataIndex: day,
      render: (text, record, index) => (
        <Input
          value={text}
          onChange={e => handleInputChange(e.target.value, index, day)}
          style={{
            backgroundColor: getShiftColor(text),
            color: text ? 'white' : undefined,
            textAlign: 'center',
            border: 'none',
            borderRadius: 4
          }}
        />
      )
    })),
  ];

  // 🖼 Render principal
  return (
    <>
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
    </>
  );
};

export default RosterPage;
