(() => {
  const STORAGE_KEY = 'daylight-tasks-v1';
  const form = document.querySelector('#task-form');
  const input = document.querySelector('#task-input');
  const list = document.querySelector('#task-list');
  const emptyState = document.querySelector('#empty-state');
  const countLabel = document.querySelector('#task-count');
  const allCount = document.querySelector('#all-count');
  const progressRing = document.querySelector('#progress-ring');
  const progressValue = document.querySelector('#progress-value');
  const clearButton = document.querySelector('#clear-completed');
  const todayLabel = document.querySelector('#today-label');
  const toast = document.querySelector('#toast');
  const filterButtons = [...document.querySelectorAll('.filter-button')];

  let tasks = loadTasks();
  let currentFilter = 'all';
  let toastTimer;

  todayLabel.textContent = new Intl.DateTimeFormat(undefined, {
    weekday: 'long', month: 'long', day: 'numeric'
  }).format(new Date());

  function loadTasks() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(saved) ? saved.filter(task =>
        task && typeof task.id === 'string' && typeof task.text === 'string' && typeof task.completed === 'boolean'
      ) : [];
    } catch {
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      showToast('Could not save tasks in this browser.');
    }
  }

  function render() {
    const completed = tasks.filter(task => task.completed).length;
    const remaining = tasks.length - completed;
    const percentage = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
    const visibleTasks = tasks.filter(task => {
      if (currentFilter === 'active') return !task.completed;
      if (currentFilter === 'completed') return task.completed;
      return true;
    });

    countLabel.textContent = tasks.length === 0
      ? 'You have 0 things on your list'
      : `${remaining} ${remaining === 1 ? 'thing' : 'things'} left to do`;
    allCount.textContent = String(tasks.length);
    progressValue.textContent = `${percentage}%`;
    progressRing.style.background = `conic-gradient(var(--purple) ${percentage}%, #eeeaf7 ${percentage}%)`;
    progressRing.setAttribute('aria-label', `${percentage}% of tasks complete`);
    clearButton.hidden = completed === 0;
    emptyState.hidden = visibleTasks.length > 0;
    list.replaceChildren(...visibleTasks.map(createTaskElement));
  }

  function createTaskElement(task) {
    const item = document.createElement('li');
    item.className = `task-item${task.completed ? ' is-complete' : ''}`;

    const toggle = document.createElement('button');
    toggle.className = 'task-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', `${task.completed ? 'Mark as not done' : 'Mark as done'}: ${task.text}`);
    toggle.setAttribute('aria-pressed', String(task.completed));
    if (task.completed) {
      toggle.innerHTML = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3.5 8.2 3 3 6-6.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
    toggle.addEventListener('click', () => toggleTask(task.id));

    const text = document.createElement('span');
    text.className = 'task-text';
    text.textContent = task.text;

    const remove = document.createElement('button');
    remove.className = 'delete-button';
    remove.type = 'button';
    remove.setAttribute('aria-label', `Delete task: ${task.text}`);
    remove.textContent = '×';
    remove.addEventListener('click', () => deleteTask(task.id));

    item.append(toggle, text, remove);
    return item;
  }

  function addTask(text) {
    tasks.unshift({ id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, text, completed: false });
    saveTasks();
    render();
    showToast('Task added to your list.');
  }

  function toggleTask(id) {
    tasks = tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task);
    saveTasks();
    render();
  }

  function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    render();
    showToast('Task removed.');
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 2200);
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) {
      input.focus();
      return;
    }
    addTask(text);
    input.value = '';
    input.focus();
  });

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      currentFilter = button.dataset.filter;
      filterButtons.forEach(filter => {
        const active = filter === button;
        filter.classList.toggle('active', active);
        filter.setAttribute('aria-pressed', String(active));
      });
      render();
    });
  });

  clearButton.addEventListener('click', () => {
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    render();
    showToast('Completed tasks cleared.');
  });

  render();
})();
