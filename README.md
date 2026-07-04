# School Management System

This is a full-stack School Management System developed using React, Node.js, Express, Prisma, and SQLite. The project is designed to simplify the management of students, teachers, classes, attendance, grades, and fees through a clean and responsive web interface.

## Features

* User authentication using JWT and bcryptjs
* Manage teachers, students, and classes
* Create and manage class schedules
* Automatic teacher timetable generation based on class schedules
* Schedule conflict detection to prevent assigning the same teacher to multiple classes at the same time
* Record and manage student attendance
* Manage student grades
* Manage fee details
* Interactive timetable interface
* Dashboard with graphical representation of class statistics
* Responsive user interface with a modern dark theme

## Tech Stack

### Frontend

* React (Vite)
* HTML
* CSS
* JavaScript

### Backend

* Node.js
* Express.js

### Database

* Prisma ORM
* SQLite

### Authentication

* JWT
* bcryptjs

## Project Structure

```text
school-management-system
├── client
├── server
├── prisma
├── package.json
└── ...
```

## Getting Started

### Clone the repository

```bash
git clone https://github.com/adlinejelizabeth/School-Management-System.git
```

### Move into the project directory

```bash
cd School-Management-System
```

### Install dependencies

```bash
npm install
```

### Start the application

```bash
npm run dev
```

This command starts both the backend server and the frontend application.

* Frontend: http://localhost:5173
* Backend: http://localhost:5001

## Database

The project uses SQLite with Prisma.

The database contains the following models:

* Users
* Teachers
* Students
* Classes
* Schedules
* Attendance
* Grades
* Fees

## Testing

The project includes an integration verification script (`verify.js`) to validate the API endpoints. The frontend has also been successfully built using Vite without compilation errors.

## Future Improvements

Some features that can be added in the future include:

* Parent portal
* Teacher dashboard improvements
* Email notifications
* Report generation
* Online examinations
* Cloud database support

## Author

**Adline J Elizabeth**

GitHub: https://github.com/adlinejelizabeth
