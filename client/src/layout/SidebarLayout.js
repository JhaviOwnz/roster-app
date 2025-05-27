import React from 'react';
import { Layout, Menu } from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';

const { Sider, Content } = Layout;

const SidebarLayout = ({ children }) => {
  const location = useLocation();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" width={220}>
        {/* Logo o Título */}
        <div
          style={{
            color: 'white',
            fontSize: 20,
            fontWeight: 'bold',
            padding: '16px',
            textAlign: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          Kamana Roster
        </div>

        {/* Menú de navegación */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
        >
          <Menu.Item key="/roster" icon={<CalendarOutlined />}>
            <Link to="/roster">Roster</Link>
          </Menu.Item>
          <Menu.Item key="/shifts" icon={<ClockCircleOutlined />}>
            <Link to="/shifts">Shift Config</Link>
          </Menu.Item>
        </Menu>
      </Sider>

      {/* Contenido */}
      <Layout>
        <Content style={{ padding: '24px', background: '#fff' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default SidebarLayout;
