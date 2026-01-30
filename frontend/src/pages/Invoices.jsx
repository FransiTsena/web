import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { invoiceService, clientService, projectService, paymentService } from '../services/api';
import { Plus, FileText, Download, Printer, CheckCircle, Clock, Trash2, X, DollarSign, Pencil, Eye } from 'lucide-react';
import Modal from '../components/Modal';

const Invoices = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const clientIdFilter = searchParams.get('clientId');
  const projectIdFilter = searchParams.get('projectId');

  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    clientId: clientIdFilter || '',
    projectId: projectIdFilter || '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    status: 'Pending',
    taxRate: 0,
    items: [{ description: 'Main Service', quantity: 1, price: 0 }]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, clientRes, projRes, payRes] = await Promise.all([
        invoiceService.getAll(),
        clientService.getAll(),
        projectService.getAll(),
        paymentService.getAll()
      ]);
      setInvoices(invRes.data);
      setClients(clientRes.data);
      setProjects(projRes.data);
      setPayments(payRes.data);
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
    if (clientIdFilter) {
      setFormData(prev => ({ ...prev, clientId: clientIdFilter }));
    }
  }, [clientIdFilter]);

  const filteredInvoices = useMemo(() => {
    let result = invoices;
    if (clientIdFilter) {
      result = result.filter(inv => inv.clientId === clientIdFilter);
    }
    if (projectIdFilter) {
      result = result.filter(inv => inv.projectId === projectIdFilter);
    }
    return result;
  }, [invoices, clientIdFilter, projectIdFilter]);

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      invoiceNumber: invoice.invoiceNumber || '',
      clientId: invoice.clientId || '',
      projectId: invoice.projectId || '',
      issueDate: invoice.issueDate ? invoice.issueDate.split('T')[0] : '',
      dueDate: invoice.dueDate ? invoice.dueDate.split('T')[0] : '',
      status: invoice.status || 'Pending',
      taxRate: invoice.taxRate || 0,
      items: invoice.items || [{ description: 'Main Service', quantity: 1, price: 0 }]
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingInvoice(null);
    setFormData({
      invoiceNumber: '',
      clientId: clientIdFilter || '',
      projectId: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      status: 'Pending',
      taxRate: 0,
      items: [{ description: 'Main Service', quantity: 1, price: 0 }]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const items = formData.items.map(item => ({
        ...item,
        quantity: parseFloat(item.quantity) || 0,
        price: parseFloat(item.price) || 0
      }));

      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      const taxRate = parseFloat(formData.taxRate) || 0;
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount;

      const formattedData = {
        ...formData,
        items,
        taxRate,
        subtotal,
        taxAmount,
        total
      };

      if (editingInvoice) {
        await invoiceService.update(editingInvoice._id, formattedData);
      } else {
        await invoiceService.create(formattedData);
      }
      window.dispatchEvent(new Event('dataUpdated'));
      closeModal();
      fetchData();
    } catch (error) {
      console.error('Error saving invoice:', error);
    }
  };

  const handleMarkAsPaid = async (invoiceId) => {
    try {
      const invoice = invoices.find(inv => inv._id === invoiceId);
      if (invoice) {
        await invoiceService.update(invoiceId, { ...invoice, status: 'Paid' });
        window.dispatchEvent(new Event('dataUpdated'));
        fetchData();
        if (selectedInvoice && selectedInvoice._id === invoiceId) {
          setSelectedInvoice({ ...invoice, status: 'Paid' });
        }
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await invoiceService.delete(id);
        window.dispatchEvent(new Event('dataUpdated'));
        fetchData();
      } catch (error) {
        console.error('Error deleting invoice:', error);
      }
    }
  };

  const getClientName = (id) => {
    const client = clients.find(c => c._id === id);
    return client ? client.name : 'Unknown Client';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.8rem' }}>Invoices</h2>
          {clientIdFilter && (
            <div
              onClick={() => setSearchParams({})}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#eee',
                padding: '0.25rem 0.75rem',
                borderRadius: '1rem',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              <span>Filtering for {getClientName(clientIdFilter)}</span>
              <X size={14} />
            </div>
          )}
        </div>
        <button
          className="pill-button active"
          style={{ backgroundColor: 'var(--text-primary)', color: 'white' }}
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={18} />
          <span>Create Invoice</span>
        </button>
      </div>

      <div className="table-container">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
          <thead style={{ backgroundColor: '#f9f9f9', borderBottom: '1px solid #eee' }}>
            <tr>
              <th style={{ padding: '1.25rem' }}>Invoice #</th>
              <th style={{ padding: '1.25rem' }}>Client</th>
              <th style={{ padding: '1.25rem' }}>Issue Date</th>
              <th style={{ padding: '1.25rem' }}>Amount</th>
              <th style={{ padding: '1.25rem' }}>Status</th>
              <th style={{ padding: '1.25rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
            ) : filteredInvoices.length > 0 ? (
              filteredInvoices.map(invoice => (
                <tr key={invoice._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '1.25rem', fontWeight: '500' }}>{invoice.invoiceNumber || 'INV-001'}</td>
                  <td style={{ padding: '1.25rem' }}>{getClientName(invoice.clientId)}</td>
                  <td style={{ padding: '1.25rem' }}>{new Date(invoice.issueDate).toLocaleDateString()}</td>
                  <td style={{ padding: '1.25rem', fontWeight: 'bold' }}>Br {invoice.total?.toFixed(2) || '0.00'}</td>
                  <td style={{ padding: '1.25rem' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.8rem',
                      color: invoice.status === 'Paid' ? '#4CAF50' : '#FF9800'
                    }}>
                      {invoice.status === 'Paid' ? <CheckCircle size={14} /> : <Clock size={14} />}
                      {invoice.status || 'Draft'}
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                        title="View Details"
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setIsDetailModalOpen(true);
                        }}
                      >
                        <Eye size={18} />
                      </button>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} title="Download PDF"><Download size={18} /></button>
                      <button
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                        title="Edit Invoice"
                        onClick={() => handleEdit(invoice)}
                      >
                        <Pencil size={18} />
                      </button>
                      {invoice.status !== 'Paid' && (
                        <button
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4CAF50' }}
                          title="Record Payment"
                          onClick={() => navigate(`/payments?invoiceId=${invoice._id}`)}
                        >
                          <DollarSign size={18} />
                        </button>
                      )}
                      <Trash2
                        size={18}
                        style={{ color: '#ff4d4d', cursor: 'pointer' }}
                        onClick={() => handleDelete(invoice._id)}
                      />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="6" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No invoices yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingInvoice ? "Edit Invoice" : "Create Invoice"}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-row">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem' }}>Invoice #</label>
              <input placeholder="INV-001" style={{ padding: '0.7rem', borderRadius: '0.8rem', border: '1px solid #ddd' }}
                value={formData.invoiceNumber} onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem' }}>Status</label>
              <select style={{ padding: '0.7rem', borderRadius: '0.8rem', border: '1px solid #ddd' }}
                value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem' }}>Tax Rate (%)</label>
              <input type="number" step="0.01" placeholder="0" style={{ padding: '0.7rem', borderRadius: '0.8rem', border: '1px solid #ddd' }}
                value={formData.taxRate} onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })} />
            </div>          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem' }}>Client</label>
            <select required style={{ padding: '0.7rem', borderRadius: '0.8rem', border: '1px solid #ddd' }}
              value={formData.clientId} onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}>
              <option value="">Select a client</option>
              {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem' }}>Project (Optional)</label>
            <select style={{ padding: '0.7rem', borderRadius: '0.8rem', border: '1px solid #ddd' }}
              value={formData.projectId} onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}>
              <option value="">Select a project</option>
              {projects.filter(p => !formData.clientId || p.clientId === formData.clientId).map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem' }}>Issue Date</label>
              <input type="date" style={{ padding: '0.7rem', borderRadius: '0.8rem', border: '1px solid #ddd' }}
                value={formData.issueDate} onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem' }}>Due Date</label>
              <input type="date" style={{ padding: '0.7rem', borderRadius: '0.8rem', border: '1px solid #ddd' }}
                value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
            </div>
          </div>
          <div style={{ borderTop: '1px solid #eee', marginTop: '0.5rem', paddingTop: '1rem' }}>
            <p style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Items</p>
            {formData.items.map((item, index) => (
              <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '1rem' }}>
                <input placeholder="Service" style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #ddd' }} value={item.description}
                  onChange={(e) => {
                    const newItems = [...formData.items];
                    newItems[index].description = e.target.value;
                    setFormData({ ...formData, items: newItems });
                  }} />
                <div className="form-row">
                  <input type="number" placeholder="Qty" style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #ddd' }} value={item.quantity}
                    onChange={(e) => {
                      const newItems = [...formData.items];
                      newItems[index].quantity = e.target.value;
                      setFormData({ ...formData, items: newItems });
                    }} />
                  <input type="number" placeholder="Price" style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #ddd' }} value={item.price}
                    onChange={(e) => {
                      const newItems = [...formData.items];
                      newItems[index].price = e.target.value;
                      setFormData({ ...formData, items: newItems });
                    }} />
                </div>
              </div>
            ))}
            <button type="button"
              style={{ fontSize: '0.75rem', color: 'blue', background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => setFormData({ ...formData, items: [...formData.items, { description: '', quantity: 1, price: 0 }] })}
            > + Add another item </button>
          </div>

          <div style={{ marginTop: '1rem', padding: '1rem', borderTop: '2px dashed #eee', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span>Subtotal:</span>
              <span>Br {formData.items.reduce((sum, item) => sum + (parseFloat(item.quantity || 0) * parseFloat(item.price || 0)), 0).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span>Tax ({formData.taxRate || 0}%):</span>
              <span>Br {(formData.items.reduce((sum, item) => sum + (parseFloat(item.quantity || 0) * parseFloat(item.price || 0)), 0) * (parseFloat(formData.taxRate || 0) / 100)).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #eee' }}>
              <span style={{ fontWeight: 'bold' }}>Grand Total:</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                Br {(formData.items.reduce((sum, item) => sum + (parseFloat(item.quantity || 0) * parseFloat(item.price || 0)), 0) * (1 + parseFloat(formData.taxRate || 0) / 100)).toFixed(2)}
              </span>
            </div>
          </div>

          <button type="submit" className="pill-button active" style={{ marginTop: '0.5rem', justifyContent: 'center' }}>
            {editingInvoice ? "Update Invoice" : "Create Invoice"}
          </button>
        </form>
      </Modal>

      {/* Invoice Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Invoice: ${selectedInvoice?.invoiceNumber}`}
        maxWidth="800px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Bill To:</span>
              <h3 style={{ margin: 0 }}>{getClientName(selectedInvoice?.clientId)}</h3>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>Project: {projects.find(p => p._id === selectedInvoice?.projectId)?.name || 'General'}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                padding: '0.4rem 1rem',
                borderRadius: '2rem',
                backgroundColor: selectedInvoice?.status === 'Paid' ? '#e8f5e9' : '#fff3e0',
                color: selectedInvoice?.status === 'Paid' ? '#4CAF50' : '#ff9800',
                display: 'inline-block',
                fontWeight: 'bold',
                fontSize: '0.85rem'
              }}>
                {selectedInvoice?.status}
              </div>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Issued: {selectedInvoice ? new Date(selectedInvoice.issueDate).toLocaleDateString() : ''}</p>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Due: {selectedInvoice?.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString() : 'Upon receipt'}</p>
            </div>
          </div>

          <div className="table-container" style={{ borderRadius: '1rem', border: '1px solid #eee' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f9f9f9' }}>
                <tr>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Description</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Price</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoice?.items?.map((item, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #eee' }}>
                    <td style={{ padding: '1rem' }}>{item.description}</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>Br {item.price?.toFixed(2)}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '500' }}>Br {(item.quantity * item.price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot style={{ borderTop: '2px solid #eee' }}>
                {selectedInvoice?.taxRate > 0 && (
                  <>
                    <tr>
                      <td colSpan="3" style={{ padding: '0.5rem 1rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Subtotal</td>
                      <td style={{ padding: '0.5rem 1rem', textAlign: 'right' }}>Br {selectedInvoice?.subtotal?.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colSpan="3" style={{ padding: '0.5rem 1rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Tax ({selectedInvoice?.taxRate}%)</td>
                      <td style={{ padding: '0.5rem 1rem', textAlign: 'right' }}>Br {selectedInvoice?.taxAmount?.toFixed(2)}</td>
                    </tr>
                  </>
                )}
                <tr>
                  <td colSpan="3" style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>Grand Total</td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--accent-color)' }}>
                    Br {selectedInvoice?.total?.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div>
            <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DollarSign size={18} color="var(--accent-color)" />
              Payment History
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {payments.filter(p => p.invoiceId === selectedInvoice?._id).length > 0 ? (
                payments.filter(p => p.invoiceId === selectedInvoice?._id).map(p => (
                  <div key={p._id} className="glass-card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', backgroundColor: '#f9f9f9', border: 'none' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 'bold' }}>{p.method} Payment</p>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(p.date).toLocaleDateString()}</p>
                    </div>
                    <strong style={{ color: '#4CAF50' }}>+Br {p.amount?.toLocaleString()}</strong>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: '#f9f9f9', borderRadius: '1rem' }}>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No payments recorded for this invoice yet.</p>
                  {selectedInvoice?.status !== 'Paid' && (
                    <button
                      className="pill-button"
                      style={{ marginTop: '0.75rem', fontSize: '0.8rem' }}
                      onClick={() => navigate(`/payments?invoiceId=${selectedInvoice?._id}`)}
                    >
                      Record first payment
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
            <button className="pill-button" onClick={() => setIsDetailModalOpen(false)}>Close</button>
            {selectedInvoice?.status !== 'Paid' && (
              <button
                className="pill-button active"
                style={{ backgroundColor: '#4CAF50' }}
                onClick={() => handleMarkAsPaid(selectedInvoice._id)}
              >
                Mark as Paid
              </button>
            )}
            <button className="pill-button active" onClick={() => {
              handleEdit(selectedInvoice);
              setIsDetailModalOpen(false);
            }}>
              Edit Invoice
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Invoices;
