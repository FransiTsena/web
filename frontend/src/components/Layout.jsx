import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children, user, onLogout }) => {
  return (
    <div className="dashboard-container">
      <Sidebar onLogout={onLogout} />
      <div className="main-content">
        <Header user={user} />
        <div style={{ flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
