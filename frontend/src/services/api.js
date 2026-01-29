const API_URL = 'http://localhost:5000/api';

const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return { data }; // Wrap in data property to maintain compatibility with existing axios-based code
};

export const clientService = {
  getAll: () => apiFetch('/clients'),
  getById: (id) => apiFetch(`/clients/${id}`),
  create: (data) => apiFetch('/clients', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetch(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiFetch(`/clients/${id}`, { method: 'DELETE' }),
};

export const projectService = {
  getAll: () => apiFetch('/projects'),
  getById: (id) => apiFetch(`/projects/${id}`),
  create: (data) => apiFetch('/projects', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetch(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiFetch(`/projects/${id}`, { method: 'DELETE' }),
};

export const invoiceService = {
  getAll: () => apiFetch('/invoices'),
  getById: (id) => apiFetch(`/invoices/${id}`),
  create: (data) => apiFetch('/invoices', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetch(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiFetch(`/invoices/${id}`, { method: 'DELETE' }),
};

export const paymentService = {
  getAll: () => apiFetch('/payments'),
  getById: (id) => apiFetch(`/payments/${id}`),
  create: (data) => apiFetch('/payments', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetch(`/payments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiFetch(`/payments/${id}`, { method: 'DELETE' }),
};

export const expenseService = {
  getAll: () => apiFetch('/expenses'),
  getById: (id) => apiFetch(`/expenses/${id}`),
  create: (data) => apiFetch('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetch(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiFetch(`/expenses/${id}`, { method: 'DELETE' }),
};

export const aiService = {
  chat: (message, history = []) => apiFetch('/ai/chat', { 
    method: 'POST', 
    body: JSON.stringify({ message, history }) 
  }),
  execute: (type, data) => apiFetch('/ai/execute', { 
    method: 'POST', 
    body: JSON.stringify({ type, data }) 
  }),
};

export const contributionService = {
  getForYear: (year) => apiFetch(`/contributions/${year}`),
};

export default { clientService, projectService, invoiceService, paymentService, expenseService, aiService, contributionService };
