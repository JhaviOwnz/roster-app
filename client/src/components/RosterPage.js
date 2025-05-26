import React, { useEffect, useState } from 'react';
import { Table, Input, Typography, Button, message } from 'antd';
import axios from 'axios';
import fetchEmployees from "../api/employees";




const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const RosterPage = () => {
  
  const [data, setData] = useState([]);
  const [weekStart] = useState('');


  // Obtener los datos del backend al cargar
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
  


  // Guardar al backend
  const handleSave = () => {
    axios.post('/api/rosters', { weekStart, data })
      .then(() => message.success('Roster saved!'))
      .catch(() => message.error('Error saving roster'));
  };

  // Actualizar valores cuando se editan
  const handleInputChange = (value, rowIndex, day) => {
    const updated = [...data];
    updated[rowIndex][day] = value;
    setData(updated);
  };

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
            backgroundColor:
              text === 'OFF' ? '#595959' :
              text === 'Annual L.' ? '#faad14' :
              '#1890ff',
            color: 'white',
            textAlign: 'center',
            border: 'none',
            borderRadius: 4
          }}
        />
      )
    })),
  ];

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
