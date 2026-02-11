const mysql = require('mysql2/promise');

async function setupDatabase() {
    let connection;
    try {
        // Create a connection to the MySQL server (without specifying a database yet)
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '' // Replace with your MySQL password if you have one
        });
        console.log('Connected to MySQL server.');

        // Create Database
        await connection.query('CREATE DATABASE IF NOT EXISTS student_db');
        console.log('Database "student_db" created or already exists.');

        // Switch to the new database
        await connection.changeUser({ database: 'student_db' });
        console.log('Switched to "student_db" database.');

        // Create Users Table
        const usersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(10) NOT NULL DEFAULT 'student'
            )
        `;
        await connection.query(usersTable);
        console.log('Table "users" created or already exists.');

        // Create Students Table
        const studentsTable = `
            CREATE TABLE IF NOT EXISTS students (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL,
                course VARCHAR(100) NOT NULL,
                status VARCHAR(20) DEFAULT 'active'
            )
        `;
        await connection.query(studentsTable);
        console.log('Table "students" created or already exists.');

        // Create Courses Table
        const coursesTable = `
            CREATE TABLE IF NOT EXISTS courses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE
            )
        `;
        await connection.query(coursesTable);
        console.log('Table "courses" created or already exists.');

        // Create Subjects Table
        const subjectsTable = `
            CREATE TABLE IF NOT EXISTS subjects (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE
            )
        `;
        await connection.query(subjectsTable);
        console.log('Table "subjects" created or already exists.');

        // Create Student_Subjects Table (Junction Table)
        const studentSubjectsTable = `
            CREATE TABLE IF NOT EXISTS student_subjects (
                user_id INT NOT NULL,
                subject_id INT NOT NULL,
                PRIMARY KEY (user_id, subject_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
            )
        `;
        await connection.query(studentSubjectsTable);
        console.log('Table "student_subjects" created or already exists.');

        // Create Attendance Table
        const attendanceTable = `
            CREATE TABLE IF NOT EXISTS attendance (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                date DATE NOT NULL,
                status VARCHAR(20) NOT NULL,
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                UNIQUE KEY unique_attendance (student_id, date)
            )
        `;
        await connection.query(attendanceTable);
        console.log('Table "attendance" created or already exists.');

        console.log('Database setup complete.');

    } catch (err) {
        console.error('An error occurred during database setup:', err);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Connection to MySQL closed.');
        }
    }
}

setupDatabase();

