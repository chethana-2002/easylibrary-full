# EasyLibrary

EasyLibrary is a full-stack Library Management System designed to provide separate and secure portals for students and librarians.

The system manages books, book copies, borrowing and returns, student records, reservations, and overdue fines through a centralized library platform.

## Features

### Student Portal

- Student registration and login
- Browse and search the library catalog
- View book availability
- Borrow available books
- View current borrowed books
- View borrowing history
- Reserve unavailable books
- View reservation status
- View overdue books
- View automatically calculated fines
- View profile information

### Librarian Portal

- Secure librarian login
- Library dashboard
- View total books
- View total book copies
- View available copies
- View borrowed books
- View registered students
- View overdue books
- Add books
- Manage book copies
- Process book checkouts
- Process book returns
- View borrowing records
- Manage student details
- Manage reservations
- Track overdue fines

## Advanced Features

### Automatic Library Dashboard

The librarian dashboard calculates library statistics directly from the database.

The displayed statistics include:

- Total Books
- Total Copies
- Available Copies
- Borrowed Books
- Registered Students
- Overdue Books

The values update automatically when books are added, borrowed, or returned.

### Book Reservation System

Students can reserve books when no copy is currently available.

The system maintains reservation records so that students can be handled in order when a copy becomes available.

### Automatic Fine Management

The system identifies overdue loans and calculates fines based on the overdue period.

Fine information can be viewed by the relevant student and managed by the librarian.

## Security

EasyLibrary uses separate user roles for students and librarians.

- Public registration creates student accounts only.
- Librarian accounts are controlled separately.
- Librarian operations are protected by backend authorization.
- Users cannot select the librarian role during normal student registration.

## Technology Stack

### Frontend

- React
- Vite
- JavaScript
- CSS

### Backend

- Node.js
- Express.js

### Database

- SQLite

## Project Structure

```text
EasyLibrary/
│
├── backend/
│   ├── server.js
│   ├── package.json
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md