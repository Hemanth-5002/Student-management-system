const mysql = require('mysql2/promise');

async function debugDatabase() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'student_db'
        });

        console.log('--- USERS TABLE ---');
        const [users] = await connection.query('SELECT id, username, email, role FROM users');
        console.table(users);

        console.log('\n--- STUDENTS TABLE ---');
        const [students] = await connection.query('SELECT id, name, email FROM students');
        console.table(students);

        console.log('\n--- ATTENDANCE TABLE ---');
        const [attendance] = await connection.query('SELECT * FROM attendance');
        console.table(attendance);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        if (connection) await connection.end();
    }
}

debugDatabase();
