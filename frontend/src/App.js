import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Onboarding from './components/Onboarding';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Projects from './pages/Projects';
import Invoices from './pages/Invoices';
import Payments from './pages/Payments';
import Expenses from './pages/Expenses';
import AIChat from './pages/AIChat';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('freelance_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  if (loading) return null;

  if (!user) {
    return <Onboarding onComplete={(userData) => setUser(userData)} />;
  }

  return (
    <Router>
      <Layout user={user}>
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/ai-chat" element={<AIChat />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
