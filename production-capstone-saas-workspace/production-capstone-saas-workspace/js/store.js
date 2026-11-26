/* ==========================================================================
   Persistent State Store (localStorage CRUD, Auth Session & Catalog Seed)
   ========================================================================== */

const STORAGE_KEYS = {
  SESSION: 'tf_capstone_session_v1',
  USERS: 'tf_capstone_users_v1',
  TASKS: 'tf_capstone_tasks_v1',
  BOOKINGS: 'tf_capstone_bookings_v1',
  THEME: 'tf_capstone_theme_v1',
};

const SEED_TASKS = [
  {
    id: 'tsk-101',
    title: 'Design Mobile-First Token System',
    description: 'Define :root custom properties for typography, spacing, and dark/light modes.',
    status: 'done',
    priority: 'high',
    tag: 'Frontend',
    dueDate: '2026-11-28',
  },
  {
    id: 'tsk-102',
    title: 'Integrate Async REST API & Caching',
    description: 'Build resilient fetch wrapper with skeleton loading states and localStorage cache.',
    status: 'in-progress',
    priority: 'high',
    tag: 'API',
    dueDate: '2026-11-30',
  },
  {
    id: 'tsk-103',
    title: 'Configure Vercel / Netlify Live Deployment',
    description: 'Set up GitHub repository continuous deployment and verify production Lighthouse score.',
    status: 'todo',
    priority: 'medium',
    tag: 'DevOps',
    dueDate: '2026-12-02',
  },
];

export const SERVICE_CATALOG = [
  {
    id: 'srv-01',
    title: 'UI/UX Design Token Audit',
    category: 'Frontend',
    price: 149,
    turnaround: '48 Hours',
    description: 'Complete CSS custom property refactor with WCAG AA contrast verification.',
  },
  {
    id: 'srv-02',
    title: 'RESTful API Integration Sprint',
    category: 'Backend',
    price: 249,
    turnaround: '3 Days',
    description: 'Async ES6+ API layer with retry logic, caching, and error boundary banners.',
  },
  {
    id: 'srv-03',
    title: 'Cloud CI/CD & Edge Deployment',
    category: 'DevOps',
    price: 199,
    turnaround: '24 Hours',
    description: 'Production deployment pipeline on Vercel, Netlify, or Cloudflare Pages with SSL.',
  },
  {
    id: 'srv-04',
    title: 'Full-Stack Performance Optimization',
    category: 'Frontend',
    price: 299,
    turnaround: '4 Days',
    description: 'Zero-CLS responsive layout tuning and 98+ Lighthouse performance optimization.',
  },
];

export const Store = {
  // Theme
  getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
  },
  setTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  },

  // Auth Simulation
  getSession() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSION));
    } catch {
      return null;
    }
  },
  setSession(user) {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
  },
  clearSession() {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  },
  getUsers() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
    } catch {
      return [];
    }
  },
  registerUser({ name, email, password }) {
    const users = this.getUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with this email already exists.');
    }
    const newUser = { id: `usr-${Date.now()}`, name, email, password };
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return { id: newUser.id, name: newUser.name, email: newUser.email };
  },
  loginUser({ email, password }) {
    const users = this.getUsers();
    const match = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!match) {
      throw new Error('Invalid email or password. Try Demo Login or create an account.');
    }
    return { id: match.id, name: match.name, email: match.email };
  },

  // CRUD Tasks
  getTasks() {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!raw) {
      this.saveTasks(SEED_TASKS);
      return [...SEED_TASKS];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [...SEED_TASKS];
    }
  },
  saveTasks(tasks) {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  },
  resetSeedData() {
    this.saveTasks(SEED_TASKS);
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify([]));
    return this.getTasks();
  },

  // Booked Catalog Services
  getBookings() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS)) || [];
    } catch {
      return [];
    }
  },
  addBooking(serviceId) {
    const bookings = this.getBookings();
    bookings.push({ serviceId, bookedAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
    return bookings;
  },
};
