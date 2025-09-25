# Robust Attendance System

This is a Node.js project for a robust attendance system.

## Technologies Used

*   Node.js
*   Express
*   Sequelize
*   MySQL
*   EJS

## Installation

1.  Clone the repository:

    ```bash
    git clone <repository_url>
    ```
2.  Navigate to the project directory:

    ```bash
    cd robust_attendance_system
    ```
3.  Install dependencies:

    ```bash
    npm install
    ```

## Configuration

1.  Create a MySQL database named `attendance_system`.
2.  Update the database configuration in `config/config.json` with your MySQL credentials.

## Building the CSS

1.  Run the following command to build the CSS:

    ```bash
    npm run build:css
    ```

## Running the Application

1.  Start the server:

    ```bash
    npm start
    ```

2.  Open your browser and navigate to `http://localhost:3000` to view the application.

## API Endpoints

*   `GET /` - Welcome page
*   `GET /health` - Health check
*   `GET /attendances` - Get all attendance records
*   `GET /attendances/:id` - Get attendance record by ID
*   `POST /attendances` - Create new attendance record
*   `PUT /attendances/:id` - Update attendance record
*   `DELETE /attendances/:id` - Delete attendance record
