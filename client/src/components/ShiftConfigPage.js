import React, { useEffect, useState } from 'react';
import { Card, List, Button, Modal, TimePicker, message, Spin } from 'antd';
import axios from 'axios';
import dayjs from 'dayjs';

const ShiftConfigPage = () => {
  // Estados para gestionar los datos y la UI
  const [shifts, setShifts] = useState({});
  const [selectedShift, setSelectedShift] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Al montar el componente, obtener configuración desde el backend
  useEffect(() => {
    axios.get('http://localhost:5000/api/shifts')
      .then(res => {
        const fetchedShifts = res.data;
        const shiftsObject = {};
        fetchedShifts.forEach(shift => {
          shiftsObject[shift.name] = shift.times;
        });
        setShifts(shiftsObject);
      })
      .catch(() => message.error('Error loading shift config'));
  }, []);

  // Mostrar modal para agregar nuevo horario
  const showAddTimeModal = (shiftName) => {
    setSelectedShift(shiftName);
    setStartTime(null);
    setEndTime(null);
    setIsModalVisible(true);
  };

  // Guardar nuevo horario en el estado
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
    const updatedShifts = { ...shifts };

    if (!updatedShifts[selectedShift]) {
      updatedShifts[selectedShift] = [];
    }

    // Validar si ya existe
    if (updatedShifts[selectedShift].includes(newTime)) {
      message.warning('This time already exists for this shift.');
      return;
    }

    updatedShifts[selectedShift].push(newTime);
    setShifts(updatedShifts);
    setIsModalVisible(false);
    message.success(`Added time to ${selectedShift}`);
  };

  // Eliminar un horario de la lista
  const handleDeleteTime = (shiftName, index) => {
    const updatedShifts = { ...shifts };
    updatedShifts[shiftName].splice(index, 1);
    setShifts(updatedShifts);
  };

  // Confirmar y guardar todos los cambios al backend
  const handleSaveAll = () => {
    Modal.confirm({
      title: 'Are you sure you want to save all changes?',
      content: 'This will overwrite the shift configuration file.',
      okText: 'Yes, save',
      cancelText: 'Cancel',
      onOk: async () => {
        setIsSaving(true);

        // Convertimos de objeto a array con IDs para el backend
        const shiftsArray = Object.entries(shifts).map(([name, times], index) => ({
          id: index + 1,
          name,
          times
        }));

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
      }
    });
  };

  // Render principal
  return (
    <Spin spinning={isSaving}>
      <div style={{ padding: 20 }}>
        <h1>Shift Configuration</h1>

        {/* Tarjetas para cada tipo de turno */}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {Object.keys(shifts).map(shiftName => (
            <Card
              key={shiftName}
              title={shiftName}
              style={{ width: 250 }}
              actions={[
                <Button type="primary" onClick={() => showAddTimeModal(shiftName)}>Add Time</Button>
              ]}
            >
              <List
                dataSource={shifts[shiftName]}
                renderItem={(time, index) => (
                  <List.Item
                    actions={[
                      <Button
                        type="link"
                        danger
                        onClick={() => handleDeleteTime(shiftName, index)}
                      >
                        Delete
                      </Button>
                    ]}
                  >
                    {time}
                  </List.Item>
                )}
                locale={{ emptyText: 'No times configured' }}
              />
            </Card>
          ))}
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
          style={{ marginTop: 20 }}
          onClick={handleSaveAll}
        >
          Save All Changes
        </Button>
      </div>
    </Spin>
  );
};

export default ShiftConfigPage;
