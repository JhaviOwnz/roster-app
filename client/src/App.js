import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainPage from './components/MainPage';
import RosterPage from './components/RosterPage';
import ShiftConfigPage from './components/ShiftConfigPage';
import SidebarLayout from './layout/SidebarLayout';

const App = () => {
  return (
    <Router>
      <SidebarLayout>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/roster" element={<RosterPage />} />
          <Route path="/shifts" element={<ShiftConfigPage />} />
        </Routes>
      </SidebarLayout>
    </Router>
  );
};

export default App;