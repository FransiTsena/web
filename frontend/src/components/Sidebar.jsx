import React, { useState } from 'react';
import { Home, Users, Briefcase, FileText, CreditCard, PieChart, Menu, X, Bot } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { icon: <Home size={24} />, path: '/', label: 'Dashboard' },
    { icon: <Users size={24} />, path: '/clients', label: 'Clients' },
    { icon: <Briefcase size={24} />, path: '/projects', label: 'Projects' },
    { icon: <FileText size={24} />, path: '/invoices', label: 'Invoices' },
    { icon: <CreditCard size={24} />, path: '/payments', label: 'Payments' },
    { icon: <PieChart size={24} />, path: '/expenses', label: 'Expenses' },
    { icon: <Bot size={24} />, path: '/ai-chat', label: 'AI Assistant' },
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {!isOpen && (
        <button 
          className="mobile-toggle"
          onClick={toggleSidebar}
        >
          <Menu size={24} />
        </button>
      )}

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-wrapper">
            <img src="/logo.png" alt="Logo" className="logo-img" />
            <span className="sidebar-label logo-text">Freelance</span>
          </div>

          {/* Mobile Close Button */}
          <button 
            className="mobile-close"
            onClick={toggleSidebar}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="sidebar-menu">
          {menuItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              {item.icon}
              <span className="sidebar-label">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
      
      <div className={`sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={toggleSidebar}></div>
    </>
  );
};

export default Sidebar;
