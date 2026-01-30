import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientService, projectService, invoiceService, paymentService } from '../services/api';
import { Plus, Search, MoreVertical, Mail, Phone, Building, Trash2, ExternalLink, Pencil, Briefcase, FileText, DollarSign, CheckCircle2 } from 'lucide-react';
import Modal from '../components/Modal';

const Clients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [detailTab, setDetailTab] = useState('overview');
  const [formData, setFormData] = useState({ name: '', company: '', email: '', phone: '' });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const [clientRes, projRes, invRes, payRes] = await Promise.all([
        clientService.getAll(),
        projectService.getAll(),
        invoiceService.getAll(),
        paymentService.getAll()
      ]);
      setClients(clientRes.data);
      setProjects(projRes.data);
      setInvoices(invRes.data);
      setPayments(payRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      company: client.company || '',
      email: client.email || '',
      phone: client.phone || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    setFormData({ name: '', company: '', email: '', phone: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await clientService.update(editingClient._id, formData);
      } else {
        await clientService.create(formData);
      }
      closeModal();
      fetchItems();
    } catch (error) {
      console.error('Error saving client:', error);
    }
  };

  const handleMarkAsPaid = async (invoiceId) => {
    try {
      const invoice = invoices.find(inv => inv._id === invoiceId);
      if (invoice) {
        await invoiceService.update(invoiceId, { ...invoice, status: 'Paid' });
        fetchItems();
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await clientService.delete(id);
        fetchItems();
      } catch (error) {
        console.error('Error deleting client:', error);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="page-header">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.8rem' }}>Clients</h2>
          <span style={{ backgroundColor: 'var(--white)', padding: '0.2rem 0.8rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: '500' }}>
            {clients.length} Total
          </span>
        </div>
        <div className="search-container">
          <div style={{ position: 'relative', flex: 1 }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} size={16} />
            <input
              type="text"
              placeholder="Search clients..."
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.5rem',
                borderRadius: '2rem',
                border: 'none',
                outline: 'none',
                boxShadow: 'var(--shadow)'
              }}
            />
          </div>
          <button
            className="pill-button active"
            style={{ backgroundColor: 'var(--text-primary)', color: 'white' }}
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={18} />
            <span>Add Client</span>
          </button>
        </div>
      </div>

      <div className="responsive-grid">
        {loading ? (
          <p>Loading clients...</p>
        ) : clients.length > 0 ? (
          clients.map(client => (
            <div key={client._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ width: '45px', height: '45px', borderRadius: '12px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Building size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0 }}>{client.name}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{client.company || 'Private'}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                  <Pencil
                    size={18}
                    style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}
                    onClick={() => handleEdit(client)}
                  />
                  <Trash2
                    size={18}
                    style={{ color: '#ff4d4d', cursor: 'pointer' }}
                    onClick={() => handleDelete(client._id)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
                  <Mail size={16} color="var(--text-secondary)" />
                  <span>{client.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
                  <Phone size={16} color="var(--text-secondary)" />
                  <span>{client.phone || 'N/A'}</span>
                </div>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  className="pill-button"
                  style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', flex: 1, minWidth: '100px' }}
                  onClick={() => {
                    setSelectedClient(client);
                    setIsDetailModalOpen(true);
                  }}
                >
                  View Details
                </button>
                <button
                  className="pill-button"
                  style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', flex: 1, minWidth: '100px' }}
                  onClick={() => navigate(`/projects?clientId=${client._id}`)}
                >
                  Projects
                </button>
                <button
                  className="pill-button"
                  style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', flex: 1, minWidth: '100px' }}
                  onClick={() => navigate(`/invoices?clientId=${client._id}`)}
                >
                  Invoices
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No clients found. Click "Add Client" to get started.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingClient ? "Edit Client" : "Add New Client"}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '500' }}>Full Name</label>
            <input
              required
              type="text"
              style={{ padding: '0.8rem', borderRadius: '1rem', border: '1px solid #ddd', outline: 'none' }}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '500' }}>Company Name</label>
            <input
              type="text"
              style={{ padding: '0.8rem', borderRadius: '1rem', border: '1px solid #ddd', outline: 'none' }}
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '500' }}>Email Address</label>
            <input
              required
              type="email"
              style={{ padding: '0.8rem', borderRadius: '1rem', border: '1px solid #ddd', outline: 'none' }}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '500' }}>Phone Number</label>
            <input
              type="text"
              style={{ padding: '0.8rem', borderRadius: '1rem', border: '1px solid #ddd', outline: 'none' }}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <button type="submit" className="pill-button active" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
            {editingClient ? "Update Client" : "Create Client"}
          </button>
        </form>
      </Modal>

      {/* Client Details Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setDetailTab('overview');
        }}
        title={`Client: ${selectedClient?.name}`}
        maxWidth="1000px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Financial Summary for Client */}
          {selectedClient && (() => {
            const clientInvoices = invoices.filter(inv => inv.clientId === selectedClient._id);
            const clientPayments = payments.filter(pay => {
              const inv = clientInvoices.find(i => i._id === pay.invoiceId);
              return !!inv;
            });
            const totalInvoiced = clientInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
            const totalPaid = clientPayments.reduce((sum, pay) => sum + (pay.amount || 0), 0);
            const outstanding = totalInvoiced - totalPaid;

            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div className="glass-card" style={{ padding: '1.25rem', backgroundColor: '#fffbf2', border: '1px solid #ff980033' }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Billing</p>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '1.5rem', fontWeight: 'bold' }}>Br {totalInvoiced.toLocaleString()}</p>
                </div>
                <div className="glass-card" style={{ padding: '1.25rem', backgroundColor: '#e8f5e9', border: '1px solid #4CAF5033' }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Paid</p>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: '#4CAF50' }}>Br {totalPaid.toLocaleString()}</p>
                </div>
                <div className="glass-card" style={{ padding: '1.25rem', backgroundColor: '#fff0f0', border: '1px solid #ff4d4d33' }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Outstanding</p>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: '#ff4d4d' }}>Br {outstanding.toLocaleString()}</p>
                </div>
              </div>
            );
          })()}

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid #eee' }}>
            {['overview', 'projects', 'invoices', 'payments'].map(tab => (
              <button
                key={tab}
                onClick={() => setDetailTab(tab)}
                style={{
                  padding: '1rem 0',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: detailTab === tab ? 'bold' : 'normal',
                  color: detailTab === tab ? 'var(--accent-color)' : 'var(--text-secondary)',
                  borderBottom: detailTab === tab ? '3px solid var(--accent-color)' : '3px solid transparent',
                  textTransform: 'capitalize'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div style={{ maxHeight: '50vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {detailTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <h5 style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)' }}>Contact Information</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ backgroundColor: '#f5f5f5', padding: '0.75rem', borderRadius: '50%' }}><Mail size={18} /></div>
                        <div>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Email Address</p>
                          <p style={{ margin: 0, fontWeight: '500' }}>{selectedClient?.email}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ backgroundColor: '#f5f5f5', padding: '0.75rem', borderRadius: '50%' }}><Phone size={18} /></div>
                        <div>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Phone Number</p>
                          <p style={{ margin: 0, fontWeight: '500' }}>{selectedClient?.phone || 'Not provided'}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ backgroundColor: '#f5f5f5', padding: '0.75rem', borderRadius: '50%' }}><Building size={18} /></div>
                        <div>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Company / Entity</p>
                          <p style={{ margin: 0, fontWeight: '500' }}>{selectedClient?.company || 'Individual'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="glass-card" style={{ padding: '1.5rem', backgroundColor: '#f9f9f9', border: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h5 style={{ margin: 0 }}>Quick Actions</h5>
                  <button className="pill-button active" onClick={() => navigate(`/projects?clientId=${selectedClient?._id}`)}>
                    View Project Timeline
                  </button>
                  <button className="pill-button" style={{ backgroundColor: '#fff', border: '1px solid #ddd' }} onClick={() => navigate(`/invoices?clientId=${selectedClient?._id}`)}>
                    View Invoices
                  </button>
                </div>
              </div>
            )}

            {detailTab === 'projects' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h5 style={{ margin: 0 }}>Current Projects ({projects.filter(p => p.clientId === selectedClient?._id).length})</h5>
                  <button className="pill-button active" style={{ fontSize: '0.8rem' }} onClick={() => navigate(`/projects?clientId=${selectedClient?._id}`)}>
                    <Plus size={14} /> New Project
                  </button>
                </div>
                {projects.filter(p => p.clientId === selectedClient?._id).length > 0 ? (
                  projects.filter(p => p.clientId === selectedClient?._id).map(p => (
                    <div key={p._id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ backgroundColor: '#fff3e0', padding: '0.75rem', borderRadius: '0.75rem' }}>
                          <Briefcase size={20} color="#ff9800" />
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 'bold' }}>{p.name}</p>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Status: {p.status} • Budget: Br {p.budget?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <ExternalLink size={20} style={{ color: '#ccc', cursor: 'pointer' }} onClick={() => navigate(`/projects?id=${p._id}`)} />
                    </div>
                  ))
                ) : (
                  <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No projects found for this client.</p>
                )}
              </div>
            )}

            {detailTab === 'invoices' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h5 style={{ margin: 0 }}>Invoice History</h5>
                  <button className="pill-button active" style={{ fontSize: '0.8rem' }} onClick={() => navigate(`/invoices?clientId=${selectedClient?._id}`)}>
                    <Plus size={14} /> Create Invoice
                  </button>
                </div>
                {invoices.filter(inv => inv.clientId === selectedClient?._id).length > 0 ? (
                  invoices.filter(inv => inv.clientId === selectedClient?._id).map(inv => (
                    <div key={inv._id} className="glass-card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ backgroundColor: '#f5f5f5', padding: '0.75rem', borderRadius: '0.75rem' }}>
                          <FileText size={20} color="var(--text-secondary)" />
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 'bold' }}>{inv.invoiceNumber}</p>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Issued {new Date(inv.issueDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>Br {inv.total?.toLocaleString()}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.7rem', color: inv.status === 'Paid' ? '#4CAF50' : '#ff9800' }}>{inv.status}</span>
                          {inv.status !== 'Paid' && (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => navigate('/payments', { state: { invoiceId: inv._id } })}
                                style={{
                                  background: '#e3f2fd',
                                  border: 'none',
                                  borderRadius: '0.4rem',
                                  padding: '0.2rem 0.5rem',
                                  fontSize: '0.7rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  cursor: 'pointer',
                                  color: '#1976d2'
                                }}
                              >
                                Record Payment
                              </button>
                              <button
                                onClick={() => handleMarkAsPaid(inv._id)}
                                style={{
                                  background: '#e8f5e9',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '24px',
                                  height: '24px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  color: '#4CAF50'
                                }}
                                title="Mark as Paid"
                              >
                                <CheckCircle2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No invoices yet.</p>
                )}
              </div>
            )}

            {detailTab === 'payments' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h5 style={{ margin: 0 }}>Client Payments</h5>
                {payments.filter(pay => {
                  const inv = invoices.find(i => i._id === pay.invoiceId);
                  return inv && inv.clientId === selectedClient?._id;
                }).length > 0 ? (
                  payments.filter(pay => {
                    const inv = invoices.find(i => i._id === pay.invoiceId);
                    return inv && inv.clientId === selectedClient?._id;
                  }).map(pay => (
                    <div key={pay._id} className="glass-card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ backgroundColor: '#e8f5e9', padding: '0.75rem', borderRadius: '0.75rem' }}>
                          <DollarSign size={20} color="#4CAF50" />
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 'bold' }}>Payment for {invoices.find(i => i._id === pay.invoiceId)?.invoiceNumber}</p>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(pay.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <strong style={{ color: '#4CAF50' }}>+${pay.amount?.toLocaleString()}</strong>
                    </div>
                  ))
                ) : (
                  <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No payments recorded.</p>
                )}
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid #eee', paddingTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button className="pill-button" style={{ backgroundColor: '#eee' }} onClick={() => setIsDetailModalOpen(false)}>
              Close Detail
            </button>
            <button className="pill-button active" onClick={() => {
              handleEdit(selectedClient);
              setIsDetailModalOpen(false);
            }}>
              Edit Client
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Clients;
