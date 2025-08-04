import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Typography } from 'antd';
import {
  FileTextOutlined,
  SettingOutlined,
  LogoutOutlined,
  CoffeeOutlined
} from '@ant-design/icons';

const MainPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <Typography.Title level={2} style={{ marginBottom: 8 }}>
        Hello, Pablo 👋
      </Typography.Title>
      <Typography.Text style={{ fontSize: 16, color: '#888' }}>
        What would you like to do today?
      </Typography.Text>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 24,
        maxWidth: 700,
        margin: '40px auto'
      }}>
        <Button
          type="primary"
          icon={<FileTextOutlined />}
          size="large"
          onClick={() => navigate('/roster')}
          style={{ height: 80, fontSize: 16 }}
        >
          View Weekly Roster
        </Button>

        <Button
          type="primary"
          icon={<CoffeeOutlined />}
          size="large"
          onClick={() => navigate('/kitchen')}
          style={{ height: 80, fontSize: 16 }}
        >
          Kitchen View
        </Button>

        <Button
          type="primary"
          icon={<SettingOutlined />}
          size="large"
          onClick={() => navigate('/shifts')}
          style={{ height: 80, fontSize: 16 }}
        >
          Shift Configuration
        </Button>

        <Button
          danger
          icon={<LogoutOutlined />}
          size="large"
          onClick={handleLogout}
          style={{ height: 80, fontSize: 16 }}
        >
          Log Out
        </Button>
      </div>
    </div>
  );
};

export default MainPage;
