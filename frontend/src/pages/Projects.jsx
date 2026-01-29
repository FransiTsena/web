import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { projectService, clientService, invoiceService, paymentService } from '../services/api';
import { Plus, Briefcase, Calendar, Clock, CheckCircle2, AlertCircle, Trash2, X, FileText, Pencil, DollarSign } from 'lucide-react';
import Modal from '../components/Modal';

const Projects = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const clientIdFilter = searchParams.get('clientId');

  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [detailTab, setDetailTab] = useState('overview');
  const [formData, setFormData] = useState({ 
    name: '', 
    clientId: clientIdFilter || '', 
    description: '', 
    status: 'Ongoing', 
    budget: '', 
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, clientRes, invRes, payRes] = await Promise.all([
        projectService.getAll(),
        clientService.getAll(),
        invoiceService.getAll(),
        paymentService.getAll()
      ]);
      setProjects(projRes.data);
      setClients(clientRes.data);
      setInvoices(invRes.data);
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

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      clientId: project.clientId,
      description: project.description || '',
      status: project.status || 'Ongoing',
      budget: project.budget || '',
      startDate: project.startDate ? project.startDate.split('T')[0] : '',
      endDate: project.endDate ? project.endDate.split('T')[0] : ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
    setFormData({ 
      name: '', 
      clientId: clientIdFilter || '', 
      description: '', 
      status: 'Ongoing', 
      budget: '', 
      startDate: new Date().toISOString().split('T')[0],
      endDate: ''
    });
  };

  const filteredProjects = useMemo(() => {
    if (!clientIdFilter) return projects;
    return projects.filter(p => p.clientId === clientIdFilter);
  }, [projects, clientIdFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        budget: parseFloat(formData.budget) || 0
      };

      if (editingProject) {
        await projectService.update(editingProject._id, payload);
      } else {
        await projectService.create(payload);
      }
      closeModal();
      fetchData();
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const handleMarkAsPaid = async (invoiceId) => {
    try {
      const invoice = invoices.find(inv => inv._id === invoiceId);
      if (invoice) {
        await invoiceService.update(invoiceId, { ...invoice, status: 'Paid' });
        fetchData();
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await projectService.delete(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed': return '#4CAF50';
      case 'in progress': return '#2196F3';
      case 'ongoing': return '#2196F3';
      case 'pending': return '#FFC107';
      default: return '#9e9e9e';
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
          <h2 style={{ fontSize: '1.8rem' }}>Projects</h2>
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
          <span>New Project</span>
        </button>
      </div>

      <div className="responsive-grid">
        {loading ? (
          <p>Loading projects...</p>
        ) : filteredProjects.length > 0 ? (
          filteredProjects.map(project => (
            <div key={project._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{project.name}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      Client: {getClientName(project.clientId)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '1rem', 
                      fontSize: '0.75rem', 
                      fontWeight: 'bold', 
                      backgroundColor: `${getStatusColor(project.status)}22`, 
                      color: getStatusColor(project.status) 
                    }}>
                      {project.status || 'Ongoing'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <Pencil 
                        size={18} 
                        style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}
                        onClick={() => handleEdit(project)}
                      />
                      <Trash2 
                        size={18} 
                        style={{ color: '#ff4d4d', cursor: 'pointer' }}
                        onClick={() => handleDelete(project._id)}
                      />
                    </div>
                  </div>
               </div>

               <p style={{ fontSize: '0.9rem', color: '#555', lineHeight: '1.4' }}>
                 {project.description || 'No description provided.'}
               </p>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                     <Calendar size={14} color="var(--text-secondary)" />
                     <span>{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'No date'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                     <Clock size={14} color="var(--text-secondary)" />
                     <span>Deadline: {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'TBD'}</span>
                  </div>
               </div>

               <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>${project.budget?.toLocaleString() || '0.00'}</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className="pill-button" 
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                      onClick={() => navigate(`/invoices?clientId=${project.clientId}&projectId=${project._id}`)}
                    >
                      Invoices
                    </button>
                    <button 
                      className="pill-button" 
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                      onClick={() => {
                        setSelectedProject(project);
                        setIsDetailModalOpen(true);
                      }}
                    >
                      View Details
                    </button>
                  </div>
               </div>
            </div>
          ))
        ) : (
          <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
             <Briefcase size={48} color="#eee" style={{ marginBottom: '1rem' }} />
             <p style={{ color: 'var(--text-secondary)' }}>No active projects. Start a new one to track your progress.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingProject ? "Edit Project" : "Create New Project"}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem' }}>Project Name</label>
            <input required style={{ padding: '0.7rem', borderRadius: '0.8rem', border: '1px solid #ddd' }} 
              value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem' }}>Client</label>
            <select required style={{ padding: '0.7rem', borderRadius: '0.8rem', border: '1px solid #ddd' }}
              value={formData.clientId} onChange={(e) => setFormData({...formData, clientId: e.target.value})}>
              <option value="">Select a client</option>
              {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem' }}>Budget ($)</label>
            <input type="number" style={{ padding: '0.7rem', borderRadius: '0.8rem', border: '1px solid #ddd' }}
              value={formData.budget} onChange={(e) => setFormData({...formData, budget: e.target.value})} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem' }}>Description</label>
            <textarea style={{ padding: '0.7rem', borderRadius: '0.8rem', border: '1px solid #ddd', minHeight: '80px' }}
              value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
          </div>
          <div className="form-row">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem' }}>Start Date</label>
              <input type="date" style={{ padding: '0.7rem', borderRadius: '0.8rem', border: '1px solid #ddd' }}
                value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem' }}>Deadline</label>
              <input type="date" style={{ padding: '0.7rem', borderRadius: '0.8rem', border: '1px solid #ddd' }}
                value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} />
            </div>
          </div>
          <button type="submit" className="pill-button active" style={{ marginTop: '1rem', justifyContent: 'center' }}>
            {editingProject ? "Update Project" : "Create Project"}
          </button>
        </form>
      </Modal>

      {/* Project Details Modal */}
      <Modal 
        isOpen={isDetailModalOpen} 
        onClose={() => {
          setIsDetailModalOpen(false);
          setDetailTab('overview');
        }} 
        title={`Project: ${selectedProject?.name}`}
        maxWidth="900px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Progress Overview Section */}
          {selectedProject && (() => {
            const projectInvoices = invoices.filter(inv => inv.projectId === selectedProject._id);
            // const totalInvoiced = projectInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
            const projectPayments = payments.filter(pay => {
              const inv = projectInvoices.find(i => i._id === pay.invoiceId);
              return !!inv;
            });
            const totalPaid = projectPayments.reduce((sum, pay) => sum + (pay.amount || 0), 0);
            const budget = selectedProject.budget || 0;
            const percentPaid = budget > 0 ? Math.round((totalPaid / budget) * 100) : 0;
            const remaining = budget - totalPaid;

            return (
              <div className="glass-card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #fff 0%, #fffbf2 100%)', border: '1px solid #ff980033' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Budget Completion (by Payments)</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ flex: 1, height: '8px', backgroundColor: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(percentPaid, 100)}%`, height: '100%', backgroundColor: 'var(--accent-color)', borderRadius: '4px' }}></div>
                      </div>
                      <span style={{ fontWeight: 'bold' }}>{percentPaid}%</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-around', gap: '1rem' }}>
                     <div style={{ textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Paid</p>
                        <p style={{ margin: '0.2rem 0 0', fontWeight: 'bold', fontSize: '1.2rem', color: '#4CAF50' }}>${totalPaid.toLocaleString()}</p>
                     </div>
                     <div style={{ textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Remaining</p>
                        <p style={{ margin: '0.2rem 0 0', fontWeight: 'bold', fontSize: '1.2rem', color: remaining < 0 ? '#f44336' : 'var(--text-primary)' }}>
                          ${remaining.toLocaleString()}
                        </p>
                     </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #eee' }}>
            {['overview', 'invoices', 'payments'].map(tab => (
              <button
                key={tab}
                onClick={() => setDetailTab(tab)}
                style={{
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: detailTab === tab ? 'bold' : 'normal',
                  color: detailTab === tab ? 'var(--accent-color)' : 'var(--text-secondary)',
                  borderBottom: detailTab === tab ? '2px solid var(--accent-color)' : '2px solid transparent',
                  textTransform: 'capitalize'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div style={{ maxHeight: '50vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {detailTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                   <div>
                     <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Project Description</label>
                     <p style={{ marginTop: '0.5rem', lineHeight: '1.6' }}>{selectedProject?.description || 'No description provided.'}</p>
                   </div>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="glass-card" style={{ padding: '1rem', backgroundColor: '#fdfdfd' }}>
                        <Calendar size={16} />
                        <p style={{ fontSize: '0.75rem', margin: '0.5rem 0 0' }}>Start Date</p>
                        <p style={{ fontWeight: 'bold', margin: '0.2rem 0 0' }}>{selectedProject?.startDate ? new Date(selectedProject?.startDate).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      <div className="glass-card" style={{ padding: '1rem', backgroundColor: '#fdfdfd' }}>
                        <Clock size={16} />
                        <p style={{ fontSize: '0.75rem', margin: '0.5rem 0 0' }}>Deadline</p>
                        <p style={{ fontWeight: 'bold', margin: '0.2rem 0 0' }}>{selectedProject?.endDate ? new Date(selectedProject?.endDate).toLocaleDateString() : 'TBD'}</p>
                      </div>
                   </div>
                </div>
                <div className="glass-card" style={{ padding: '1.5rem', border: 'none', backgroundColor: '#f9f9f9', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                   <h5 style={{ margin: 0 }}>Client Relationship</h5>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black', fontWeight: 'bold' }}>
                        {getClientName(selectedProject?.clientId).charAt(0)}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>{getClientName(selectedProject?.clientId)}</p>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>View Profile</p>
                      </div>
                   </div>
                   <button className="pill-button active" style={{ fontSize: '0.8rem' }} onClick={() => navigate(`/clients?id=${selectedProject?.clientId}`)}>
                     View Client Detail
                   </button>
                </div>
              </div>
            )}

            {detailTab === 'invoices' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h5 style={{ margin: 0 }}>Invoices ({invoices.filter(inv => inv.projectId === selectedProject?._id).length})</h5>
                  <button className="pill-button active" style={{ fontSize: '0.8rem' }} 
                    onClick={() => navigate(`/invoices?projectId=${selectedProject?._id}&clientId=${selectedProject?.clientId}`)}>
                    <Plus size={14} /> Add Invoice
                  </button>
                </div>
                {invoices.filter(inv => inv.projectId === selectedProject?._id).length > 0 ? (
                  invoices.filter(inv => inv.projectId === selectedProject?._id).map(inv => (
                    <div key={inv._id} className="glass-card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ backgroundColor: '#f0f0f0', padding: '0.75rem', borderRadius: '0.75rem' }}>
                          <FileText size={20} color="var(--text-secondary)" />
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 'bold' }}>{inv.invoiceNumber}</p>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Issued {new Date(inv.issueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>${inv.total?.toFixed(2)}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: inv.status === 'Paid' ? '#4CAF50' : '#ff9800' }}>{inv.status}</span>
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
                  <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#f9f9f9', borderRadius: '1rem' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>No invoices yet</p>
                  </div>
                )}
              </div>
            )}

            {detailTab === 'payments' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h5 style={{ margin: 0 }}>Payment History</h5>
                  <button className="pill-button active" style={{ fontSize: '0.8rem' }}
                    onClick={() => navigate(`/payments?projectId=${selectedProject?._id}`)}>
                    <Plus size={14} /> New Payment
                  </button>
                </div>
                {payments.filter(pay => {
                  const invoice = invoices.find(inv => inv._id === pay.invoiceId);
                  return invoice && invoice.projectId === selectedProject?._id;
                }).length > 0 ? (
                  payments.filter(pay => {
                    const invoice = invoices.find(inv => inv._id === pay.invoiceId);
                    return invoice && invoice.projectId === selectedProject?._id;
                  }).map(pay => (
                    <div key={pay._id} className="glass-card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ backgroundColor: '#e8f5e9', padding: '0.75rem', borderRadius: '0.75rem' }}>
                          <DollarSign size={20} color="#4CAF50" />
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 'bold' }}>Payment for {invoices.find(i => i._id === pay.invoiceId)?.invoiceNumber}</p>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {new Date(pay.date).toLocaleDateString()} via {pay.method}
                          </p>
                        </div>
                      </div>
                      <strong style={{ color: '#4CAF50', fontSize: '1.1rem' }}>+${pay.amount?.toLocaleString()}</strong>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#f9f9f9', borderRadius: '1rem' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>No payments recorded</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
             <button className="pill-button" style={{ backgroundColor: '#eee' }} onClick={() => setIsDetailModalOpen(false)}>
               Close
             </button>
             <button className="pill-button active" onClick={() => {
               handleEdit(selectedProject);
               setIsDetailModalOpen(false);
             }}>
               Edit Project Details
             </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Projects;
