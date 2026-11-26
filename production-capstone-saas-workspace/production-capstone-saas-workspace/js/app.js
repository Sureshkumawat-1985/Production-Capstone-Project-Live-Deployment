/* ==========================================================================
   Main Capstone Controller: Auth Flow, CRUD Operations, Catalog & Routing
   ========================================================================== */

import { Store, SERVICE_CATALOG } from './store.js';

let authMode = 'login';
let tasks = Store.getTasks();
let bookings = Store.getBookings();

// DOM Elements
const dom = {
  authView: document.getElementById('authView'),
  appWorkspace: document.getElementById('appWorkspace'),
  authTabs: document.querySelectorAll('.auth-tab'),
  authForm: document.getElementById('authForm'),
  nameFieldGroup: document.getElementById('nameFieldGroup'),
  authName: document.getElementById('authName'),
  authEmail: document.getElementById('authEmail'),
  authPassword: document.getElementById('authPassword'),
  authSubmitBtn: document.getElementById('authSubmitBtn'),
  authError: document.getElementById('authError'),
  demoLoginBtn: document.getElementById('demoLoginBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  userAvatar: document.getElementById('userAvatar'),
  userNameDisplay: document.getElementById('userNameDisplay'),
  themeToggleBtn: document.getElementById('themeToggleBtn'),

  // Navigation & Views
  navPills: document.querySelectorAll('.nav-pill'),
  views: document.querySelectorAll('.workspace-view'),

  // KPIs
  kpiTotalTasks: document.getElementById('kpiTotalTasks'),
  kpiInProgress: document.getElementById('kpiInProgress'),
  kpiCompleted: document.getElementById('kpiCompleted'),
  kpiBookedServices: document.getElementById('kpiBookedServices'),

  // Task CRUD & Filters
  taskGrid: document.getElementById('taskGrid'),
  taskSearchInput: document.getElementById('taskSearchInput'),
  taskStatusFilter: document.getElementById('taskStatusFilter'),
  taskPriorityFilter: document.getElementById('taskPriorityFilter'),
  openCreateTaskBtn: document.getElementById('openCreateTaskBtn'),

  // Modal
  taskModalBackdrop: document.getElementById('taskModalBackdrop'),
  taskModalTitle: document.getElementById('taskModalTitle'),
  closeTaskModalBtn: document.getElementById('closeTaskModalBtn'),
  cancelTaskModalBtn: document.getElementById('cancelTaskModalBtn'),
  taskForm: document.getElementById('taskForm'),
  taskIdInput: document.getElementById('taskIdInput'),
  taskTitleInput: document.getElementById('taskTitleInput'),
  taskDescInput: document.getElementById('taskDescInput'),
  taskStatusInput: document.getElementById('taskStatusInput'),
  taskPriorityInput: document.getElementById('taskPriorityInput'),
  taskTagInput: document.getElementById('taskTagInput'),
  taskDueInput: document.getElementById('taskDueInput'),

  // Catalog & Data Controls
  catalogGrid: document.getElementById('catalogGrid'),
  catalogCategoryFilter: document.getElementById('catalogCategoryFilter'),
  exportJsonBtn: document.getElementById('exportJsonBtn'),
  resetDemoDataBtn: document.getElementById('resetDemoDataBtn'),
  toast: document.getElementById('toast'),
};

function escapeHTML(str = '') {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showToast(msg) {
  dom.toast.textContent = msg;
  dom.toast.classList.remove('hidden');
  clearTimeout(dom.toast._t);
  dom.toast._t = setTimeout(() => dom.toast.classList.add('hidden'), 2500);
}

// --- Theme Management ---
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  Store.setTheme(theme);
  dom.themeToggleBtn.innerHTML = theme === 'dark' ? '&#9728;' : '&#9790;';
}
applyTheme(Store.getTheme());

dom.themeToggleBtn.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

// --- Authentication Simulation ---
function renderAuthState() {
  const session = Store.getSession();
  if (session) {
    dom.authView.classList.add('hidden');
    dom.appWorkspace.classList.remove('hidden');
    dom.userNameDisplay.textContent = session.name;
    dom.userAvatar.textContent = session.name.charAt(0).toUpperCase();
    refreshAllUI();
  } else {
    dom.appWorkspace.classList.add('hidden');
    dom.authView.classList.remove('hidden');
  }
}

dom.authTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    authMode = tab.dataset.authMode;
    dom.authTabs.forEach((t) => t.classList.remove('is-active'));
    tab.classList.add('is-active');
    dom.authError.classList.add('hidden');

    if (authMode === 'register') {
      dom.nameFieldGroup.classList.remove('hidden');
      dom.authName.required = true;
      dom.authSubmitBtn.textContent = 'Create Account & Launch';
    } else {
      dom.nameFieldGroup.classList.add('hidden');
      dom.authName.required = false;
      dom.authSubmitBtn.textContent = 'Sign In to Workspace';
    }
  });
});

dom.authForm.addEventListener('submit', (e) => {
  e.preventDefault();
  dom.authError.classList.add('hidden');

  try {
    const email = dom.authEmail.value.trim();
    const password = dom.authPassword.value;
    let user;

    if (authMode === 'register') {
      const name = dom.authName.value.trim() || 'Workspace Member';
      user = Store.registerUser({ name, email, password });
      showToast('Account created & logged in!');
    } else {
      user = Store.loginUser({ email, password });
      showToast(`Welcome back, ${user.name}!`);
    }

    Store.setSession(user);
    dom.authForm.reset();
    renderAuthState();
  } catch (err) {
    dom.authError.textContent = err.message;
    dom.authError.classList.remove('hidden');
  }
});

dom.demoLoginBtn.addEventListener('click', () => {
  Store.setSession({
    id: 'usr-demo',
    name: 'Capstone Reviewer',
    email: 'demo@taskflow.io',
  });
  showToast('Logged in with Demo Evaluator Account');
  renderAuthState();
});

dom.logoutBtn.addEventListener('click', () => {
  Store.clearSession();
  renderAuthState();
});

// --- View Navigation ---
dom.navPills.forEach((pill) => {
  pill.addEventListener('click', () => {
    const target = pill.dataset.view;
    dom.navPills.forEach((p) => p.classList.remove('is-active'));
    pill.classList.add('is-active');
    dom.views.forEach((v) => v.classList.toggle('hidden', v.id !== target));
  });
});

// --- KPI & Task CRUD Rendering ---
function updateKPIs() {
  dom.kpiTotalTasks.textContent = String(tasks.length);
  dom.kpiInProgress.textContent = String(tasks.filter((t) => t.status === 'in-progress').length);
  dom.kpiCompleted.textContent = String(tasks.filter((t) => t.status === 'done').length);
  dom.kpiBookedServices.textContent = String(bookings.length);
}

function renderTasks() {
  const query = dom.taskSearchInput.value.trim().toLowerCase();
  const statusVal = dom.taskStatusFilter.value;
  const priorityVal = dom.taskPriorityFilter.value;

  const filtered = tasks.filter((t) => {
    const matchQuery =
      !query ||
      t.title.toLowerCase().includes(query) ||
      (t.tag && t.tag.toLowerCase().includes(query));
    const matchStatus = statusVal === 'all' || t.status === statusVal;
    const matchPriority = priorityVal === 'all' || t.priority === priorityVal;
    return matchQuery && matchStatus && matchPriority;
  });

  if (!filtered.length) {
    dom.taskGrid.innerHTML = `
      <div class="glass-panel" style="grid-column: 1 / -1; padding: 2.5rem; text-align: center;">
        <h3>No tasks match your filters</h3>
        <p class="muted-text">Click "+ New Task" to create a task or clear your search filters.</p>
      </div>
    `;
    return;
  }

  dom.taskGrid.innerHTML = filtered
    .map(
      (task) => `
      <article class="item-card glass-panel">
        <div class="item-card__header">
          <span class="badge badge--${escapeHTML(task.status)}">${escapeHTML(task.status)}</span>
          <span class="priority-dot priority--${escapeHTML(task.priority)}">&bull; ${escapeHTML(task.priority.toUpperCase())}</span>
        </div>

        <h3>${escapeHTML(task.title)}</h3>
        <p class="muted-text">${escapeHTML(task.description || 'No description provided.')}</p>

        <div style="display:flex; justify-content:space-between; font-size:0.78rem; color:var(--text-secondary);">
          <span>#${escapeHTML(task.tag || 'General')}</span>
          <span>Due: ${escapeHTML(task.dueDate || 'Flexible')}</span>
        </div>

        <div class="item-card__actions">
          <button class="btn btn--secondary" style="padding:0.35rem 0.65rem; font-size:0.78rem;" data-cycle-id="${task.id}">
            Advance Status &rarr;
          </button>
          <div style="display:flex; gap:0.35rem;">
            <button class="btn btn--secondary" style="padding:0.35rem 0.65rem; font-size:0.78rem;" data-edit-id="${task.id}">Edit</button>
            <button class="btn btn--danger-ghost" style="padding:0.35rem 0.65rem; font-size:0.78rem;" data-delete-id="${task.id}">Delete</button>
          </div>
        </div>
      </article>
    `
    )
    .join('');
}

// Modal Open/Close & Create/Update
function openTaskModal(task = null) {
  dom.taskForm.reset();
  if (task) {
    dom.taskModalTitle.textContent = 'Edit Task';
    dom.taskIdInput.value = task.id;
    dom.taskTitleInput.value = task.title;
    dom.taskDescInput.value = task.description || '';
    dom.taskStatusInput.value = task.status;
    dom.taskPriorityInput.value = task.priority;
    dom.taskTagInput.value = task.tag || '';
    dom.taskDueInput.value = task.dueDate || '';
  } else {
    dom.taskModalTitle.textContent = 'Create New Task';
    dom.taskIdInput.value = '';
  }
  dom.taskModalBackdrop.classList.remove('hidden');
}

function closeTaskModal() {
  dom.taskModalBackdrop.classList.add('hidden');
}

dom.openCreateTaskBtn.addEventListener('click', () => openTaskModal());
dom.closeTaskModalBtn.addEventListener('click', closeTaskModal);
dom.cancelTaskModalBtn.addEventListener('click', closeTaskModal);

dom.taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = dom.taskIdInput.value;
  const payload = {
    title: dom.taskTitleInput.value.trim(),
    description: dom.taskDescInput.value.trim(),
    status: dom.taskStatusInput.value,
    priority: dom.taskPriorityInput.value,
    tag: dom.taskTagInput.value.trim() || 'General',
    dueDate: dom.taskDueInput.value,
  };

  if (id) {
    tasks = tasks.map((t) => (t.id === id ? { ...t, ...payload } : t));
    showToast('Task updated');
  } else {
    tasks.unshift({ id: `tsk-${Date.now()}`, ...payload });
    showToast('New task created');
  }

  Store.saveTasks(tasks);
  closeTaskModal();
  refreshAllUI();
});

// Event Delegation for Task Cards (Cycle Status, Edit, Delete)
dom.taskGrid.addEventListener('click', (e) => {
  const cycleBtn = e.target.closest('[data-cycle-id]');
  if (cycleBtn) {
    const order = ['todo', 'in-progress', 'done'];
    tasks = tasks.map((t) => {
      if (t.id !== cycleBtn.dataset.cycleId) return t;
      const next = order[(order.indexOf(t.status) + 1) % order.length];
      return { ...t, status: next };
    });
    Store.saveTasks(tasks);
    refreshAllUI();
    showToast('Task status updated');
    return;
  }

  const editBtn = e.target.closest('[data-edit-id]');
  if (editBtn) {
    const found = tasks.find((t) => t.id === editBtn.dataset.editId);
    if (found) openTaskModal(found);
    return;
  }

  const deleteBtn = e.target.closest('[data-delete-id]');
  if (deleteBtn) {
    tasks = tasks.filter((t) => t.id !== deleteBtn.dataset.deleteId);
    Store.saveTasks(tasks);
    refreshAllUI();
    showToast('Task deleted');
  }
});

[dom.taskSearchInput, dom.taskStatusFilter, dom.taskPriorityFilter].forEach((el) =>
  el.addEventListener('input', renderTasks)
);

// --- Interactive Service Catalog ---
function renderCatalog() {
  const cat = dom.catalogCategoryFilter.value;
  const items = SERVICE_CATALOG.filter((s) => cat === 'all' || s.category === cat);

  dom.catalogGrid.innerHTML = items
    .map(
      (srv) => `
      <article class="item-card glass-panel">
        <div class="item-card__header">
          <span class="badge badge--in-progress">${escapeHTML(srv.category)}</span>
          <strong>$${srv.price}</strong>
        </div>
        <h3>${escapeHTML(srv.title)}</h3>
        <p class="muted-text">${escapeHTML(srv.description)}</p>
        <div class="item-card__actions">
          <span class="muted-text">SLA: ${escapeHTML(srv.turnaround)}</span>
          <button class="btn btn--primary" data-book-id="${srv.id}">Book &amp; Add Task</button>
        </div>
      </article>
    `
    )
    .join('');
}

dom.catalogCategoryFilter.addEventListener('change', renderCatalog);

dom.catalogGrid.addEventListener('click', (e) => {
  const bookBtn = e.target.closest('[data-book-id]');
  if (!bookBtn) return;

  const service = SERVICE_CATALOG.find((s) => s.id === bookBtn.dataset.bookId);
  if (!service) return;

  bookings = Store.addBooking(service.id);
  tasks.unshift({
    id: `tsk-${Date.now()}`,
    title: `[Booked Service] ${service.title}`,
    description: `${service.description} (Turnaround: ${service.turnaround})`,
    status: 'todo',
    priority: 'high',
    tag: service.category,
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
  });

  Store.saveTasks(tasks);
  refreshAllUI();
  showToast(`Booked "${service.title}" & added to Task Board!`);
});

// --- Data Export & Reset ---
dom.exportJsonBtn.addEventListener('click', () => {
  const dataStr = JSON.stringify({ tasks, bookings }, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'taskflow-capstone-backup.json';
  a.click();
  URL.revokeObjectURL(url);
});

dom.resetDemoDataBtn.addEventListener('click', () => {
  tasks = Store.resetSeedData();
  bookings = Store.getBookings();
  refreshAllUI();
  showToast('Workspace reset to default seed data');
});

function refreshAllUI() {
  updateKPIs();
  renderTasks();
  renderCatalog();
}

// Boot
renderAuthState();
