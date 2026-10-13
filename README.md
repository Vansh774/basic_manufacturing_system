# Basic Manufacturing System

A full-stack manufacturing management and monitoring system featuring real-time machine status tracking, downtime analytics, profit & loss calculation, and operator dashboards.

---

## 🚀 Live Services

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **Database:** PostgreSQL on `localhost:5432` (`manufacturing_db`)

---

## 🔑 Demo Login Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Owner** | `owner@factory.com` | `temp123` |
| **Manager** | `manager@factory.com` | `temp123` |
| **Operator** | `operator1@factory.com` | `temp123` |

---

## 🛠️ Management Commands

Quick scripts in the repository root:

- **Check service status:**
  ```bash
  ./status.sh
  ```
- **Start all services (PostgreSQL, Backend, Frontend):**
  ```bash
  ./start.sh
  ```
- **Stop services:**
  ```bash
  ./stop.sh          # Stops backend & frontend
  ./stop.sh --all    # Also stops PostgreSQL
  ```

---

## 📁 Project Architecture

- **`manufacturing-system/backend/`**: Node.js & Express REST API with PostgreSQL and Socket.IO.
- **`manufacturing-system/frontend/`**: React 18, Vite, TailwindCSS, Recharts, and React Router.