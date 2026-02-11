document.addEventListener('DOMContentLoaded', () => {
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    if (!loggedInUser) {
        window.location.href = 'index.html';
        return;
    }

    const subjectsForm = document.getElementById('subjects-form');
    const subjectsList = document.getElementById('subjects-list');
    const errorMsg = document.getElementById('error-msg');

    // Fetch subjects
    fetch('http://localhost:3000/courses')
        .then(res => res.json())
        .then(courses => {
            if (courses.length === 0) {
                subjectsList.innerHTML = '<p style="text-align:center">No courses available.</p>';
                return;
            }
            courses.forEach(course => {
                const div = document.createElement('div');
                div.className = 'subject-item';
                div.innerHTML = `
                    <label>
                        <input type="checkbox" name="subject" value="${course.id}">
                        ${course.name}
                    </label>
                `;
                subjectsList.appendChild(div);
            });
        });

    // Limit selection to 4
    subjectsList.addEventListener('change', () => {
        const selectedCount = document.querySelectorAll('input[name="subject"]:checked').length;
        const checkboxes = document.querySelectorAll('input[name="subject"]');
        checkboxes.forEach(cb => {
            if (!cb.checked) {
                cb.disabled = selectedCount >= 4;
            }
        });
    });

    subjectsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const selected = Array.from(document.querySelectorAll('input[name="subject"]:checked'))
            .map(cb => cb.value);

        if (selected.length === 0) {
            errorMsg.textContent = 'Please select at least one subject.';
            return;
        }

        fetch('http://localhost:3000/student-subjects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: loggedInUser.id, subjectIds: selected })
        })
        .then(res => res.json())
        .then(() => {
            alert('Subjects selected successfully!');
            window.location.href = 'dashboard.html';
        })
        .catch(err => console.error(err));
    });
});