# Dainna 2.0: Sharing & Migration Guide

This guide explains how to package the Dainna 2.0 application (React/Next.js frontend, Node.js/Express backend, PostgreSQL database) and set it up on another PC.

---

## 1. What to Package (Zip)
To keep the zip file small and fast to transfer, **exclude** the heavy dependency and build folders. These can be easily re-installed on the new PC.

**Do NOT include the following folders in your zip:**
* `node_modules` (located in root, `backend/node_modules`, and `frontend/node_modules`)
* `.next` (located in `frontend/.next`)
* `dist` (located in `backend/dist`)

**Do include everything else:**
* Root configuration files (`package.json`, etc.)
* The entire `backend` directory (except `node_modules` and `dist`)
* The entire `frontend` directory (except `node_modules` and `.next`)
* The `database` directory

---

## 2. Export/Backup the Current Database
To move your current data (including the updated agent and advocate codes) to the new PC:

1. Open **Command Prompt** or **PowerShell** on your current PC.
2. Run the following command to export the database to a `.sql` file:
   ```bash
   pg_dump -U postgres -h 127.0.0.1 -p 5432 -d xenonerp_dainna > dainna_db_backup.sql
   ```
   *(Enter your PostgreSQL password `postgre` when prompted).*
3. Include the generated `dainna_db_backup.sql` file in your transfer zip/package.

---

## 3. Setup on the New PC

### Prerequisites
On the new PC, download and install:
1. **Node.js** (v18 or higher): [Download Node.js](https://nodejs.org/)
2. **PostgreSQL Database Server**: [Download PostgreSQL](https://www.postgresql.org/)
   * During installation, note the port (default `5432`) and set a password (e.g. `postgre`).

---

### Step-by-Step Setup

#### Step 1: Restore the Database
1. Open **pgAdmin** or command line on the new PC and create an empty database named `xenonerp_dainna`.
2. Open **Command Prompt** or **PowerShell** in the folder where you placed `dainna_db_backup.sql`.
3. Restore the backup database with:
   ```bash
   psql -U postgres -h 127.0.0.1 -p 5432 -d xenonerp_dainna -f dainna_db_backup.sql
   ```
   *(Enter the Postgres password of the new PC).*

#### Step 2: Configure Environment Variables
1. Open the project folder on the new PC.
2. Open `backend/.env` in a text editor.
3. Check the `DATABASE_URL` connection string:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@127.0.0.1:5432/xenonerp_dainna"
   ```
   If the PostgreSQL password on the new PC is different from `postgre`, replace `YOUR_PASSWORD` with the new password.

#### Step 3: Install Dependencies
Open a terminal in the root of the project directory and run:

1. **Configure and install the Backend:**
   ```bash
   cd backend
   npm install
   npx prisma generate
   ```
2. **Install the Frontend:**
   ```bash
   cd ../frontend
   npm install
   ```

---

## 4. Run the Application
To run the servers on the new PC, open two terminal windows:

* **Terminal 1: Start the Backend API (Port 5000)**
  ```bash
  cd backend
  npm run dev
  ```
* **Terminal 2: Start the Frontend UI (Port 3000)**
  ```bash
  cd frontend
  npm run dev
  ```

Open your browser to **`http://localhost:3000`** to access the web portal.
