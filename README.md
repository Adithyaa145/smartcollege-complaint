# 🏛️ SmartCollege Complaint System

The **SmartCollege Complaint System** is a modern, multi-user web application designed to track, manage, and prioritize academic and administrative complaints within a college campus. It provides tailored portals for students, faculty, and administrators to streamline issue reporting, prevent duplicates, and enable community voting on shared concerns.

---

## 🚀 Key Features

*   **Role-Based Access Control:** Dedicated dashboards and interfaces for **Students**, **Faculty**, and **Administrators**.
*   **Branch-Level Upvoting:** Students see pending complaints for their specific branch (e.g., `CSE`, `ECE`) and can upvote issues to increase visibility.
*   **Duplicate Prevention:** Checks incoming complaints for identical room numbers, issue types, and descriptions to prevent ticket clutter.
*   **JWT Authentication:** Secure user sessions using JSON Web Tokens (JWT) with hashed passwords using `bcrypt`.
*   **Glassmorphic Design:** A cohesive, premium user interface utilizing modern CSS backdrop filters, smooth gradients, and transparent cards.

---

## 📁 Directory Structure

```text
smartcollege-complaint/
│
├── backend/
│   ├── uploads/                    # Directory for uploaded complaint images
│   ├── db.js                       # DB config connection interface
│   ├── package.json                # Backend specific start scripts & dependencies
│   └── server.js                   # Main application entry point (Express/Mongoose)
│
├── frontend/                       # Static web resources
│   ├── admin.css / .html / .js     # Administrator complaint panel
│   ├── class.complaint.html / .js  # Branch community dashboard & voting portal
│   ├── complaint.css / .html / .js  # Personal student submission form
│   ├── faculty.css / .html         # Faculty dashboard
│   ├── login.html                  # Credentials login portal
│   ├── my.complaint.css / .html / .js # Personal complaint tracking log
│   ├── profile.css / .html / .js   # User profile panel
│   └── register.html               # Registration form with branch/role selectors
│
├── package.json                    # Root workspace package configs
└── README.md                       # Documentation index
```

---

## ⚙️ Getting Started & Setup

### Prerequisites

Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v16.x or higher recommended)
*   [MongoDB Community Server](https://www.mongodb.com/try/download/community) running locally on `mongodb://127.0.0.1:27017`

### Installation

1.  Clone the repository or navigate to your workspace folder.
2.  Install all required dependencies:
    ```bash
    npm install
    ```

### Running the Application

You can execute the development server using either of the following configurations:

#### Option A: Running from the Root Workspace
Run the root script to spin up the Express server:
```bash
npm run dev
# or
npm run start
```
*This command runs:* `node backend/server.js`

#### Option B: Running from the Backend Directory
```bash
cd backend
npm start
```
*This command runs:* `node server.js`

The application will run at **`http://localhost:3000`** and automatically serve the static web pages in the `frontend/` folder.

---

## 🛠️ System Architecture

### Database Models (Mongoose)

#### 1. User Model
Tracks user roles, authentication hashes, and academic branch configuration:
```javascript
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "admin", "faculty"], default: "student" },
  branch: { type: String, default: "CSE" }
});
```

#### 2. Complaint Model
Maintains complaint details, images, current resolution status, and upvote counters:
```javascript
const complaintSchema = new mongoose.Schema({
  student_name: String,
  phone: String,
  email: String,
  room: String,
  type: String,         // Type/issue category
  description: String,
  category: String,
  role: { type: String, default: "student" },
  branch: { type: String, default: "CSE" },
  upvotes: { type: Number, default: 0 },
  votedBy: [{ type: String }], // List of student emails who voted
  image: String,        // Filename saved via Multer upload
  status: { type: String, default: "Pending" }
});
```

---

## 🌐 API Reference

All requests must send the authentication headers (`Authorization: Bearer <JWT_TOKEN>`) where authentication is required.

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/register` | Public | Registers a new user. Default branch is `CSE` and default role is `student`. |
| **POST** | `/login` | Public | Authenticates credentials and returns a signed JWT token. |
| **GET** | `/me` | User | Retrieves the currently logged-in user's profile details. |
| **POST** | `/submit-complaint` | User | Submits a new complaint along with an optional image file. Blocks duplicates. |
| **GET** | `/my-complaints` | User | Fetches all complaints submitted by the authenticated user. |
| **GET** | `/class-complaints` | User | Fetches pending complaints for the user's branch, sorted by upvotes desc. |
| **POST** | `/complaint/:id/vote` | User | Upvotes a specific branch complaint. Prevents double-voting. |
| **GET** | `/complaints` | Admin | Lists all complaints in the database. |
| **PUT** | `/update/:id` | Admin | Updates the status of a specific complaint (e.g., Pending, Resolved). |
| **DELETE** | `/delete/:id` | Admin | Permanently deletes a complaint entry from the database. |

---

## 🎨 UI/UX Theme (Glassmorphism)

The front-end design is standardized across all dashboards using visual elements of Glassmorphism:
*   **Translucent Cards:** `background: rgba(255, 255, 255, 0.1)` with a frosted effect.
*   **Backdrop Filters:** `backdrop-filter: blur(10px)` for high-depth visual clarity.
*   **Light Borders:** `border: 1px solid rgba(255, 255, 255, 0.2)` highlighting cards.
*   **Soft Shadows:** `box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1)`.
