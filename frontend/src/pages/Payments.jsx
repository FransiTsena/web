import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { paymentService, invoiceService } from '../services/api';
import { Plus, CreditCard, ArrowDownRight, ArrowUpRight, DollarSign, Clock, Trash2, Pencil } from 'lucide-react';
import Modal from '../components/Modal';

const Payments = () => {
  const [searchParams] = useSearchParams();
  const invoiceIdParam = searchParams.get('invoiceId');

  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [formData, setFormData] = useState({
    invoiceId: invoiceIdParam || '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    method: 'Transfer',
    notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payRes, invRes] = await Promise.all([
        paymentService.getAll(),
        invoiceService.getAll()
      ]);
      setPayments(payRes.data);
      setInvoices(invRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (invoiceIdParam) {
      setFormData(prev => ({ ...prev, invoiceId: invoiceIdParam }));
      setIsModalOpen(true);
    }
  }, [invoiceIdParam]);

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    setFormData({
      invoiceId: payment.invoiceId || '',
      amount: payment.amount || '',
      date: payment.date ? payment.date.split('T')[0] : new Date().toISOString().split('T')[0],
      method: payment.method || 'Transfer',
      notes: payment.notes || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPayment(null);
    setFormData({
      invoiceId: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      method: 'Transfer',
      notes: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount) || 0
      };

      if (editingPayment) {
        await paymentService.update(editingPayment._id, payload);
      } else {
        await paymentService.create(payload);
      }
      closeModal();
      fetchData();
    } catch (error) {
      console.error('Error saving payment:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this payment record?')) {
      try {
        await paymentService.delete(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting payment:', error);
      }
    }
  };

  const getInvoiceNumber = (id) => {
    const inv = invoices.find(i => i._id === id);
    return inv ? inv.invoiceNumber : 'Invoice Not Found';
  };

  const totalReceived = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalInvoiced = invoices.reduce((sum, i) => sum + (i.total || 0), 0);
  const totalPending = totalInvoiced - totalReceived;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="page-header">
        <h2 style={{ fontSize: '1.8rem' }}>Payments</h2>
        <button 
          className="pill-button active" 
          style={{ backgroundColor: 'var(--text-primary)', color: 'white' }}
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={18} />
          <span>Record Payment</span>
        </button>
      </div>

      <div className="payment-layout">
        {/* Summary Card */}
        <div className="glass-card" style={{ height: 'fit-content' }}>
           <h3>Summary</h3>
           <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '1rem' }}>
                 <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ backgroundColor: '#e8f5e9', padding: '0.5rem', borderRadius: '50%', color: '#4caf50' }}>
                       <ArrowDownRight size={20} />
                    </div>
                    <span>Total Received</span>
                 </div>
                 <span style={{ fontWeight: 'bold' }}>${totalReceived.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '1rem' }}>
                 <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ backgroundColor: '#fff3e0', padding: '0.5rem', borderRadius: '50%', color: '#ff9800' }}>
                       <Clock size={20} />
                    </div>
                    <span>Pending Invoices</span>
                 </div>
                 <span style={{ fontWeight: 'bold' }}>${Math.max(0, totalPending).toLocaleString()}</span>
              </div>
           </div>
        </div>

        {/* Recent Transactions */}
        <div className="glass-card">
           <h3 style={{ marginBottom: '1rem' }}>Recent Transactions</h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {loading ? (
                <p>Loading...</p>
              ) : payments.length > 0 ? (
                payments.map(payment => (
                  <div key={payment._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', borderBottom: '1px solid #f5f5f5' }}>
                     <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           <DollarSign size={20} color="#666" />
                        </div>
                        <div>
                           <p style={{ margin: 0, fontWeight: '600' }}>{getInvoiceNumber(payment.invoiceId)}</p>
                           <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(payment.date).toLocaleDateString()} • {payment.method}</p>
                        </div>
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <span style={{ fontWeight: 'bold', color: '#4caf50', fontSize: '1.1rem' }}>+${payment.amount?.toLocaleString()}</span>
                        <Pencil 
                          size={18} 
                          style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}
                          onClick={() => handleEdit(payment)}
                        />
                        <Trash2 
                          size={18} 
                          style={{ color: '#ff4d4d', cursor: 'pointer' }}
                          onClick={() => handleDelete(payment._id)}
                        />
                     </div>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>No payment history recorded.</p>
              )}
           </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingPayment ? "Edit Payment Record" : "Record Payment"}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '500' }}>Invoice</label>
            <select required style={{ padding: '0.8rem', borderRadius: '1rem', border: '1px solid #ddd' }}
              value={formData.invoiceId} onChange={(e) => {
                const invId = e.target.value;
                const inv = invoices.find(i => i._id === invId);
                setFormData({
                  ...formData, 
                  invoiceId: invId,
                  amount: inv ? inv.total : formData.amount
                });
              }}>
              <option value="">Select Invoice</option>
              {invoices.filter(i => i.status !== 'Paid' || i._id === formData.invoiceId).map(i => (
                <option key={i._id} value={i._id}>{i.invoiceNumber} - ${i.total?.toLocaleString()}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '500' }}>Amount ($)</label>
            <input required type="number" style={{ padding: '0.8rem', borderRadius: '1rem', border: '1px solid #ddd' }}
              value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '500' }}>Payment Date</label>
            <input type="date" style={{ padding: '0.8rem', borderRadius: '1rem', border: '1px solid #ddd' }}
              value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '500' }}>Method</label>
            <select style={{ padding: '0.8rem', borderRadius: '1rem', border: '1px solid #ddd' }}
              value={formData.method} onChange={(e) => setFormData({...formData, method: e.target.value})}>
              <option value="Transfer">Bank Transfer</option>
              <option value="PayPal">PayPal</option>
              <option value="Stripe">Stripe</option>
              <option value="Cash">Cash</option>
            </select>
          </div>
          <button type="submit" className="pill-button active" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
            Save Payment Record
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Payments;
