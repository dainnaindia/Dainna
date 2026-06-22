# Dainna 2.0 - MariaDB Database Configuration

This directory contains the database definitions, configuration, and tools to run your application using MariaDB/MySQL.

## Directory Structure
- `schema.prisma`: The central database schema file.
- `setup-mariadb.js`: Setup utility script to download the portable database server, configure it, start the process, and import the legacy data SQL backup.
- `schema.sql`: Contains a raw PostgreSQL statement backup (for reference).
- `README.md`: This configuration guide.

---

## Running the Database Server

The project is configured to use a local portable MariaDB database server listening on port `3308`.

### 1. Starting the MariaDB Server
If the MariaDB server process is stopped, you can download, set up, and start it again automatically by running this command in the project root:
```bash
node database/setup-mariadb.js
```
This starts the database server in standalone background mode, creates the database `xenonerp_dainna`, and imports all original reference entries and users from `legacy-php/db_backup/dainna_database_backup.sql`.

### 2. Configure Credentials in your `.env` file
The connection configuration in [backend/.env](file:///c:/Users/palpp/Downloads/Dainna/dainna%202.0/backend/.env) is:
```env
DATABASE_URL="mysql://root@127.0.0.1:3308/xenonerp_dainna"
```

### 3. Modifying Schema Structure
If you make changes to [database/schema.prisma](file:///c:/Users/palpp/Downloads/Dainna/dainna%202.0/database/schema.prisma), regenerate the client using:
```bash
cd backend
npm run prisma:generate
```
