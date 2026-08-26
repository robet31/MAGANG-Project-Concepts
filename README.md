# 🍕 Pizza Dashboard - Complete Setup Guide

A comprehensive pizza delivery data analytics dashboard built with Next.js, Prisma, and MySQL.

## 📋 Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [What is Docker?](#what-is-docker)
- [Why Docker is Required](#why-docker-is-required)
- [Installation Steps](#installation-steps)
- [Accessing the Application](#accessing-the-application)
- [Database Access](#database-access)
- [Troubleshooting](#troubleshooting)
- [Development Mode](#development-mode)

---

## 🎯 Overview

This is a **full-stack web application** for analyzing pizza delivery data. It includes:
- 🔐 User authentication with role-based access (GM, Admin, Manager, Staff)
- 📊 Interactive analytics dashboards with charts
- 📤 Excel/CSV data upload functionality
- 🏪 Multi-restaurant management
- 📝 Audit logging and notifications

**Tech Stack:**
- Frontend: Next.js 16 + React 19 + TypeScript
- Backend: Next.js API Routes
- Database: MySQL 8.0
- ORM: Prisma
- Styling: Tailwind CSS
- Charts: D3.js

---

## ⚠️ Prerequisites

### Required Software (MUST INSTALL)

You **MUST** install Docker on your computer to run this application. There is no other way to run it without Docker.

#### Why Docker is Mandatory?
This application uses **MySQL database**, and Docker is the easiest way to provide a consistent database environment across all computers (Windows, Mac, Linux) without manual MySQL installation and configuration.

### 1. Install Docker

#### Windows:
1. Download Docker Desktop: https://www.docker.com/products/docker-desktop
2. Run the installer
3. Restart your computer
4. Open Docker Desktop and wait for it to start
5. **Enable WSL 2** when prompted (required for Windows)

#### macOS:
1. Download Docker Desktop: https://www.docker.com/products/docker-desktop
2. Drag to Applications folder
3. Open Docker Desktop

#### Linux (Ubuntu/Debian):
```bash
# Update package index
sudo apt-get update

# Install required packages
sudo apt-get install apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Set up stable repository
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verify installation
sudo docker --version
```

### 2. Verify Docker Installation

Open terminal/command prompt and run:
```bash
docker --version
docker compose version
```

You should see version numbers for both commands.

---

## 🚀 Quick Start

Once Docker is installed, follow these steps:

### Step 1: Clone the Repository
```bash
git clone <your-github-repo-url>
cd pizza-dashboard
```

### Step 2: Start the Application

**Windows:**
```bash
# Using the provided script
docker-manage.bat start

# Or manually
cd "BARU LAGI SIHH/pizza-dashboard"
docker compose up -d --build
```

**Mac/Linux:**
```bash
# Using the provided script
chmod +x docker-manage.sh
./docker-manage.sh start

# Or manually
cd "BARU LAGI SIHH/pizza-dashboard"
docker compose up -d --build
```

### Step 3: Wait for Setup
- Database container will start first (takes ~30 seconds)
- Application container will start after database is healthy
- Database will be automatically migrated and seeded

### Step 4: Access the Application

Open your browser and go to:
```
http://localhost:3001
```

**Login Credentials:**
| Email | Password | Role |
|-------|----------|------|
| gm@pizza.com | password123 | General Manager |
| admin@pizza.com | password123 | Admin Pusat |
| manager@dominos.com | password123 | Manager |
| staff@dominos.com | password123 | Staff |

---

## 🐳 What is Docker?

Docker is a **containerization platform** that packages applications with all their dependencies into standardized units called containers.

### Analogy: Think of Docker like a Shipping Container

```
🚢 Traditional Development (Without Docker):
┌─────────────────────────────────────────────┐
│ Developer A (Windows)                       │
│ - Install Node.js v16 ✅                    │
│ - Install MySQL 8.0 ✅                      │
│ - Configure database ✅                     │
│ - App works! 🎉                             │
└─────────────────────────────────────────────┘

Developer B (Mac) tries to run it:
┌─────────────────────────────────────────────┐
│ Developer B (Mac)                           │
│ - Install Node.js v18 ❌ (different version)│
│ - Install MySQL 5.7 ❌ (different version)  │
│ - Config doesn't work ❌                    │
│ - App broken! 😭                            │
└─────────────────────────────────────────────┘

🐳 With Docker:
┌─────────────────────────────────────────────┐
│ Docker Container (Same on ALL computers)    │
│ - Node.js 20 ✅                             │
│ - MySQL 8.0 ✅                              │
│ - All configs included ✅                   │
│ - Works on Windows ✅                       │
│ - Works on Mac ✅                           │
│ - Works on Linux ✅                         │
└─────────────────────────────────────────────┘
```

### Key Benefits:
1. **Consistency**: Same environment on all computers
2. **Isolation**: Doesn't interfere with your existing software
3. **Easy Setup**: One command to start everything
4. **Portability**: Works anywhere Docker is installed

---

## ❓ Why Docker is Required for This Project

### 1. Database Management
```
Without Docker:
- Install MySQL manually
- Create database manually
- Configure user permissions
- Manage MySQL service (start/stop)
- Handle version conflicts with existing MySQL
- Painful setup process! 😫

With Docker:
- Docker handles everything automatically
- MySQL runs in isolated container
- No conflicts with existing installations
- One command setup! 🎉
```

### 2. Consistent Environment
```
Problem: "Works on my machine!"
- Developer uses Node.js 18
- Production server uses Node.js 16
- Version mismatch causes bugs

Solution: Docker
- Everyone uses same Node.js version (20)
- Same MySQL version (8.0)
- Same environment variables
- No "works on my machine" issues!
```

### 3. Easy Team Collaboration
```
Team Member A (Windows):
git clone repo
docker compose up
✅ Working!

Team Member B (Mac):
git clone repo
docker compose up
✅ Working!

Team Member C (Linux):
git clone repo
docker compose up
✅ Working!

No manual setup needed!
```

---

## 📦 Installation Steps (Detailed)

### For Windows Users:

1. **Install Docker Desktop**
   - Download from https://www.docker.com/products/docker-desktop
   - Run installer
   - Restart computer
   - Open Docker Desktop

2. **Enable WSL 2** (Windows Subsystem for Linux)
   - Open PowerShell as Administrator
   - Run: `wsl --install`
   - Restart computer
   - Set WSL 2 as default: `wsl --set-default-version 2`

3. **Clone Repository**
   ```bash
   git clone <your-repo-url>
   cd pizza-dashboard
   ```

4. **Start Application**
   ```bash
   docker-manage.bat start
   ```

5. **Access Application**
   - Open browser: http://localhost:3001

### For Mac Users:

1. **Install Docker Desktop**
   - Download from https://www.docker.com/products/docker-desktop
   - Install and open

2. **Clone Repository**
   ```bash
   git clone <your-repo-url>
   cd pizza-dashboard
   ```

3. **Start Application**
   ```bash
   chmod +x docker-manage.sh
   ./docker-manage.sh start
   ```

4. **Access Application**
   - Open browser: http://localhost:3001

### For Linux Users:

1. **Install Docker**
   ```bash
   sudo apt-get update
   sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin
   sudo usermod -aG docker $USER
   # Log out and log back in
   ```

2. **Clone Repository**
   ```bash
   git clone <your-repo-url>
   cd pizza-dashboard
   ```

3. **Start Application**
   ```bash
   chmod +x docker-manage.sh
   ./docker-manage.sh start
   ```

4. **Access Application**
   - Open browser: http://localhost:3001

---

## 🌐 Accessing the Application

### Main Application
- **URL**: http://localhost:3001
- **Description**: Web application interface
- **Features**: Login, Dashboard, Analytics, Upload, User Management

### Database Admin (Prisma Studio)
- **URL**: http://localhost:5555
- **Description**: Visual database management tool
- **Features**: View/edit data, browse tables, manage records

### Direct Database Access
- **Host**: localhost
- **Port**: 3307
- **Database**: pizza_dashboard
- **Username**: root
- **Password**: root

---

## 🗄️ Database Access Options

### Option 1: Prisma Studio (Easiest - Recommended)
```bash
# Start Prisma Studio
docker exec -u root pizza-dashboard-app-1 npx prisma studio --hostname 0.0.0.0 --port 5555

# Open browser: http://localhost:5555
```

### Option 2: MySQL Command Line
```bash
# Access MySQL shell inside container
docker exec -it pizza-dashboard-db-1 mysql -u root -proot -D pizza_dashboard

# Example queries:
SHOW TABLES;
SELECT * FROM User;
SELECT * FROM Restaurant;
EXIT;
```

### Option 3: GUI Database Tools
Install one of these tools and connect with:
- **Host**: localhost
- **Port**: 3307
- **Database**: pizza_dashboard
- **User**: root
- **Password**: root

Recommended tools:
- [DBeaver](https://dbeaver.io/) (Free)
- [MySQL Workbench](https://www.mysql.com/products/workbench/) (Official)
- [TablePlus](https://tableplus.com/) (Modern UI)
- [HeidiSQL](https://www.heidisql.com/) (Windows)

---

## 🛠️ Management Commands

### Using Management Scripts

**Windows (`docker-manage.bat`):**
```bash
docker-manage.bat start    # Start application
docker-manage.bat stop     # Stop application
docker-manage.bat restart  # Restart application
docker-manage.bat status   # Check status
docker-manage.bat logs     # View logs
docker-manage.bat db       # Access MySQL shell
docker-manage.bat studio   # Start Prisma Studio
docker-manage.bat clean    # Remove all data (WARNING!)
```

**Mac/Linux (`docker-manage.sh`):**
```bash
./docker-manage.sh start
./docker-manage.sh stop
./docker-manage.sh restart
./docker-manage.sh status
./docker-manage.sh logs
./docker-manage.sh db
./docker-manage.sh studio
./docker-manage.sh clean
```

### Using Docker Commands Directly

```bash
# Navigate to project
cd "BARU LAGI SIHH/pizza-dashboard"

# Start containers
docker compose up -d --build

# Stop containers
docker compose down

# View logs
docker compose logs -f

# Restart containers
docker compose restart

# Access MySQL
docker exec -it pizza-dashboard-db-1 mysql -u root -proot -D pizza_dashboard

# Run database migrations
docker exec pizza-dashboard-app-1 npx prisma db push

# Seed database
docker exec -u root pizza-dashboard-app-1 npx tsx prisma/seed.ts
```

---

## 🐛 Troubleshooting

### Issue 1: "Docker not found"
**Solution:** Install Docker Desktop from https://www.docker.com/products/docker-desktop

### Issue 2: "Cannot connect to localhost:3001"
**Check:**
```bash
docker ps  # Check if containers are running
docker logs pizza-dashboard-app-1  # Check app logs
docker logs pizza-dashboard-db-1   # Check database logs
```

**Fix:**
```bash
docker compose restart
```

### Issue 3: "Port already in use"
**Cause:** Port 3001 or 3307 is being used by another application

**Solution:**
```bash
# Find what's using the port (Windows)
netstat -ano | findstr 3001
netstat -ano | findstr 3307

# Change ports in docker-compose.yml
# Edit: ports: - "3002:3000"  # Change 3001 to 3002
```

### Issue 4: "Database connection error"
**Fix:**
```bash
# Restart just the database
docker compose restart db

# Wait 10 seconds, then restart app
docker compose restart app
```

### Issue 5: Windows WSL 2 Error
**Solution:**
```powershell
# Open PowerShell as Administrator
wsl --install
wsl --set-default-version 2
# Restart computer
```

### Issue 6: "Permission denied" on Mac/Linux
**Solution:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and log back in
# Or run:
newgrp docker
```

---

## 💻 Development Mode (For Developers)

If you want to develop/modify the code:

### Prerequisites:
- Node.js 20+ (install from https://nodejs.org/)
- npm or yarn
- Docker (for database only)

### Steps:

1. **Start only the database container:**
   ```bash
   cd "BARU LAGI SIHH/pizza-dashboard"
   docker compose up -d db
   ```

2. **Install dependencies locally:**
   ```bash
   npm install
   ```

3. **Setup environment:**
   ```bash
   # Copy .env file (if not exists)
   cp .env.example .env
   
   # Update DATABASE_URL in .env:
   # DATABASE_URL="mysql://root:root@localhost:3307/pizza_dashboard"
   ```

4. **Run database migrations:**
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

6. **Access application:**
   - App: http://localhost:3000
   - Database: http://localhost:5555 (Prisma Studio)

---

## 📁 Project Structure

```
pizza-dashboard/
├── docker-compose.yml          # Docker services configuration
├── Dockerfile                  # Application container definition
├── docker-manage.bat           # Windows management script
├── docker-manage.sh            # Mac/Linux management script
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Initial data seeding
├── src/
│   ├── app/                   # Next.js app router
│   ├── components/            # React components
│   ├── lib/                   # Utilities and database
│   └── ...
├── .env                        # Environment variables
└── package.json               # Dependencies
```

---

## 🔒 Security Notes

- **Default passwords** should be changed in production
- **NEXTAUTH_SECRET** should be a strong random string in production
- **Database password** is set to 'root' for development only
- Never commit `.env` files with real credentials to GitHub

---

## 📞 Support

If you encounter issues:

1. Check Docker is running: `docker version`
2. Check container status: `docker ps`
3. View logs: `docker compose logs`
4. Restart containers: `docker compose restart`

---

## ✅ Summary Checklist

Before running the application:

- [ ] Docker Desktop installed and running
- [ ] Repository cloned from GitHub
- [ ] Navigated to project directory
- [ ] Ran `docker compose up -d --build`
- [ ] Waited for database to initialize (~30 seconds)
- [ ] Opened browser to http://localhost:3001
- [ ] Logged in with provided credentials

**You're all set! Enjoy your Pizza Dashboard! 🍕📊**

---

## 📚 Additional Documentation

- `DATABASE_ACCESS_GUIDE.md` - Detailed database access guide
- `DOCKER_SETUP_README.md` - Docker-specific setup guide
- `MCP_SETUP.md` - MCP Context7 configuration

---

**Last Updated:** 2024
**Version:** 1.0.0
