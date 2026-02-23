export type UserRole = 'admin' | 'staff';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  passwordHash: string;
}

const USERS_KEY = 'printstock_users';
const SESSION_KEY = 'printstock_session';
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

interface Session {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  createdAt: number;
  lastActivity: number;
}

// Simple hash function for client-side (not cryptographically secure, but better than plaintext)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'h_' + Math.abs(hash).toString(36) + '_' + str.length;
}

function getDefaultUsers(): User[] {
  return [
    { id: '1', username: 'admin', name: 'Admin', role: 'admin', passwordHash: simpleHash('admin123') },
    { id: '2', username: 'staff', name: 'Staff', role: 'staff', passwordHash: simpleHash('staff123') },
  ];
}

export function getUsers(): User[] {
  const data = localStorage.getItem(USERS_KEY);
  if (!data) {
    const defaults = getDefaultUsers();
    localStorage.setItem(USERS_KEY, JSON.stringify(defaults));
    return defaults;
  }
  const users = JSON.parse(data) as User[];
  // Migrate old format (plaintext password) to hashed
  if (users.length > 0 && 'password' in users[0] && !('passwordHash' in users[0])) {
    const migrated = users.map((u: any) => ({
      ...u,
      passwordHash: simpleHash(u.password),
    }));
    migrated.forEach((u: any) => delete u.password);
    localStorage.setItem(USERS_KEY, JSON.stringify(migrated));
    return migrated;
  }
  return users;
}

export function login(username: string, password: string): Omit<User, 'passwordHash'> | null {
  if (!username || !password || username.length > 50 || password.length > 100) return null;
  
  const users = getUsers();
  const hash = simpleHash(password);
  const user = users.find(u => u.username === username && u.passwordHash === hash);
  if (user) {
    const now = Date.now();
    const session: Session = { 
      id: user.id, 
      username: user.username, 
      name: user.name, 
      role: user.role,
      createdAt: now,
      lastActivity: now,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { id: user.id, username: user.username, name: user.name, role: user.role };
  }
  return null;
}

export function addUser(username: string, name: string, password: string, role: UserRole): boolean {
  if (!username || !name || !password) return false;
  const users = getUsers();
  if (users.find(u => u.username === username)) return false;
  const newUser: User = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    username,
    name,
    role,
    passwordHash: simpleHash(password),
  };
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return true;
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function refreshActivity(): void {
  const data = localStorage.getItem(SESSION_KEY);
  if (data) {
    const session: Session = JSON.parse(data);
    session.lastActivity = Date.now();
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}

export function getSession(): Omit<User, 'passwordHash'> | null {
  const data = localStorage.getItem(SESSION_KEY);
  if (!data) return null;
  
  const session: Session = JSON.parse(data);
  const now = Date.now();
  
  // Check session expiration (8 hours)
  if (now - session.createdAt > SESSION_DURATION) {
    logout();
    return null;
  }
  
  // Check inactivity timeout (30 minutes)
  if (now - session.lastActivity > INACTIVITY_TIMEOUT) {
    logout();
    return null;
  }
  
  return { id: session.id, username: session.username, name: session.name, role: session.role };
}
