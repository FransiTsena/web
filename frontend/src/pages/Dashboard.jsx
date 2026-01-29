import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronUp, ChevronDown, Scale, Plus, Calendar, FileText, CreditCard, Activity, Users, Layers, DollarSign } from 'lucide-react';
import { contributionService, clientService, projectService, invoiceService, expenseService } from '../services/api';

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const [contributions, setContributions] = useState([]);
  const [stats, setStats] = useState({
    clients: 0,
    projects: 0,
    revenue: 0,
    expenses: 0,
    pendingInvoices: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contr, clients, projects, invoices, expenses] = await Promise.all([
          contributionService.getForYear(new Date().getFullYear()),
          clientService.getAll(),
          projectService.getAll(),
          invoiceService.getAll(),
          expenseService.getAll()
        ]);

        setContributions(contr.data);
        
        const totalRevenue = invoices.data.reduce((acc, inv) => acc + (inv.total || inv.amount || 0), 0);
        const totalExpenses = expenses.data.reduce((acc, exp) => acc + (exp.amount || 0), 0);
        const pendingCount = invoices.data.filter(i => i.status === 'Pending').length;

        setStats({
          clients: clients.data.length,
          projects: projects.data.length,
          revenue: totalRevenue,
          expenses: totalExpenses,
          pendingInvoices: pendingCount
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="stat-grid">
        <StatCard 
          title="Total Revenue" 
          value={`$${stats.revenue.toLocaleString()}`} 
          icon={<DollarSign size={20} />} 
          trend="+0%" 
          color="var(--accent-color)" 
          onClick={() => navigate('/payments')}
        />
        <StatCard 
          title="Active Projects" 
          value={stats.projects} 
          icon={<Layers size={20} />} 
          trend="+0" 
          color="#e0e0e0" 
          onClick={() => navigate('/projects')}
        />
        <StatCard 
          title="Total Clients" 
          value={stats.clients} 
          icon={<Users size={20} />} 
          trend="+0" 
          color="#e0e0e0" 
          onClick={() => navigate('/clients')}
        />
        <StatCard 
          title="Total Expenses" 
          value={`$${stats.expenses.toLocaleString()}`} 
          icon={<CreditCard size={20} />} 
          trend="-0%" 
          color="#ff8e8e" 
          onClick={() => navigate('/expenses')}
        />
      </div>

      <div className="content-row">
        {/* Main Activity Graph */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>
          <div className="glass-card" style={{ overflow: 'hidden' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}>Contribution Activity</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Year {new Date().getFullYear()}</span>
             </div>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(53, 1fr)', gap: '4px', overflowX: 'auto', paddingBottom: '1rem', cursor: 'grab' }}>
                {contributions.length > 0 ? contributions.map((day, idx) => (
                  <div 
                    key={idx}
                    title={`${day.date}: ${day.count} activities`}
                    style={{ 
                      minWidth: '12px', 
                      height: '12px', 
                      borderRadius: '2px',
                      backgroundColor: day.level === 0 ? '#ebebe2' : 
                                       day.level === 1 ? '#ffe0b2' : 
                                       day.level === 2 ? '#ffb74d' : 
                                       day.level === 3 ? '#ff9800' : '#f57c00'
                    }}
                  />
                )) : Array.from({ length: 365 }).map((_, i) => (
                   <div key={i} style={{ minWidth: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#ebebe2' }} />
                ))}
             </div>
             <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                <span>Less</span>
                <div style={{ width: '10px', height: '10px', backgroundColor: '#ebebe2', borderRadius: '2px' }} />
                <div style={{ width: '10px', height: '10px', backgroundColor: '#ffe0b2', borderRadius: '2px' }} />
                <div style={{ width: '10px', height: '10px', backgroundColor: '#ffb74d', borderRadius: '2px' }} />
                <div style={{ width: '10px', height: '10px', backgroundColor: '#ff9800', borderRadius: '2px' }} />
                <div style={{ width: '10px', height: '10px', backgroundColor: '#f57c00', borderRadius: '2px' }} />
                <span>More</span>
             </div>
          </div>

          <div className="content-row">
            <ProjectTimelineMonth 
              month="Current Status" 
              weeks="Live Data" 
              items={[
                { 
                  type: 'invoice', 
                  label: 'Pending Invoices', 
                  value: stats.pendingInvoices, 
                  color: '#eee',
                  onClick: () => navigate('/invoices')
                },
                { 
                  type: 'project', 
                  label: 'Total Projects', 
                  value: stats.projects, 
                  trend: '+0', 
                  status: 'low',
                  onClick: () => navigate('/projects')
                }
              ]} 
            />
          </div>
        </div>

        {/* Right side Profile/Detail Panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ height: '100%', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Account Summary</h3>
              <Activity size={20} color="var(--accent-color)" />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1, justifyContent: 'center' }}>
               <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--accent-color)', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <Users size={40} color="black" />
                  </div>
                  <h2 style={{ marginTop: '1rem', marginBottom: '0.25rem' }}>{user?.name || 'Freelancer'}</h2>
                  <p style={{ color: 'var(--text-secondary)' }}>Member since {new Date().getFullYear()}</p>
               </div>

               <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid #eee', paddingTop: '2rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Net Income</p>
                    <p style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>${(stats.revenue - stats.expenses).toLocaleString()}</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Profit Margin</p>
                    <p style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                      {stats.revenue > 0 ? Math.round(((stats.revenue - stats.expenses) / stats.revenue) * 100) : 0}%
                    </p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, trend, color, onClick }) => (
  <div 
    className="glass-card" 
    style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', cursor: onClick ? 'pointer' : 'default' }}
    onClick={onClick}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <span style={{ fontSize: '0.8rem', color: '#4caf50', fontWeight: 'bold' }}>{trend}</span>
    </div>
    <div style={{ marginTop: '0.5rem' }}>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{title}</p>
      <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem' }}>{value}</h3>
    </div>
  </div>
);

const ProjectTimelineMonth = ({ month, weeks, items }) => (
  <div style={{ flex: 1, position: 'relative' }}>
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
      <div style={{ backgroundColor: 'var(--accent-color)', width: '30px', height: '30px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <FileText size={16} color="black" />
      </div>
      <div>
        <h4 style={{ margin: 0 }}>{month}</h4>
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{weeks}</p>
      </div>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {items.map((item, i) => (
        <div 
          key={i} 
          className="glass-card" 
          style={{ border: 'none', position: 'relative', cursor: item.onClick ? 'pointer' : 'default' }}
          onClick={item.onClick}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
               <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.type === 'invoice' ? <CreditCard size={14} /> : <Activity size={14} />}
               </div>
               <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{item.label}</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.value}</span>
          </div>
          {item.type === 'project' && (
            <div style={{ marginTop: '0.5rem', backgroundColor: '#e2e4e1', height: '40px', borderRadius: '20px', display: 'flex', alignItems: 'center', padding: '0 1rem', justifyContent: 'space-between' }}>
               <div style={{ width: '30%', height: '8px', backgroundColor: item.status === 'high' ? 'black' : 'white', borderRadius: '4px' }}></div>
               <span style={{ color: (item.trend || '').startsWith('+') ? 'red' : 'green', fontWeight: 'bold' }}>{item.trend}</span>
            </div>
          )}
        </div>
      ))}
    </div>

    <div style={{ position: 'absolute', left: '15px', top: '40px', bottom: 0, width: '2px', backgroundColor: '#ccc', zIndex: -1 }}></div>
  </div>
);

export default Dashboard;
