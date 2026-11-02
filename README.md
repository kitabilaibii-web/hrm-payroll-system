# HRM Pro - Complete HR and Payroll System (MERN)

## How to run (Windows)
1. Make sure Node.js is installed and MongoDB is running on your computer.
2. Double click `start-hrm.bat` (first time it installs packages, this takes 1-2 minutes).
3. Browser opens at http://localhost:5173

First start creates demo data automatically (takes about 30 seconds).

## Demo logins
- Admin:    admin@hrm.com   / admin123
- Employee: ayesha@hrm.com  / employee123  (all demo employees use employee123)

## Manual run
    cd backend  && npm install && npm start
    cd frontend && npm install && npm run dev

## Reset demo data
    cd backend && npm run seed

## Optional: AI assistant
Put your Claude API key in `backend/.env` as ANTHROPIC_API_KEY=... and restart the backend.

## Business rules
- Working days: Monday to Friday. Office starts 09:30 (later = Late).
- Leave per year: Casual 10, Sick 8, Unpaid unlimited.
- Per day salary = basic / working days
- Deductible days = absent + unpaid leave + floor(late / 3)
- Net salary = basic - deduction + bonus

## Structure
backend/  models, routes (auth, employees, attendance, leaves, payroll, announcements, dashboard, ai), middleware, utils, seed.js
frontend/ React + Vite, pages/ (Dashboard, Employees, Attendance, Leaves, Payroll, Announcements, Assistant, Profile)
