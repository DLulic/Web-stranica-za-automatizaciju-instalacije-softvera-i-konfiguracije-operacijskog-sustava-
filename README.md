# Software Installation and OS Configuration Automation Web System

This project is a comprehensive web-based solution designed to manage the automation of software installation and operating system configuration (specifically Windows). It provides a user-friendly interface to manage Windows settings, Group Policies, software packages, and Python libraries, facilitating efficient system administration.

## 🚀 Features

*   **System Configuration**:
    *   **Windows Settings**: Manage and automate various Windows OS settings.
    *   **Group Policies**: Apply and revert Registry-based policies.
*   **Software Management**:
    *   **Program Installation**: centralized repository and installation of software packages.
    *   **Uninstallation**: Track and manage software uninstallation.
    *   **Python Packages**: Manage Python libraries and dependencies.
*   **Reporting & Monitoring**:
    *   Detailed reports on installation and configuration tasks (Success/Failure/Additional status).
    *   Filter reports by computer, status, or task type.
    *   System status monitoring.
*   **User Management**:
    *   Role-based access control (Admin roles).
    *   Secure authentication using JWT (JSON Web Tokens).

## 🛠️ Tech Stack

### Frontend
*   **Framework**: [Quasar Framework](https://quasar.dev/) (based on [Vue.js 3](https://vuejs.org/))
*   **Build Tool**: Vite
*   **State/Routing**: Vue Router
*   **HTTP Client**: Axios
*   **Utilities**: jsPDF (for PDF generation), jwt-decode

### Backend
*   **Runtime**: [Node.js](https://nodejs.org/)
*   **Framework**: [Express.js](https://expressjs.com/)
*   **Database ORM**: [Sequelize](https://sequelize.org/)
*   **Database Driver**: MySQL (`mysql2`)
*   **Authentication**: JSON Web Tokens (JWT) & Bcrypt
*   **Other Tools**: PizZip (zipping), Dotenv

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
*   [Node.js](https://nodejs.org/en/download/) (v18 or higher recommended)
*   [Yarn](https://yarnpkg.com/) (optional, but recommended for Frontend) or NPM
*   [MySQL](https://www.mysql.com/) Database server

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd <project-folder>
```

### 2. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```

**Configuration**:
1.  Create a `.env` file in the `backend` directory.
2.  Configure your database credentials and other settings (example variables):
    ```env
    PORT=3000
    DB_HOST=localhost
    DB_USER=root
    DB_PASS=your_password
    DB_NAME=your_database_name
    JWT_SECRET=your_jwt_secret_key
    ```
3.  Ensure your MySQL server is running and the database exists.

**Run the Backend**:
```bash
node index.js
# or
npm run run
```
The server will start on port 3000 (or the one defined in `.env`).

### 3. Frontend Setup
Navigate to the frontend directory and install dependencies:
```bash
cd ../frontend
yarn
# or
npm install
```

**Run the Frontend**:
Start the application in development mode (with hot-code reloading):
```bash
quasar dev
# or via npm script if quasar CLI is not globally installed:
npm run dev
```
The application will usually be available at `http://localhost:9000`.