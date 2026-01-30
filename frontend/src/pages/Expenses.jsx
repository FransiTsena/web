import React, { useState, useEffect } from 'react';
import { expenseService } from '../services/api';
import { Plus, Tag, Calendar, PieChart, ShoppingCart, Coffee, Home, Truck, Trash2, Pencil } from 'lucide-react';
import Modal from '../components/Modal';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Software',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await expenseService.getAll();
      setExpenses(response.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description || '',
      amount: expense.amount || '',
      category: expense.category || 'Software',
      date: expense.date ? expense.date.split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
    setFormData({
      description: '',
      amount: '',
      category: 'Software',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount) || 0
      };

      if (editingExpense) {
        await expenseService.update(editingExpense._id, payload);
      } else {
        await expenseService.create(payload);
      }
      closeModal();
      fetchExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await expenseService.delete(id);
        fetchExpenses();
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }
  };

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'software': return <ShoppingCart size={18} />;
      case 'travel': return <Truck size={18} />;
      case 'office': return <Home size={18} />;
      case 'food': return <Coffee size={18} />;
      default: return <Tag size={18} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="page-header">
        <h2 style={{ fontSize: '1.8rem' }}>Expenses</h2>
        <button
          className="pill-button active"
          style={{ backgroundColor: 'var(--text-primary)', color: 'white' }}
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={18} />
          <span>Add Expense</span>
        </button>
      </div>

      <div className="responsive-grid">
        {loading ? (
          <p>Loading...</p>
        ) : expenses.length > 0 ? (
          expenses.map(expense => (
            <div key={expense._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                  {getCategoryIcon(expense.category)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Br {expense.amount?.toFixed(2)}</span>
                  <Pencil
                    size={18}
                    style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}
                    onClick={() => handleEdit(expense)}
                  />
                  <Trash2
                    size={18}
                    style={{ color: '#ff4d4d', cursor: 'pointer' }}
                    onClick={() => handleDelete(expense._id)}
                  />
                </div>
              </div>
              <div>
                <h4 style={{ margin: 0 }}>{expense.description}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{expense.category || 'General'}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 'auto' }}>
                <Calendar size={14} />
                <span>{new Date(expense.date).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
            <PieChart size={48} color="#eee" style={{ marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-secondary)' }}>No expenses tracked. Keep your budget in check by adding your first expense.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingExpense ? "Edit Expense" : "Add Expense"}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '500' }}>Description</label>
            <input required type="text" style={{ padding: '0.8rem', borderRadius: '1rem', border: '1px solid #ddd' }}
              value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '500' }}>Amount (Br)</label>
            <input required type="number" style={{ padding: '0.8rem', borderRadius: '1rem', border: '1px solid #ddd' }}
              value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '500' }}>Category</label>
            <select style={{ padding: '0.8rem', borderRadius: '1rem', border: '1px solid #ddd' }}
              value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
              <option value="Software">Software</option>
              <option value="Travel">Travel</option>
              <option value="Office">Office</option>
              <option value="Food">Food</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '500' }}>Date</label>
            <input type="date" style={{ padding: '0.8rem', borderRadius: '1rem', border: '1px solid #ddd' }}
              value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
          </div>
          <button type="submit" className="pill-button active" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
            Add Expense
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Expenses;
