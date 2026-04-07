# 🏨 Hostel Management System

A full-stack **Hostel Management System** built using **React, Node.js, Express, and MySQL**.

This application streamlines hostel operations by providing role-based access for **Admins, Wardens, and Students**, enabling efficient management of rooms, allocations, complaints, fees, and announcements.

---

## 🚀 Key Features

### 👤 Role-Based Access
- **Admin** – Full system control
- **Warden** – Operational management
- **Student** – Personal dashboard & services

---

### 🛏️ Room & Allocation Management
- Manage hostel rooms and capacity
- Allocate students to rooms
- Prevent over-allocation
- Track occupancy in real-time

---

### 📋 Complaint System
- Students can raise complaints
- Wardens/Admins manage complaint lifecycle
- Status tracking: Pending → In Progress → Resolved

---

### 💰 Fee Management
- Create and track student fee records
- Monitor pending and completed payments

---

### 📢 Announcements
- Post and view important hostel updates
- Priority-based announcements

---

### 📊 Dashboard & Reports
- Visual overview of:
  - Students
  - Rooms
  - Allocations
  - Complaints
  - Fees
- Data-driven insights for administrators

---

### 📥 Data Export
- Export records as CSV:
  - Students
  - Complaints
  - Fees
  - Allocations
  - Reports

---

### 📧 Email Notifications
Automated notifications for:
- Room allocation
- Fee creation
- Complaint resolution

---

## 🎨 User Interface
- Modern responsive UI
- Smooth animations using **Framer Motion**
- Clean dashboard and card-based layout

---

## 🛠️ Tech Stack

### Frontend
- React.js
- React Router
- Axios
- Framer Motion

### Backend
- Node.js
- Express.js
- JWT Authentication
- Nodemailer

### Database
- MySQL

---

## 🗂️ Project Structure

```
HostelManagement/
│
├── backend/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   ├── db.js
│   ├── server.js
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── api.js
│   └── package.json
│
├── database.sql
├── README.md
└── .gitignore
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Trackon24/Hostel-Management-System.git
cd Hostel-Management-System
```

### 2️⃣ Setup MySQL Database

Open MySQL Workbench or MySQL CLI and run:

```sql
CREATE DATABASE hostel_db;
USE hostel_db;
```

Then execute the provided `database.sql` script, which creates all tables, procedures, triggers, views, and sample data.

### 3️⃣ Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
JWT_SECRET=HOSTEL_SECRET_KEY_2026

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=hostel_db

EMAIL_USER=your_email_or_smtp_user
EMAIL_PASS=your_email_or_smtp_password
```

Start the backend server:

```bash
node server.js
```

### 4️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---


## 🧠 DBMS Concepts Used

This project demonstrates core Database Management System concepts:

- **Primary & Foreign Keys** 
- **Normalization** 
- **Stored Procedures** 
- **Triggers** 
- **Views** 

---

