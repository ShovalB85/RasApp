import type { AppData, Soldier, Taasuka, Misgeret, InventoryItem, Task, Notification } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Get auth token from localStorage
const getToken = (): string | null => {
  return localStorage.getItem('rassapp-token');
};

// Set auth token
export const setToken = (token: string): void => {
  localStorage.setItem('rassapp-token', token);
};

// Remove auth token
export const removeToken = (): void => {
  localStorage.removeItem('rassapp-token');
};

// API request helper
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    const errorMessage = error.error || `HTTP error! status: ${response.status}`;
    const apiError = new Error(errorMessage) as any;
    apiError.status = response.status;
    apiError.response = error;
    throw apiError;
  }

  return response.json();
};

// Auth API
export const authApi = {
  login: async (personalId: string, password?: string) => {
    return apiRequest<{ token?: string; user?: any; needsPassword?: boolean; needsPasswordEntry?: boolean; personalId?: string; userId?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ personalId, password }),
    });
  },

  setPassword: async (personalId: string, password: string) => {
    return apiRequest<{ token: string; user: any }>('/auth/set-password', {
      method: 'POST',
      body: JSON.stringify({ personalId, password }),
    });
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return apiRequest<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  getMe: async () => {
    return apiRequest<any>('/auth/me');
  },
};

// Misgeret API
export const misgeretApi = {
  getAll: async (): Promise<Misgeret[]> => {
    return apiRequest<Misgeret[]>('/misgerets');
  },

  create: async (name: string): Promise<Misgeret> => {
    return apiRequest<Misgeret>('/misgerets', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  addPersonnel: async (misgeretId: string, name: string, personalId: string, role: 'soldier' | 'rassap' | 'admin') => {
    return apiRequest<any>(`/misgerets/${misgeretId}/personnel`, {
      method: 'POST',
      body: JSON.stringify({ name, personalId, role }),
    });
  },
};

// Taasuka API
export const taasukaApi = {
  getAll: async (): Promise<Taasuka[]> => {
    return apiRequest<Taasuka[]>('/taasukot');
  },

  getById: async (id: string): Promise<Taasuka> => {
    return apiRequest<Taasuka>(`/taasukot/${id}`);
  },

  create: async (name: string, misgeretId: string): Promise<Taasuka> => {
    return apiRequest<Taasuka>('/taasukot', {
      method: 'POST',
      body: JSON.stringify({ name, misgeretId }),
    });
  },

  update: async (id: string, updates: Partial<Taasuka>): Promise<Taasuka> => {
    return apiRequest<Taasuka>(`/taasukot/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  removeSoldier: async (taasukaId: string, soldierId: string): Promise<Taasuka> => {
    const taasuka = await taasukaApi.getById(taasukaId);
    const updatedPersonnelIds = taasuka.personnelIds.filter(id => id !== soldierId);
    return taasukaApi.update(taasukaId, { personnelIds: updatedPersonnelIds });
  },

  delete: async (id: string): Promise<void> => {
    return apiRequest<void>(`/taasukot/${id}`, {
      method: 'DELETE',
    });
  },

  addInventory: async (taasukaId: string, items: Array<Omit<InventoryItem, 'id'>>): Promise<InventoryItem[]> => {
    return apiRequest<InventoryItem[]>(`/taasukot/${taasukaId}/inventory`, {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  },

  updateInventoryItem: async (taasukaId: string, itemId: string, quantity?: number, serialNumbers?: string[]): Promise<InventoryItem> => {
    const body: any = {};
    if (quantity !== undefined) body.quantity = quantity;
    if (serialNumbers !== undefined) body.serialNumbers = serialNumbers;
    
    return apiRequest<InventoryItem>(`/taasukot/${taasukaId}/inventory/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  deleteInventoryItem: async (taasukaId: string, itemId: string): Promise<void> => {
    return apiRequest<void>(`/taasukot/${taasukaId}/inventory/${itemId}`, {
      method: 'DELETE',
    });
  },
};

// Team API
export const teamApi = {
  createOrUpdate: async (taasukaId: string, teamData: { id?: string; name: string; memberIds: string[]; leaderId: string }): Promise<any> => {
    return apiRequest<any>(`/taasukot/${taasukaId}/teams`, {
      method: 'POST',
      body: JSON.stringify(teamData),
    });
  },

  delete: async (taasukaId: string, teamId: string): Promise<any> => {
    return apiRequest<any>(`/taasukot/${taasukaId}/teams/${teamId}`, {
      method: 'DELETE',
    });
  },
};

// Soldier API
export const soldierApi = {
  getById: async (id: string) => {
    return apiRequest<any>(`/soldiers/${id}`);
  },

  assignItem: async (soldierId: string, item: {
    name: string;
    quantity: number;
    serialNumber?: string | null;
    provider?: string;
    inventoryItemId?: string;
    taasukaId?: string;
  }) => {
    return apiRequest<any>(`/soldiers/${soldierId}/assign-item`, {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  updateAssignedItemQuantity: async (soldierId: string, itemId: string, quantity: number) => {
    return apiRequest<any>(`/soldiers/${soldierId}/assigned-items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  },

  removeAssignedItem: async (soldierId: string, itemId: string) => {
    return apiRequest<void>(`/soldiers/${soldierId}/assigned-items/${itemId}`, {
      method: 'DELETE',
    });
  },

  updateRole: async (soldierId: string, role: 'admin' | 'rassap' | 'soldier') => {
    return apiRequest<any>(`/soldiers/${soldierId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  },

  delete: async (soldierId: string) => {
    return apiRequest<void>(`/soldiers/${soldierId}`, {
      method: 'DELETE',
    });
  },
};

// Task API
export const taskApi = {
  create: async (task: Omit<Task, 'id'>): Promise<Task> => {
    return apiRequest<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  },

  update: async (id: string, updates: Partial<Task>): Promise<Task> => {
    return apiRequest<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string): Promise<void> => {
    return apiRequest<void>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  },
};

// Notification API
export const notificationApi = {
  getAll: async (): Promise<Notification[]> => {
    return apiRequest<Notification[]>('/notifications');
  },

  markAsRead: async (id: string): Promise<Notification> => {
    return apiRequest<Notification>(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  },
};

// Combined API for AppData (for initial load)
export const getAppData = async (): Promise<AppData> => {
  const [misgerets, taasukot, notifications] = await Promise.all([
    misgeretApi.getAll(),
    taasukaApi.getAll(),
    notificationApi.getAll(),
  ]);

  return {
    misgerets,
    taasukot,
    notifications,
  };
};

// Save data (updates are done through individual APIs)
export const saveAppData = async (data: AppData): Promise<void> => {
  // This is a no-op since we update data through individual API calls
  // But we keep it for compatibility
  console.log('saveAppData called - use individual API methods instead');
};


