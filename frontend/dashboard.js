document.addEventListener('DOMContentLoaded', () => {
    // --- 1. User Authentication Check ---
    const user = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // Display welcome user
    const welcomeMsg = document.getElementById('welcome-message');
    if (welcomeMsg) {
        welcomeMsg.innerHTML = `<p>Welcome, <b>${user.username}</b> (${user.role})</p>`;
    }

    // --- Role Based UI Controls ---
    const navDashboard = document.getElementById('nav-dashboard');
    const navStudents = document.getElementById('nav-students');
    const navCourses = document.getElementById('nav-courses');
    const navSubjects = document.getElementById('nav-subjects'); // Admin manage subjects
    const navAttendance = document.getElementById('nav-attendance');
    const navStudentSubjects = document.getElementById('nav-student-subjects'); // Student view subjects

    const addCourseContainer = document.getElementById('add-course-container');
    const generateAttendanceBtn = document.getElementById('generate-attendance-btn');
    const saveAttendanceBtn = document.getElementById('save-attendance-btn');

    if (user.role === 'admin') {
        if (navSubjects) navSubjects.style.display = 'block';
        if (addCourseContainer) addCourseContainer.style.display = 'block';
    } else if (user.role === 'student') {
        // HIDE Admin links
        if (navDashboard) navDashboard.style.display = 'none';
        if (navStudents) navStudents.style.display = 'none';
        if (navCourses) navCourses.style.display = 'none'; // Admin courses
        if (navSubjects) navSubjects.style.display = 'none'; // Admin subjects

        // SHOW Student links
        if (navStudentSubjects) {
            navStudentSubjects.style.display = 'block';
        }

        // HIDE Admin buttons
        if (generateAttendanceBtn) generateAttendanceBtn.style.display = 'none';
        if (saveAttendanceBtn) saveAttendanceBtn.style.display = 'none';
        if (addCourseContainer) addCourseContainer.style.display = 'none';
    }

    // --- 2. Navigation Logic ---
    const links = document.querySelectorAll('.sidebar nav a');
    const views = document.querySelectorAll('.page-view');

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');

            // Update active link
            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Show target view
            views.forEach(view => {
                if (view.id === targetId) {
                    view.classList.remove('hidden');
                } else {
                    view.classList.add('hidden');
                }
            });

            // Load data based on view
            if (targetId === 'dashboard-view') loadDashboardStats();
            if (targetId === 'students-view') loadStudents();
            if (targetId === 'courses-view') loadCourses();
            if (targetId === 'subjects-view') loadSubjects();
        });
    });

    // --- 3. Logout ---
    document.getElementById('logout-btn').addEventListener('click', () => {
        sessionStorage.removeItem('loggedInUser');
        window.location.href = 'index.html';
    });


    // --- 4. Dashboard Stats & Charts ---
    // Initialize charts references
    let activeChart = null;
    let inactiveChart = null;

    function loadDashboardStats() {
        if (user.role === 'student') return; // Students don't see dashboard stats

        console.log('Loading dashboard stats...');
        fetch('http://localhost:3000/students')
            .then(res => res.json())
            .then(students => {
                const activeCount = students.filter(s => s.status === 'active').length;
                const inactiveCount = students.filter(s => s.status === 'inactive').length;

                document.getElementById('active-count-display').textContent = activeCount;
                document.getElementById('inactive-count-display').textContent = inactiveCount;

                updateCharts(activeCount, inactiveCount);
            })
            .catch(err => console.error('Error loading stats:', err));
    }

    function updateCharts(active, inactive) {
        const ctxActive = document.getElementById('activeStudentChart').getContext('2d');
        const ctxInactive = document.getElementById('inactiveStudentChart').getContext('2d');

        if (activeChart) activeChart.destroy();
        if (inactiveChart) inactiveChart.destroy();

        activeChart = new Chart(ctxActive, {
            type: 'pie',
            data: {
                labels: ['Active', 'Inactive'],
                datasets: [{
                    data: [active, inactive],
                    backgroundColor: ['#28a745', '#dc3545']
                }]
            }
        });

        inactiveChart = new Chart(ctxInactive, {
            type: 'bar',
            data: {
                labels: ['Active', 'Inactive'],
                datasets: [{
                    label: 'Number of Students',
                    data: [active, inactive],
                    backgroundColor: ['#28a745', '#dc3545']
                }]
            },
            options: {
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }


    // --- 5. Student Management ---
    const studentListUl = document.getElementById('students-ul');
    const studentFilterBtns = document.querySelectorAll('.filter-btn');
    let allStudents = [];

    function loadStudents() {
        if (user.role === 'student') return;

        fetch('http://localhost:3000/students')
            .then(res => res.json())
            .then(data => {
                allStudents = data;
                renderStudents(allStudents);
            })
            .catch(err => console.error('Error loading students:', err));
    }

    function renderStudents(students) {
        studentListUl.innerHTML = '';
        if (students.length === 0) {
            studentListUl.innerHTML = '<p>No students found.</p>';
            return;
        }
        students.forEach(student => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    <strong>${student.name}</strong> (${student.course})<br>
                    <small>${student.email}</small>
                </div>
                <div>
                    <span class="status status-${student.status}">${student.status}</span>
                    <button class="delete-btn" onclick="deleteStudent(${student.id})">Delete</button>
                </div>
            `;
            studentListUl.appendChild(li);
        });
    }

    // Add Student
    const addStudentForm = document.getElementById('add-student-form');
    if (addStudentForm) {
        addStudentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('student-name').value;
            const email = document.getElementById('student-email').value;
            const course = document.getElementById('student-course').value;
            const status = document.getElementById('student-status').value;

            fetch('http://localhost:3000/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, course, status })
            })
                .then(res => res.json())
                .then(data => {
                    alert('Student added successfully!');
                    addStudentForm.reset();
                    loadStudents(); // Reload list
                })
                .catch(err => console.error('Error adding student:', err));
        });
    }

    // Filter Students
    studentFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            studentFilterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const status = btn.getAttribute('data-status');
            if (status === 'all') {
                renderStudents(allStudents);
            } else {
                renderStudents(allStudents.filter(s => s.status === status));
            }
        });
    });

    // Delete Student Global Function
    window.deleteStudent = (id) => {
        if (!confirm('Are you sure you want to delete this student?')) return;
        fetch(`http://localhost:3000/students/${id}`, { method: 'DELETE' })
            .then(res => {
                if (res.ok) {
                    alert('Student deleted.');
                    loadStudents();
                } else {
                    alert('Failed to delete student.');
                }
            })
            .catch(err => console.error(err));
    };


    // --- 6. Course & Subject Management ---
    const coursesUl = document.getElementById('courses-ul');

    function loadCourses() {
        console.log("Loading courses...");
        fetch('http://localhost:3000/courses')
            .then(res => res.json())
            .then(data => {
                coursesUl.innerHTML = '';
                if (data.length === 0) {
                    coursesUl.innerHTML = '<p>No courses available.</p>';
                    return;
                }
                data.forEach(course => {
                    const li = document.createElement('li');

                    let deleteBtnVisi = '';
                    if (user.role === 'student') {
                        deleteBtnVisi = 'display:none;';
                    }

                    li.innerHTML = `
                        <span>${course.name}</span>
                        <button class="delete-btn" style="${deleteBtnVisi}" onclick="deleteCourse(${course.id})">Delete</button>
                    `;
                    coursesUl.appendChild(li);
                });
            })
            .catch(err => console.error('Error loading courses:', err));
    }

    // Add Course
    const addCourseForm = document.getElementById('add-course-form');
    if (addCourseForm) {
        addCourseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('course-name').value;
            fetch('http://localhost:3000/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            })
                .then(res => res.json())
                .then(() => {
                    alert('Course added!');
                    document.getElementById('course-name').value = ''; // Clear input
                    loadCourses();
                })
                .catch(err => console.error(err));
        });
    }

    window.deleteCourse = (id) => {
        if (!confirm('Delete this course?')) return;
        fetch(`http://localhost:3000/courses/${id}`, { method: 'DELETE' })
            .then(res => {
                if (res.ok) {
                    loadCourses();
                } else {
                    alert('Failed to delete course');
                }
            });
    };


    // --- 7. Admin Manage Subjects ---
    const subjectsUl = document.getElementById('admin-subjects-list');

    function loadSubjects() {
        // Allow students to view subjects, but read-only

        fetch('http://localhost:3000/subjects')
            .then(res => res.json())
            .then(data => {
                subjectsUl.innerHTML = '';
                if (data.length === 0) {
                    subjectsUl.innerHTML = '<li>No subjects found.</li>';
                    return;
                }
                data.forEach(sub => {
                    const li = document.createElement('li');
                    li.style.display = 'flex';
                    li.style.justifyContent = 'space-between';
                    li.style.padding = '5px 0';

                    let deleteBtn = `<button class="delete-btn" onclick="deleteSubject(${sub.id})">Delete</button>`;
                    if (user.role === 'student') {
                        deleteBtn = ''; // Hide delete button for students
                    }

                    li.innerHTML = `
                        <span>${sub.name}</span>
                        ${deleteBtn}
                    `;
                    subjectsUl.appendChild(li);
                });
            });
    }

    const addSubjectForm = document.getElementById('add-subject-form');
    if (addSubjectForm) {
        addSubjectForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('new-subject-name').value;
            fetch('http://localhost:3000/subjects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            })
                .then(res => res.json())
                .then(() => {
                    alert('Subject added!');
                    document.getElementById('new-subject-name').value = '';
                    loadSubjects();
                });
        });
    }

    window.deleteSubject = (id) => {
        if (!confirm('Delete subject?')) return;
        fetch(`http://localhost:3000/subjects/${id}`, { method: 'DELETE' })
            .then(res => {
                if (res.ok) loadSubjects();
            });
    };


    // --- 8. Attendance Management ---
    const attendanceTbody = document.getElementById('attendance-tbody');

    // Load Attendance
    document.getElementById('load-attendance-btn').addEventListener('click', () => {
        const date = document.getElementById('attendance-date').value;
        if (!date) {
            alert('Please select a date.');
            return;
        }
        loadAttendance(date);
    });

    function loadAttendance(date) {
        let url = `http://localhost:3000/attendance?date=${date}`;

        if (user.role === 'student') {
            // Find student ID by email matching the logged in user
            fetch('http://localhost:3000/students')
                .then(res => res.json())
                .then(students => {
                    // Robust matching: Trim and Lowercase
                    const userEmail = user.email.trim().toLowerCase();
                    const me = students.find(s => s.email.trim().toLowerCase() === userEmail);

                    if (me) {
                        url += `&studentId=${me.id}`;
                        fetchAttendanceData(url);
                    } else {
                        console.error('Student record not found for email:', user.email);
                        attendanceTbody.innerHTML = `
                            <tr><td colspan="4" style="color: red; text-align: center;">
                                Error: Student record not found for email "<b>${user.email}</b>".<br>
                                Please ask Admin to ensure your Student Record email matches your Login email.
                            </td></tr>`;
                    }
                })
                .catch(err => {
                    console.error('Error fetching students for ID lookup:', err);
                    attendanceTbody.innerHTML = '<tr><td colspan="4">Error verifying student identity.</td></tr>';
                });
            return;
        }

        fetchAttendanceData(url);
    }

    function fetchAttendanceData(url) {
        attendanceTbody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
        fetch(url)
            .then(res => res.json())
            .then(data => {
                renderAttendanceTable(data);
            })
            .catch(err => {
                console.error(err);
                attendanceTbody.innerHTML = '<tr><td colspan="4">Error loading data.</td></tr>';
            });
    }

    function renderAttendanceTable(data) {
        attendanceTbody.innerHTML = '';
        if (data.length === 0) {
            attendanceTbody.innerHTML = '<tr><td colspan="4">No records found.</td></tr>';
            return;
        }
        data.forEach(item => {
            const tr = document.createElement('tr');
            const isPresent = item.status === 'Present';
            const isAbsent = item.status === 'Absent';

            let statusHtml = '';
            if (user.role === 'student') {
                // Read Only View
                statusHtml = `<strong>${item.status || '-'}</strong>`;
            } else {
                // Admin Editable View
                statusHtml = `
                    <label style="margin-right: 10px;">
                        <input type="radio" name="status-${item.id}" value="Present" ${isPresent ? 'checked' : ''} required> Present
                    </label>
                    <label>
                        <input type="radio" name="status-${item.id}" value="Absent" ${isAbsent ? 'checked' : ''}> Absent
                    </label>
                `;
            }

            tr.innerHTML = `
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.course}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.percentage}%</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    ${statusHtml}
                </td>
            `;
            attendanceTbody.appendChild(tr);
        });
    }

    // Generate Random Attendance
    const generateBtn = document.getElementById('generate-attendance-btn');
    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            const date = document.getElementById('attendance-date').value;
            if (!date) {
                alert('Please select a date first.');
                return;
            }
            if (!confirm('This will overwrite existing attendance for this date. Continue?')) return;

            fetch('http://localhost:3000/attendance/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date })
            })
                .then(res => res.json())
                .then(res => {
                    alert(res.message);
                    loadAttendance(date);
                })
                .catch(err => console.error(err));
        });
    }

    // Save Attendance
    const attendanceForm = document.getElementById('attendance-form');
    if (attendanceForm) {
        attendanceForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const date = document.getElementById('attendance-date').value;
            if (!date) {
                alert('Please select a date.');
                return;
            }

            const rows = attendanceTbody.querySelectorAll('tr');
            const attendanceData = [];

            rows.forEach(row => {
                // Get student ID from the radio button name "status-{id}"
                const radio = row.querySelector('input[type="radio"]');
                if (radio) {
                    const nameAttr = radio.getAttribute('name'); // e.g., "status-5"
                    const studentId = nameAttr.split('-')[1];

                    // Check which radio is checked
                    const checkedRadio = row.querySelector(`input[name="${nameAttr}"]:checked`);
                    if (checkedRadio) {
                        attendanceData.push({
                            student_id: studentId,
                            status: checkedRadio.value
                        });
                    }
                }
            });

            if (attendanceData.length === 0) {
                alert('No attendance data to save.');
                return;
            }

            fetch('http://localhost:3000/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date, attendanceData })
            })
                .then(res => res.json())
                .then(res => {
                    alert('Attendance saved successfully!');
                    loadAttendance(date); // Refresh to be sure
                })
                .catch(err => console.error(err));
        });
    }

    // Initial Load
    // Trigger the first available link for the user
    // We need to wait a tick for the UI to update visibility
    setTimeout(() => {
        if (user.role === 'student') {
            if (navStudentSubjects) navStudentSubjects.click();
        } else {
            if (navDashboard) navDashboard.click();
        }
    }, 100);

});
