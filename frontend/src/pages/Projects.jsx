import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { projectService, clientService, invoiceService, paymentService } from '../services/api';
import { Plus, Briefcase, Calendar, Clock, CheckCircle2, AlertCircle, Trash2, X, FileText, Pencil, DollarSign } from 'lucide-react';
import Modal from '../components/Modal';
import '../styles/pages/projects.css';

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
      window.dispatchEvent(new Event('dataUpdated'));
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
        window.dispatchEvent(new Event('dataUpdated'));
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
        window.dispatchEvent(new Event('dataUpdated'));
        fetchData();
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
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
    <div className="projects-container">
      <div className="page-header">
        <div className="page-header-title-container">
          <h2 className="page-header-title">Projects</h2>
          {clientIdFilter && (
            <div
              onClick={() => setSearchParams({})}
              className="filter-pill"
            >
              <span>Filtering for {getClientName(clientIdFilter)}</span>
              <X size={14} />
            </div>
          )}
        </div>
        <button
          className="pill-button active primary-btn"
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
            <div key={project._id} className="glass-card project-card">
              <div className="project-card-header">
                <div>
                  <h3 className="project-card-title">{project.name}</h3>
                  <p className="project-client">
                    Client: {getClientName(project.clientId)}
                  </p>
                </div>
                <div className="project-status-container">
                  <div
                    className="status-badge"
                    style={{
                      backgroundColor: `${getStatusColor(project.status)}22`,
                      color: getStatusColor(project.status)
                    }}
                  >
                    {project.status || 'Ongoing'}
                  </div>
                  <div className="action-icons">
                    <Pencil
                      size={18}
                      style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}
                      onClick={() => handleEdit(project)}
                    />
                    <Trash2
                      size={18}
                      className="trash-icon"
                      onClick={() => handleDelete(project._id)}
                    />
                  </div>
                </div>
              </div>

              <p className="project-description">
                {project.description || 'No description provided.'}
              </p>

              <div className="project-meta-grid">
                <div className="meta-item">
                  <Calendar size={14} color="var(--text-secondary)" />
                  <span>{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'No date'}</span>
                </div>
                <div className="meta-item">
                  <Clock size={14} color="var(--text-secondary)" />
                  <span>Deadline: {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'TBD'}</span>
                </div>
              </div>

              <div className="project-footer">
                <span className="project-budget">Br {project.budget?.toLocaleString() || '0.00'}</span>
                <div className="project-actions">
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
          <div className="glass-card empty-state">
            <Briefcase size={48} color="#eee" style={{ marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-secondary)' }}>No active projects. Start a new one to track your progress.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingProject ? "Edit Project" : "Create New Project"}>
        <form onSubmit={handleSubmit} className="form-container">
          <div className="form-group">
            <label className="form-label">Project Name</label>
            <input required className="form-input"
              value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Client</label>
            <select required className="form-select"
              value={formData.clientId} onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}>
              <option value="">Select a client</option>
              {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Budget (Br)</label>
            <input type="number" className="form-input"
              value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea"
              value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input type="date" className="form-input"
                value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Deadline</label>
              <input type="date" className="form-input"
                value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
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
        <div className="detail-container">
          {/* Progress Overview Section */}
          {selectedProject && (() => {
            const projectInvoices = invoices.filter(inv => inv.projectId === selectedProject._id);
            const projectPayments = payments.filter(pay => {
              const inv = projectInvoices.find(i => i._id === pay.invoiceId);
              return !!inv;
            });
            const totalPaid = projectPayments.reduce((sum, pay) => sum + (pay.amount || 0), 0);
            const budget = selectedProject.budget || 0;
            const percentPaid = budget > 0 ? Math.round((totalPaid / budget) * 100) : 0;
            const remaining = budget - totalPaid;

            return (
              <div className="glass-card progress-overview">
                <div className="progress-grid">
                  <div className="progress-bar-container">
                    <span className="progress-bar-label">Budget Completion (by Payments)</span>
                    <div className="progress-bar-wrapper">
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${Math.min(percentPaid, 100)}%` }}></div>
                      </div>
                      <span style={{ fontWeight: 'bold' }}>{percentPaid}%</span>
                    </div>
                  </div>
                  <div className="progress-stats">
                    <div className="stat-item">
                      <p className="stat-label">Total Paid</p>
                      <p className="stat-value" style={{ color: '#4CAF50' }}>Br {totalPaid.toLocaleString()}</p>
                    </div>
                    <div className="stat-item">
                      <p className="stat-label">Remaining</p>
                      <p className="stat-value" style={{ color: remaining < 0 ? '#f44336' : 'var(--text-primary)' }}>
                        Br {remaining.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Tabs */}
          <div className="tabs-container">
            {['overview', 'invoices', 'payments'].map(tab => (
              <button
                key={tab}
                onClick={() => setDetailTab(tab)}
                className={`tab-button ${detailTab === tab ? 'active' : ''}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="tab-content">
            {detailTab === 'overview' && (
              <div className="overview-grid">
                <div className="overview-main">
                  <div>
                    <label className="overview-description-label">Project Description</label>
                    <p className="overview-description-text">{selectedProject?.description || 'No description provided.'}</p>
                  </div>
                  <div className="mini-meta-grid">
                    <div className="glass-card overview-meta-card">
                      <Calendar size={16} />
                      <p className="meta-card-label">Start Date</p>
                      <p className="meta-card-value">{selectedProject?.startDate ? new Date(selectedProject?.startDate).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div className="glass-card overview-meta-card">
                      <Clock size={16} />
                      <p className="meta-card-label">Deadline</p>
                      <p className="meta-card-value">{selectedProject?.endDate ? new Date(selectedProject?.endDate).toLocaleDateString() : 'TBD'}</p>
                    </div>
                  </div>
                </div>
                <div className="glass-card client-rel-card">
                  <h5 className="client-rel-title">Client Relationship</h5>
                  <div className="client-info-row">
                    <div className="client-avatar">
                      {getClientName(selectedProject?.clientId).charAt(0)}
                    </div>
                    <div>
                      <p className="client-name">{getClientName(selectedProject?.clientId)}</p>
                      <p className="client-subtext">View Profile</p>
                    </div>
                  </div>
                  <button className="pill-button active" style={{ fontSize: '0.8rem' }} onClick={() => navigate(`/clients?id=${selectedProject?.clientId}`)}>
                    View Client Detail
                  </button>
                </div>
              </div>
            )}

            {detailTab === 'invoices' && (
              <div className="list-container">
                <div className="section-header">
                  <h5 className="section-title">Invoices ({invoices.filter(inv => inv.projectId === selectedProject?._id).length})</h5>
                  <button className="pill-button active" style={{ fontSize: '0.8rem' }}
                    onClick={() => navigate(`/invoices?projectId=${selectedProject?._id}&clientId=${selectedProject?.clientId}`)}>
                    <Plus size={14} /> Add Invoice
                  </button>
                </div>
                {invoices.filter(inv => inv.projectId === selectedProject?._id).length > 0 ? (
                  invoices.filter(inv => inv.projectId === selectedProject?._id).map(inv => (
                    <div key={inv._id} className="glass-card invoice-row">
                      <div className="row-info">
                        <div className="invoice-icon">
                          <FileText size={20} color="var(--text-secondary)" />
                        </div>
                        <div>
                          <p className="row-title">{inv.invoiceNumber}</p>
                          <p className="row-subtext">
                            Issued {new Date(inv.issueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="row-metrics">
                        <p className="row-amount">Br {inv.total?.toFixed(2)}</p>
                        <div className="status-row">
                          <span className="status-text" style={{ color: inv.status === 'Paid' ? '#4CAF50' : '#ff9800' }}>{inv.status}</span>
                          {inv.status !== 'Paid' && (
                            <div className="action-buttons-compact">
                              <button
                                onClick={() => navigate('/payments', { state: { invoiceId: inv._id } })}
                                className="btn-compact btn-pay"
                              >
                                Record Payment
                              </button>
                              <button
                                onClick={() => handleMarkAsPaid(inv._id)}
                                className="btn-mark-paid"
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
              <div className="list-container">
                <div className="section-header">
                  <h5 className="section-title">Payment History</h5>
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
                    <div key={pay._id} className="glass-card payment-row">
                      <div className="row-info">
                        <div className="payment-icon">
                          <DollarSign size={20} color="#4CAF50" />
                        </div>
                        <div>
                          <p className="row-title">Payment for {invoices.find(i => i._id === pay.invoiceId)?.invoiceNumber}</p>
                          <p className="row-subtext">
                            {new Date(pay.date).toLocaleDateString()} via {pay.method}
                          </p>
                        </div>
                      </div>
                      <strong className="row-amount" style={{ color: '#4CAF50' }}>+Br {pay.amount?.toLocaleString()}</strong>
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

          <div className="modal-footer">
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
