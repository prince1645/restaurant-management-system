# Restaurant Management System

A full-stack Restaurant Management Web Application built with:

- **Frontend:** HTML, CSS, JavaScript, Bootstrap
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Auth:** JWT-based authentication with role-based access (`admin`, `staff`)

## Features

- Login/logout for restaurant users
- Role-based access control
- Menu management (add/edit/delete items)
- Dynamic order creation for table/customer
- Billing with GST (5% / 18%)
- Printable and downloadable (PDF) bills
- Dashboard with total orders, revenue, and popular items
- Search/filter menu items
- Dark mode toggle
- Toast notifications and loading overlay

## Folder Structure

```text
restaurant-management-system/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── css/
│   ├── js/
│   └── index.html
├── models/
├── routes/
├── controllers/
├── public/
└── views/
```

> `models/`, `routes/`, `controllers/`, `public/`, and `views/` are included at root per requested structure and can be used for future extensions.

## Setup Instructions

### 1) Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Update `.env` values:

- `MONGO_URI` for your MongoDB instance
- `JWT_SECRET` with a strong random key

Start backend:

```bash
npm run dev
```

or

```bash
npm start
```

### 2) Seed an Admin User (important)

By design, creating users via API requires an authenticated **admin**. Create the first admin manually in MongoDB (or with a seed script) with fields:

- `name`
- `email`
- `password` (bcrypt hash)
- `role: "admin"`

Then login from the UI.

### 3) Open App

Visit:

```text
http://localhost:5000
```

## REST API Endpoints

### Auth
- `POST /api/auth/login`
- `POST /api/auth/register` (admin only)
- `GET /api/auth/profile`

### Menu
- `GET /api/menu?search=&category=`
- `POST /api/menu` (admin only)
- `PUT /api/menu/:id` (admin only)
- `DELETE /api/menu/:id` (admin only)

### Orders
- `GET /api/orders`
- `POST /api/orders`
- `PATCH /api/orders/:id/status`
- `GET /api/orders/dashboard/summary`

## Submission Notes

This project is written in a beginner-friendly style with comments and clear structure, while still following scalable practices:

- Controller-route-model separation
- JWT middleware for secure API access
- Reusable frontend utility functions
- Clean Bootstrap-driven UI with responsive layout
