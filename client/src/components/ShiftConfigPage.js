import React, { useEffect, useState } from 'react';
import { Card, List, Button, Modal, TimePicker, message, Spin, Tooltip, Input } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const ShiftConfigPage = () => {
  // 🧐 Estados para gestionar los datos y la UI
  const [newOffReason, setNewOffReason] = useState(""); //Estados de dayoff
  const [timedShifts, setTimedShifts] = useState({}); // Shifts con horarios
  const [offShifts, setOffShifts] = useState([]);     // Shifts sin horarios (ej. OFF, ACC)
  const [selectedShift, setSelectedShift] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false); // ✅ Modal de confirmación para guardar

  // ➛ Al montar el componente, obtener configuración desde el backend
  useEffect(() => {
    axios.get('http://localhost:5000/api/shifts')
      .then(res => {
        const fetchedShifts = res.data;
        const shiftsObject = {};
        const offOnly = [];

        fetchedShifts.forEach(shift => {
          if (shift.times && shift.times.length > 0) {
            shiftsObject[shift.name] = shift.times;
          } else {
            offOnly.push(shift.name);
          }
        });

        setTimedShifts(shiftsObject);
        setOffShifts(offOnly);
      })
      .catch(() => message.error('Error loading shift config'));
  }, []);

  // ➕ Mostrar modal para agregar nuevo horario
  const showAddTimeModal = (shiftName) => {
    setSelectedShift(shiftName);
    setStartTime(null);
    setEndTime(null);
    setIsModalVisible(true);
  };

  // 📂 Guardar nuevo horario en el estado local
  const handleAddTime = () => {
    if (!startTime || !endTime) {
      message.error('Please select both start and end time');
      return;
    }

    if (startTime.isAfter(endTime) || startTime.isSame(endTime)) {
      message.error('Start time must be before end time');
      return;
    }

    const newTime = `${startTime.format('HH:mm')}-${endTime.format('HH:mm')}`;
    const updated = { ...timedShifts };

    if (!updated[selectedShift]) {
      updated[selectedShift] = [];
    }

    if (updated[selectedShift].includes(newTime)) {
      message.warning('This time already exists for this shift.');
      return;
    }

    updated[selectedShift].push(newTime);
    setTimedShifts(updated);
    setIsModalVisible(false);
    message.success(`Added time to ${selectedShift}`);
  };

  // ❌ Eliminar un horario específico
  const handleDeleteTime = (shiftName, index) => {
    const updated = { ...timedShifts };
    updated[shiftName].splice(index, 1);
    setTimedShifts(updated);
  };

  // ❌ Eliminar un motivo OFF
  const handleDeleteOff = (shiftName) => {
    const updated = offShifts.filter(name => name !== shiftName);
    setOffShifts(updated);
  };

  // ➕ Agregar un nuevo motivo OFF
  const handleAddOffReason = () => {
    const trimmed = newOffReason.trim().toUpperCase();
    if (!trimmed) return;
    if (timedShifts[trimmed] || offShifts.includes(trimmed)) {
      message.warning("That shift already exists.");
      return;
    }
    setOffShifts([...offShifts, trimmed]);
    setNewOffReason("");
    message.success(`Added "${trimmed}" as new OFF Reason`);
  };

  // 📂 Confirmar y guardar todos los cambios en el backend
  const handleSaveAll = async () => {
    setIsSaving(true);
    setConfirmVisible(false);

    const shiftsArray = [
      ...Object.entries(timedShifts).map(([name, times], index) => ({
        id: index + 1,
        name,
        times
      })),
      ...offShifts.map((name, idx) => ({
        id: Object.keys(timedShifts).length + idx + 1,
        name,
        times: []
      }))
    ];

    console.log("Saving shifts:", shiftsArray);

    try {
      const response = await axios.put('http://localhost:5000/api/shifts', shiftsArray, {
        headers: { 'Content-Type': 'application/json' }
      });

      console.log("Response from backend:", response.data);
      message.success('All shifts saved successfully!');
    } catch (err) {
      console.error("Error saving shifts:", err);
      message.error('Error saving shifts');
    } finally {
      setIsSaving(false);
    }
  };

  // 🖼 Render principal
  return (
    <Spin spinning={isSaving}>
      <div style={{ padding: 20 }}>
        <h1>Shift Configuration</h1>

        {/* Sección de turnos con horarios + OFF en el mismo contenedor flex */}
        <h2>⏱ Timed Shifts</h2>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {Object.keys(timedShifts).map(shiftName => (
            <Card
              key={shiftName}
              title={shiftName}
              style={{ width: 250 }}
              actions={[
                <Button type="primary" onClick={() => showAddTimeModal(shiftName)}>Add Time</Button>
              ]}
            >
              <List
                dataSource={timedShifts[shiftName]}
                renderItem={(time, index) => (
                  <List.Item
                    actions={[
                      <Tooltip title="Delete time">
                        <Button
                          type="text"
                          icon={<DeleteOutlined />}
                          danger
                          onClick={() => handleDeleteTime(shiftName, index)}
                          aria-label="Delete shift time"
                        />
                      </Tooltip>
                    ]}
                  >
                    {time}
                  </List.Item>
                )}
                locale={{ emptyText: 'No times configured' }}
              />
            </Card>
          ))}

          {/* Tarjeta OFF Reasons dentro del mismo grid */}
          <Card
            title="🚫 OFF Reasons"
            style={{ width: 250 }}
            actions={[
              <Input.Search
                placeholder="Add reason (e.g. SICK)"
                enterButton="Add"
                value={newOffReason}
                onChange={(e) => setNewOffReason(e.target.value)}
                onSearch={handleAddOffReason}
              />
            ]}
          >
            <List
              dataSource={offShifts}
              renderItem={(reason) => (
                <List.Item
                  actions={[
                    <Tooltip title="Delete reason">
                      <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        danger
                        onClick={() => handleDeleteOff(reason)}
                      />
                    </Tooltip>
                  ]}
                >
                  {reason}
                </List.Item>
              )}
              locale={{ emptyText: 'No OFF reasons added' }}
            />
          </Card>
        </div>

        {/* Modal para agregar horario */}
        <Modal
          title={`Add Time to ${selectedShift}`}
          open={isModalVisible}
          onOk={handleAddTime}
          onCancel={() => setIsModalVisible(false)}
        >
          <div style={{ display: 'flex', gap: '10px' }}>
            <TimePicker
              value={startTime}
              onChange={setStartTime}
              format="HH:mm"
              placeholder="Start"
            />
            <TimePicker
              value={endTime}
              onChange={setEndTime}
              format="HH:mm"
              placeholder="End"
            />
          </div>
        </Modal>

        {/* Botón principal para guardar todo */}
        <Button
          type="primary"
          style={{ marginTop: 30 }}
          onClick={() => setConfirmVisible(true)}
        >
          Save All Changes
        </Button>
      </div>

      {/* Modal de confirmación */}
      <Modal
        title="Confirm Save"
        open={confirmVisible}
        onOk={handleSaveAll}
        onCancel={() => setConfirmVisible(false)}
        okText="Yes, save"
        cancelText="Cancel"
      >
        <p>This will overwrite the shift configuration file.</p>
      </Modal>
    </Spin>
  );
};

export default ShiftConfigPage;