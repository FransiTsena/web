# Freelance Invoice Tracking & Project Planning Platform

A comprehensive web application built with React, TypeScript, Node.js, and MongoDB to help freelancers manage clients, projects, invoices, payments, and expenses.

## Features

- **Client Management**: Track client information, contact details, and company information
- **Project Organization**: Manage projects with progress tracking, deadlines, and budgets
- **Invoice Management**: Create, send, and track invoices with automatic calculations
- **Payment Tracking**: Record and monitor payments received from clients
- **Expense Tracking**: Log business expenses categorized by type
- **Dashboard Analytics**: Overview of key metrics and upcoming deadlines
- **Responsive UI**: Works on desktop and mobile devices
- **Dark Mode**: Automatic dark/light theme support

## Tech Stack

- **Frontend**: React, TypeScript, CSS
- **Backend**: Node.js with native http module (no Express)
- **Database**: MongoDB
- **API**: RESTful endpoints with CORS support
- **Build Tool**: Create React App

## Installation & Setup

1. **Prerequisites**:
   - Node.js (v14 or higher)
   - MongoDB (running locally or cloud instance)

2. **Clone and Install Dependencies**:
   ```bash
   # Navigate to project root
   cd freelance_invoice_tracking
   
   # Install dependencies for both frontend and backend
   cd backend && npm install
   cd ../frontend && npm install
   cd ..
   ```

3. **Environment Variables**:
   - Backend: Create `backend/.env` with `MONGODB_URI` and `PORT`
   - Frontend: Create `frontend/.env` with `REACT_APP_API_URL`

4. **Run the Application**:
   ```bash
   # Terminal 1: Start backend server
   cd backend && npm start
   
   # Terminal 2: Start frontend development server
   cd frontend && npm start
   ```

5. **Or use the root package.json**:
   ```bash
   # Install concurrently globally (if not already installed)
   npm install -g concurrently
   
   # Run both servers at once
   npm run dev
   ```

## API Endpoints

### Clients
- `GET /api/clients` - Get all clients
- `POST /api/clients` - Create a new client
- `GET /api/clients/:id` - Get a specific client
- `PUT /api/clients/:id` - Update a client
- `DELETE /api/clients/:id` - Delete a client

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create a new project
- `GET /api/projects/:id` - Get a specific project
- `PUT /api/projects/:id` - Update a project
- `DELETE /api/projects/:id` - Delete a project

### Invoices
- `GET /api/invoices` - Get all invoices
- `POST /api/invoices` - Create a new invoice
- `GET /api/invoices/:id` - Get a specific invoice
- `PUT /api/invoices/:id` - Update an invoice
- `DELETE /api/invoices/:id` - Delete an invoice

### Payments
- `GET /api/payments` - Get all payments
- `POST /api/payments` - Record a new payment
- `GET /api/payments/:id` - Get a specific payment
- `PUT /api/payments/:id` - Update a payment
- `DELETE /api/payments/:id` - Delete a payment

### Expenses
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Record a new expense
- `GET /api/expenses/:id` - Get a specific expense
- `PUT /api/expenses/:id` - Update an expense
- `DELETE /api/expenses/:id` - Delete an expense

## Functionality Overview

### Core Features
- **Complete CRUD Operations**: Create, Read, Update, Delete functionality for all entities
- **Progress Tracking**: Visual progress bars for projects with percentage tracking
- **Financial Calculations**: Automatic subtotal, tax, and total calculations for invoices
- **Dashboard Statistics**: Real-time metrics on clients, projects, invoices, and payments
- **Responsive Design**: Mobile-friendly interface with adaptive layouts
- **Form Validation**: Client-side validation for all forms

### Progress Tracking
- Projects have a progress slider (0-100%)
- Visual progress bars showing completion percentage
- Editable progress values that persist in the database

### Invoice Management
- Line item support with quantity, price, and automatic totals
- Tax rate calculations
- Discount support
- Status tracking (draft, sent, paid, overdue, cancelled)

### Payment Processing
- Multiple payment methods (cash, check, bank transfer, credit card, PayPal, etc.)
- Link payments to specific invoices
- Payment date tracking

## Testing

The backend includes comprehensive API tests:
```bash
# Run comprehensive API tests
cd backend && npm run test:comprehensive
```

## Architecture

### Frontend Structure
```
frontend/src/
├── components/       # React components for each feature
├── services/         # API service functions
├── types/           # TypeScript type definitions
└── App.tsx          # Main application routing
```

### Backend Structure
```
backend/
├── server.js        # Main server file with all API routes
└── package.json     # Dependencies and scripts
```

## Key Improvements Made

- **Full CRUD Functionality**: Added update and delete operations for all entities
- **Progress Tracking**: Implemented project progress tracking with visual indicators
- **Real-time Dashboard**: Dynamic dashboard with live statistics
- **Enhanced UI**: Improved user interface with action buttons and better layouts
- **API Completeness**: Added missing GET endpoints for individual resources
- **Type Safety**: Comprehensive TypeScript typing throughout the application

## Usage Tips

1. Start with adding clients to establish your customer base
2. Create projects to organize your work
3. Generate invoices to bill clients
4. Record payments when received
5. Track expenses to monitor business costs
6. Use the dashboard to get an overview of your business metrics

## Troubleshooting

- Ensure MongoDB is running before starting the backend server
- Check that the ports (5000 for backend, 3000 for frontend) are not in use
- Verify environment variables are correctly set
- If using a remote MongoDB instance, update the connection string in `.env`

## License

MIT License - Feel free to use and modify for your own purposes.