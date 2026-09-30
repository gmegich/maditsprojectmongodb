# South Sudan Marketplace

An e-commerce web application connecting South Sudanese product suppliers with South Sudanese consumers living in Kenya.

**Undergraduate Computer Science Project — Kabarak University**

## Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Frontend     | React.js, JavaScript, HTML5, CSS3, Axios, React Router |
| Backend      | Node.js, Express.js, RESTful APIs   |
| Database     | MongoDB, Mongoose ODM               |
| Auth         | JWT, bcryptjs, role-based access    |
| Payments     | M-Pesa Daraja API (with mock mode)  |

## Project Structure

```
john madit/
├── backend/          # Node.js + Express API
├── frontend/         # React.js SPA
├── .gitignore
└── README.md
```

## Prerequisites

- Node.js (v18 or later)
- npm
- MongoDB (local installation or MongoDB Atlas)

## Quick Start

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm install
npm run dev
```

API runs at `http://localhost:5000`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`

## User Roles

- **Customer** — Browse, cart, checkout, orders, reviews
- **Seller** — Product catalogue, orders, sales
- **Admin** — Users, sellers, products, reports

## Development Phases

| Phase | Focus |
|-------|-------|
| 1 | Project setup and architecture | ✅ |
| 2 | MongoDB connection and models | ✅ |
| 3 | Authentication and authorization | ✅ |
| 4 | Product and category management | ✅ |
| 5 | Customer browsing and search | ✅ |
| 6 | Shopping cart | ✅ |
| 7 | Checkout and orders | ✅ |
| 8 | M-Pesa payment integration | ✅ |
| 9 | Order tracking | ✅ |
| 10 | Seller dashboard | |
| 4 | Product and category management |
| 5 | Customer browsing and search |
| 6 | Shopping cart |
| 7 | Checkout and orders |
| 8 | M-Pesa payment integration |
| 9 | Order tracking |
| 10 | Seller dashboard |
| 11 | Admin dashboard |
| 12 | Reviews, messaging, notifications |
| 13 | Testing and security |
| 14 | Deployment and documentation |

## License

Academic / educational use.
