document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');

    function addTask() {
        const taskText = taskInput.value.trim();

        if (taskText === '') {
            alert('Por favor, ingresa una tarea.');
            return;
        }

        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <span>${taskText}</span>
            <div class="task-actions">
                <button class="complete-btn">Completar</button>
                <button class="delete-btn">Eliminar</button>
            </div>
        `;

        taskList.appendChild(listItem);
        taskInput.value = '';

        const completeBtn = listItem.querySelector('.complete-btn');
        completeBtn.addEventListener('click', () => {
            listItem.classList.toggle('completed');
        });

        const deleteBtn = listItem.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
            taskList.removeChild(listItem);
        });
    }

    addTaskBtn.addEventListener('click', addTask);

    taskInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            addTask();
        }
    });
});