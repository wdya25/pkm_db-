// Dark Mode Toggle
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.querySelector('.theme-toggle i');
    
    if (body.classList.contains('light')) {
        body.classList.remove('light');
        body.classList.add('dark');
        themeIcon.className = 'fas fa-sun';
    } else {
        body.classList.remove('dark');
        body.classList.add('light');
        themeIcon.className = 'fas fa-moon';
    }
}

// Data tugas (akan digantikan dengan data dari database)
let tasks = [];

// DOM Elements
const tasksList = document.getElementById('tasksList');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const priorityFilter = document.getElementById('priorityFilter');
const taskModal = document.getElementById('taskModal');
const taskForm = document.getElementById('taskForm');
const modalTitle = document.getElementById('modalTitle');

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    loadTasks();
    
    searchInput.addEventListener('input', filterTasks);
    statusFilter.addEventListener('change', filterTasks);
    priorityFilter.addEventListener('change', filterTasks);
    
    taskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveTask();
    });
});

// Load tasks from server
function loadTasks() {
    fetch('/api/tasks')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            tasks = data;
            renderTasks(tasks);
        })
        .catch(error => {
            console.error('Error loading tasks:', error);
            // Fallback to sample data if API fails
            tasks = getSampleTasks();
            renderTasks(tasks);
        });
}

// Get sample tasks (for demo purposes)
function getSampleTasks() {
    return [
        {
            id: 1,
            name: "Tugas Akhir Web Programming",
            course: "Pemrograman Web",
            dueDate: "2023-12-15T23:59",
            priority: "high",
            description: "Membuat aplikasi web dengan Express.js dan MySQL",
            completed: false
        },
        {
            id: 2,
            name: "Laporan Sistem Basis Data",
            course: "Basis Data",
            dueDate: "2023-11-30T23:59",
            priority: "medium",
            description: "Membuat laporan tentang normalisasi database",
            completed: true
        },
        {
            id: 3,
            name: "Presentasi AI",
            course: "Kecerdasan Buatan",
            dueDate: "2023-11-25T10:00",
            priority: "high",
            description: "Presentasi tentang algoritma machine learning",
            completed: false
        }
    ];
}

// Render tasks to the DOM
function renderTasks(tasksToRender) {
    if (tasksToRender.length === 0) {
        tasksList.innerHTML = `
            <div class="empty-state">
                <i class="far fa-calendar-times"></i>
                <h3>Tidak ada tugas</h3>
                <p>Tambahkan tugas baru untuk memulai</p>
            </div>
        `;
        return;
    }
    
    tasksList.innerHTML = '';
    
    tasksToRender.forEach(task => {
        const taskElement = createTaskElement(task);
        tasksList.appendChild(taskElement);
    });
}

// Create HTML for a single task
function createTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = `task-item ${task.completed ? 'completed' : ''} ${isOverdue(task) ? 'overdue' : ''}`;
    
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    const timeDiff = dueDate - now;
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    let dueText = '';
    if (task.completed) {
        dueText = '<span class="task-due"><i class="fas fa-check-circle"></i> Selesai</span>';
    } else if (isOverdue(task)) {
        dueText = `<span class="task-due overdue"><i class="fas fa-exclamation-circle"></i> Terlambat ${Math.abs(daysDiff)} hari</span>`;
    } else if (daysDiff === 0) {
        dueText = `<span class="task-due"><i class="far fa-clock"></i> Hari ini ${dueDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>`;
    } else if (daysDiff === 1) {
        dueText = `<span class="task-due"><i class="far fa-clock"></i> Besok ${dueDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>`;
    } else {
        dueText = `<span class="task-due"><i class="far fa-clock"></i> ${daysDiff} hari lagi (${dueDate.toLocaleDateString()})</span>`;
    }
    
    taskDiv.innerHTML = `
        <div class="task-header-info">
            <div>
                <h3 class="task-title">${task.name}</h3>
                <p class="task-course">${task.course}</p>
                ${task.description ? `<p>${task.description}</p>` : ''}
            </div>
            <div>
                <span class="task-priority priority-${task.priority}">
                    ${task.priority === 'high' ? 'Tinggi' : task.priority === 'medium' ? 'Sedang' : 'Rendah'}
                </span>
            </div>
        </div>
        <div class="task-due-info">
            ${dueText}
        </div>
        <div class="task-actions">
            ${!task.completed ? `
                <button class="btn-action btn-complete" onclick="toggleComplete(${task.id})">
                    <i class="fas fa-check"></i> Tandai Selesai
                </button>
            ` : `
                <button class="btn-action btn-complete" onclick="toggleComplete(${task.id})">
                    <i class="fas fa-undo"></i> Batalkan
                </button>
            `}
            <button class="btn-action btn-edit" onclick="editTask(${task.id})">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn-action btn-delete" onclick="deleteTask(${task.id})">
                <i class="fas fa-trash"></i> Hapus
            </button>
        </div>
    `;
    
    return taskDiv;
}

// Check if a task is overdue
function isOverdue(task) {
    if (task.completed) return false;
    return new Date(task.dueDate) < new Date();
}

// Filter tasks based on search and filters
function filterTasks() {
    const searchTerm = searchInput.value.toLowerCase();
    const status = statusFilter.value;
    const priority = priorityFilter.value;
    
    let filteredTasks = tasks.filter(task => {
        // Search filter
        const matchesSearch = task.name.toLowerCase().includes(searchTerm) || 
                             task.course.toLowerCase().includes(searchTerm);
        
        // Status filter
        let matchesStatus = true;
        if (status === 'active') {
            matchesStatus = !task.completed && !isOverdue(task);
        } else if (status === 'completed') {
            matchesStatus = task.completed;
        } else if (status === 'overdue') {
            matchesStatus = !task.completed && isOverdue(task);
        }
        
        // Priority filter
        let matchesPriority = true;
        if (priority !== 'all') {
            matchesPriority = task.priority === priority;
        }
        
        return matchesSearch && matchesStatus && matchesPriority;
    });
    
    renderTasks(filteredTasks);
}

// Show modal for adding a new task
function showAddForm() {
    modalTitle.textContent = 'Tambah Tugas Baru';
    taskForm.reset();
    document.getElementById('taskId').value = '';
    
    // Set default due date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 0, 0);
    
    document.getElementById('dueDate').value = tomorrow.toISOString().slice(0, 16);
    
    taskModal.style.display = 'block';
}

// Show modal for editing an existing task
function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    modalTitle.textContent = 'Edit Tugas';
    document.getElementById('taskId').value = task.id;
    document.getElementById('taskName').value = task.name;
    document.getElementById('courseName').value = task.course;
    document.getElementById('dueDate').value = task.dueDate.slice(0, 16);
    document.getElementById('priority').value = task.priority;
    document.getElementById('description').value = task.description || '';
    
    taskModal.style.display = 'block';
}

// Close modal
function closeModal() {
    taskModal.style.display = 'none';
}

// Save task (create or update)
function saveTask() {
    const id = document.getElementById('taskId').value;
    const name = document.getElementById('taskName').value;
    const course = document.getElementById('courseName').value;
    const dueDate = document.getElementById('dueDate').value;
    const priority = document.getElementById('priority').value;
    const description = document.getElementById('description').value;
    
    const taskData = {
        name,
        course,
        dueDate,
        priority,
        description,
        completed: false
    };
    
    if (id) {
        // Update existing task
        taskData.id = parseInt(id);
        updateTask(taskData);
    } else {
        // Create new task
        createTask(taskData);
    }
    
    closeModal();
}

// Create a new task
function createTask(taskData) {
    fetch('/api/tasks', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to create task');
        }
        return response.json();
    })
    .then(data => {
        // Reload tasks from server
        loadTasks();
    })
    .catch(error => {
        console.error('Error creating task:', error);
        alert('Gagal membuat tugas. Silakan coba lagi.');
    });
}

// Update an existing task
function updateTask(taskData) {
    fetch(`/api/tasks/${taskData.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update task');
        }
        return response.json();
    })
    .then(data => {
        // Reload tasks from server
        loadTasks();
    })
    .catch(error => {
        console.error('Error updating task:', error);
        alert('Gagal mengupdate tugas. Silakan coba lagi.');
    });
}

// Delete a task
function deleteTask(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus tugas ini?')) {
        return;
    }
    
    fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to delete task');
        }
        return response.json();
    })
    .then(data => {
        // Reload tasks from server
        loadTasks();
    })
    .catch(error => {
        console.error('Error deleting task:', error);
        alert('Gagal menghapus tugas. Silakan coba lagi.');
    });
}

// Toggle task completion status
function toggleComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const updatedTask = {
        ...task,
        completed: !task.completed
    };
    
    fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTask),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update task');
        }
        return response.json();
    })
    .then(data => {
        // Reload tasks from server
        loadTasks();
    })
    .catch(error => {
        console.error('Error updating task:', error);
        alert('Gagal mengupdate status tugas. Silakan coba lagi.');
    });
}

// Close modal when clicking outside of it
window.onclick = function(event) {
    if (event.target === taskModal) {
        closeModal();
    }
}