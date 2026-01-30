import React, { useState, useEffect } from 'react';
import { Search, Calendar, Pill, Activity, FlaskConical, Thermometer, ChevronDown, Receipt } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { clientService, projectService, invoiceService, paymentService, expenseService } from '../services/api';

const Header = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState({
    projects: 0,
    clients: 0,
    pendingInvoices: 0,
    pendingAmount: 0,
    totalBilled: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    activeHours: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [projects, clients, invoices, payments, expenses] = await Promise.all([
          projectService.getAll(),
          clientService.getAll(),
          invoiceService.getAll(),
          paymentService.getAll(),
          expenseService.getAll()
        ]);

        const ongoingProjects = projects.data.filter(p => p.status === 'Ongoing' || p.status === 'In Progress' || p.status === 'in progress').length;
        const pendingInvoices = invoices.data.filter(i => i.status === 'Pending').length;
        const pendingAmount = invoices.data
          .filter(i => i.status === 'Pending')
          .reduce((sum, inv) => sum + (inv.total || inv.amount || 0), 0);

        // Calculate monthly revenue (simple sum of payments this month)
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        const monthlyRev = payments.data
          .filter(p => {
            const d = new Date(p.date);
            return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
          })
          .reduce((sum, p) => sum + (p.amount || 0), 0);

        const monthlyExp = expenses.data
          .filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
          })
          .reduce((sum, e) => sum + (e.amount || 0), 0);

        setStats({
          projects: ongoingProjects,
          clients: clients.data.length,
          pendingInvoices,
          pendingAmount,
          monthlyRevenue: monthlyRev,
          monthlyExpenses: monthlyExp,
          activeHours: 0
        });
      } catch (error) {
        console.error('Error fetching header stats:', error);
      }
    };

    fetchStats();

    // Listen for data updates from other components
    window.addEventListener('dataUpdated', fetchStats);

    // Refresh stats when location changes (in case navigation changes something)
    window.addEventListener('popstate', fetchStats);

    return () => {
      window.removeEventListener('dataUpdated', fetchStats);
      window.removeEventListener('popstate', fetchStats);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Navigation Bar */}
      <div className="header-top">
        <h1 style={{ fontSize: '2.5rem', fontWeight: '500', margin: 0 }}>Freelance Dashboard</h1>

        <div className="header-pills">
          <button
            className={`pill-button ${location.pathname === '/' ? 'active' : ''}`}
            onClick={() => navigate('/')}
          >
            <Search size={18} />
            <span>Overview</span>
          </button>
          <button
            className={`pill-button ${location.pathname === '/projects' ? 'active' : ''}`}
            onClick={() => navigate('/projects')}
          >
            <Calendar size={18} />
            <span>Timeline</span>
          </button>
          <button
            className="pill-button"
            onClick={() => navigate('/expenses')}
          >
            <Activity size={18} />
            <span>Analytics</span>
          </button>
          <button
            className="pill-button"
            onClick={() => navigate('/invoices')}
          >
            <FlaskConical size={18} />
            <span>Reports</span>
          </button>
        </div>
      </div>

      {/* Profile and Quick Stats Section */}
      <div className="profile-stats-row">
        <div className="glass-card profile-card" style={{ position: 'relative' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            overflow: 'hidden',
            backgroundColor: 'var(--accent-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Activity size={40} color="black" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Welcome back,</p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', margin: 0 }}>{user?.name || 'Freelancer'}</h2>
          </div>
        </div>

        <div className="glass-card profile-metrics" style={{ flex: 1, display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          <StatItem label="Active Projects" value={stats.projects} subValue={`Across ${stats.clients} clients`} />
          <StatItem label="Pending Invoices" value={stats.pendingInvoices} subValue={`Br ${stats.pendingAmount.toLocaleString()}`} />
          <StatItem label="Monthly Revenue" value={`Br ${stats.monthlyRevenue.toLocaleString()}`} subValue="This month" />
          <StatItem label="Monthly Expenses" value={`Br ${stats.monthlyExpenses.toLocaleString()}`} subValue="This month" />
          <StatItem label="Completion Rate" value="100%" subValue="On-time delivery" />
        </div>
      </div>

      <div className="header-actions" style={{ display: 'flex', gap: '1rem' }}>
        <button className="pill-button" onClick={() => navigate('/clients')}>Active Clients</button>
        <button className="pill-button active" style={{ backgroundColor: 'white' }} onClick={() => navigate('/projects')}>Quick Tasks</button>
        <button className="pill-button" style={{ backgroundColor: 'white' }} onClick={() => navigate('/projects')}>Upcoming Deadlines</button>
      </div>
    </div>
  );
};

const StatItem = ({ label, value, subValue }) => (
  <div style={{ textAlign: 'left' }}>
    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>{label}</p>
    <h3 style={{ fontSize: '1.8rem', fontWeight: '500', margin: 0 }}>{value}</h3>
    <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{subValue}</p>
  </div>
);

export default Header;
