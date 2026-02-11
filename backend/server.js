const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;
const saltRounds = 10;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MySQL Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Replace with your MySQL username
    password: '', // IMPORTANT: Replace with your actual MySQL password
    database: 'student_db'
});

// Connect to Database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL database:', err);
        return;
    }
    console.log('Connected to MySQL database (student_db)');
});

// --- API Routes ---

// 0. Test Route
app.get('/', (req, res) => {
    res.send('Student Management System Backend is Running!');
});

// 1. Register User
app.post('/register', async (req, res) => {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const query = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';

        db.query(query, [username, email, hashedPassword, role || 'student'], (err, result) => {
            if (err) {
                console.error('Error registering user:', err);
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ error: 'Email already exists.' });
                }
                return res.status(500).json({ error: 'Error registering user' });
            }
            res.status(201).json({ message: 'User registered successfully', user: { id: result.insertId, username, email, role: role || 'student' } });
        });
    } catch (hashError) {
        console.error('Error hashing password:', hashError);
        res.status(500).json({ error: 'Error processing registration' });
    }
});

// 2. Login User
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }
    const query = 'SELECT * FROM users WHERE email = ?';

    db.query(query, [email], async (err, results) => {
        if (err) {
            console.error('Error logging in:', err);
            return res.status(500).json({ error: 'Error logging in' });
        } else if (results.length > 0) {
            const user = results[0];
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                // Passwords match. Don't send password hash to client.
                const { password, ...userWithoutPassword } = user;
                return res.status(200).json({ message: 'Login successful', user: userWithoutPassword });
            }
        }
        // User not found or password doesn't match
        res.status(401).json({ error: 'Invalid credentials' });
    });
});

// 3. Get All Students
app.get('/students', (req, res) => {
    const query = 'SELECT * FROM students';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching students:', err);
            return res.status(500).json({ error: 'Error fetching students' });
        }
        res.status(200).json(results);
    });
});

// 4. Add Student
app.post('/students', (req, res) => {
    const { name, email, course, status } = req.body;
    const query = 'INSERT INTO students (name, email, course, status) VALUES (?, ?, ?, ?)';

    db.query(query, [name, email, course, status], (err, result) => {
        if (err) {
            console.error('Error adding student:', err);
            return res.status(500).json({ error: 'Error adding student' });
        }
        res.status(201).json({ id: result.insertId, name, email, course, status });
    });
});

// 5. Delete Student
app.delete('/students/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM students WHERE id = ?';

    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error deleting student:', err);
            return res.status(500).json({ error: 'Error deleting student' });
        }
        res.status(200).json({ message: 'Student deleted successfully' });
    });
});

// 6. Get All Courses
app.get('/courses', (req, res) => {
    const query = 'SELECT * FROM courses';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching courses:', err);
            return res.status(500).json({ error: 'Error fetching courses' });
        }
        res.status(200).json(results);
    });
});

// 7. Add Course
app.post('/courses', (req, res) => {
    const { name } = req.body;
    const query = 'INSERT INTO courses (name) VALUES (?)';
    db.query(query, [name], (err, result) => {
        if (err) {
            console.error('Error adding course:', err);
            return res.status(500).json({ error: 'Error adding course' });
        }
        res.status(201).json({ id: result.insertId, name });
    });
});

// 8. Delete Course
app.delete('/courses/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM courses WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error deleting course' });
        res.status(200).json({ message: 'Course deleted successfully' });
    });
});

// 9. Get All Subjects
app.get('/subjects', (req, res) => {
    const query = 'SELECT * FROM subjects';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching subjects:', err);
            return res.status(500).json({ error: 'Error fetching subjects' });
        }
        res.status(200).json(results);
    });
});

// 10. Add Subject
app.post('/subjects', (req, res) => {
    const { name } = req.body;
    const query = 'INSERT INTO subjects (name) VALUES (?)';
    db.query(query, [name], (err, result) => {
        if (err) {
            console.error('Error adding subject:', err);
            return res.status(500).json({ error: 'Error adding subject' });
        }
        res.status(201).json({ id: result.insertId, name });
    });
});

// 11. Delete Subject
app.delete('/subjects/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM subjects WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error deleting subject' });
        res.status(200).json({ message: 'Subject deleted successfully' });
    });
});

// 12. Save Student Subjects
app.post('/student-subjects', (req, res) => {
    const { userId, subjectIds } = req.body;
    const values = subjectIds.map(sid => [userId, sid]);
    const query = 'INSERT INTO student_subjects (user_id, subject_id) VALUES ?';
    db.query(query, [values], (err) => {
        if (err) return res.status(500).json({ error: 'Error saving subjects' });
        res.status(200).json({ message: 'Subjects saved successfully' });
    });
});

// 13. Get Attendance for a specific date (and optional studentId)
app.get('/attendance', (req, res) => {
    const { date, studentId } = req.query;
    if (!date) {
        return res.status(400).json({ error: 'Date is required' });
    }

    let query = `
        SELECT 
            s.id, s.name, s.course, s.status as student_status, a.status as daily_status,
            (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = 'Present') as present_count,
            (SELECT COUNT(*) FROM attendance WHERE student_id = s.id) as total_count
        FROM students s 
        LEFT JOIN attendance a ON s.id = a.student_id AND a.date = ?
        WHERE 1=1
    `;

    const params = [date];

    if (studentId) {
        query += ' AND s.id = ?';
        params.push(studentId);
    }

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Error fetching attendance:', err);
            return res.status(500).json({ error: 'Error fetching attendance' });
        }
        const data = results.map(row => {
            let percentage = 0;
            if (row.total_count > 0) {
                percentage = Math.round((row.present_count / row.total_count) * 100);
            } else {
                if (row.student_status === 'active') {
                    percentage = Math.floor(Math.random() * (100 - 80 + 1)) + 80; // Random 80-100%
                } else {
                    percentage = Math.floor(Math.random() * 40); // Random 0-39%
                }
            }
            return {
                id: row.id,
                name: row.name,
                course: row.course,
                status: row.daily_status,
                percentage: percentage
            };
        });
        res.status(200).json(data);
    });
});

// 14. Save/Update Attendance
app.post('/attendance', (req, res) => {
    const { date, attendanceData } = req.body;
    if (!date || !attendanceData || !Array.isArray(attendanceData)) {
        return res.status(400).json({ error: 'Invalid data' });
    }

    const values = attendanceData.map(item => [item.student_id, date, item.status]);
    const query = `
        INSERT INTO attendance (student_id, date, status)
        VALUES ?
        ON DUPLICATE KEY UPDATE status = VALUES(status)
    `;

    db.query(query, [values], (err, result) => {
        if (err) {
            console.error('Error saving attendance:', err);
            return res.status(500).json({ error: 'Error saving attendance' });
        }
        res.status(200).json({ message: 'Attendance saved successfully' });
    });
});

// 15. Generate Random Attendance
app.post('/attendance/generate', (req, res) => {
    const { date } = req.body;
    if (!date) return res.status(400).json({ error: 'Date is required' });

    const getStudentsQuery = 'SELECT id, status FROM students';
    db.query(getStudentsQuery, (err, students) => {
        if (err) return res.status(500).json({ error: 'Error fetching students' });

        const attendanceValues = [];
        students.forEach(student => {
            let attendanceStatus;
            if (student.status === 'active') {
                // >80% chance of being present
                attendanceStatus = Math.random() < 0.85 ? 'Present' : 'Absent';
            } else {
                // <40% chance of being present
                attendanceStatus = Math.random() < 0.35 ? 'Present' : 'Absent';
            }
            attendanceValues.push([student.id, date, attendanceStatus]);
        });

        if (attendanceValues.length === 0) return res.status(200).json({ message: 'No students to mark attendance for.' });

        const insertQuery = 'INSERT INTO attendance (student_id, date, status) VALUES ? ON DUPLICATE KEY UPDATE status = VALUES(status)';
        db.query(insertQuery, [attendanceValues], (err) => {
            if (err) return res.status(500).json({ error: 'Error generating attendance' });
            res.status(200).json({ message: 'Random attendance generated successfully' });
        });
    });
});

// Start Server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
