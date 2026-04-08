export type UserRole = "admin" | "underwriter" | "business-analyst";

export interface AppUser {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  displayName: string;
}

const STORAGE_KEY = "app_users";

const DEFAULT_USERS: AppUser[] = [
  { id: "1", username: "admin", password: "admin", role: "admin", displayName: "Administrator" },
  { id: "2", username: "emp1", password: "emp1", role: "underwriter", displayName: "Employee 1" },
  { id: "3", username: "emp2", password: "emp2", role: "business-analyst", displayName: "Employee 2" },
];

export function getUsers(): AppUser[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }
  return JSON.parse(stored) as AppUser[];
}

export function getUserById(id: string): AppUser | undefined {
  return getUsers().find((u) => u.id === id);
}

export function saveUser(user: AppUser): void {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx >= 0) {
    users[idx] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export function deleteUser(id: string): void {
  const users = getUsers().filter((u) => u.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  underwriter: "Underwriter",
  "business-analyst": "Business Analyst",
};
