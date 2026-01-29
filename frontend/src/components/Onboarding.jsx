import React, { useState } from 'react';
import { User, Rocket } from 'lucide-react';

const Onboarding = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [isNewcomer, setIsNewcomer] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const userData = {
      name: name.trim(),
      isNewcomer,
      onboardedAt: new Date().toISOString()
    };

    localStorage.setItem('freelance_user', JSON.stringify(userData));
    onComplete(userData);
  };

  return (
    <div style={{ 
      height: '100vh', 
      width: '100vw', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div className="glass-card" style={{ 
        width: '90%',
        maxWidth: '400px', 
        padding: '2.5rem', 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>Welcome!</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Let's personalize your dashboard experience.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '500' }}>What should we call you?</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
              <input 
                required 
                type="text" 
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '1rem 1rem 1rem 2.5rem', 
                  borderRadius: '1rem', 
                  border: '1px solid #ddd',
                  outline: 'none',
                  fontSize: '1rem'
                }} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input 
              type="checkbox" 
              id="newcomer" 
              checked={isNewcomer}
              onChange={(e) => setIsNewcomer(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="newcomer" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>I am new to freelancing</label>
          </div>

          <button type="submit" className="pill-button active" style={{ 
            width: '100%', 
            justifyContent: 'center', 
            padding: '1rem',
            marginTop: '1rem'
          }}>
            Get Started
          </button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
