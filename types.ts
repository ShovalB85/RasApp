export interface InventoryItem {
  id: string;
  name: string;
  quantity: number; // For regular items and לל"צ quantity (items without SN)
  hasSerialNumber?: boolean; // צל"ם - indicates if item requires serial number
  serialNumbers?: string[]; // Array of serial numbers for this item (empty array if לל"צ)
}

export interface AssignedItem {
  id: string; // Unique ID for the assignment itself
  name: string;
  quantity: number;
  serialNumber?: string | null; // מס"ד - Serial number for צל"ם items
  provider: string; // e.g., "Rassapiya", "Alog", "Mazi"
  inventoryItemId: string | null; // Links to Taasuka inventory if not external
  taasukaId: string | null; // ID of the Taasuka this item was assigned from
}

export interface Soldier {
  id: string;
  name: string;
  personalId: string;
  assignedItems: AssignedItem[];
  role: 'admin' | 'rassap' | 'soldier';
  password?: string;
}

export interface Team {
  id: string;
  name: string;
  taasukaId: string;
  memberIds: string[];
  leaderId: string;
}

export interface Misgeret {
  id:string;
  name: string;
  personnel: Soldier[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  isComplete: boolean;
  startDate: string; // ISO string for date/time
  isAllDay: boolean;
  isRecurring: boolean;
  recurrence: 'daily' | 'weekly' | 'monthly' | null;
  assignedToType: 'soldier' | 'team';
  assignedToIds: string[]; // can be multiple soldiers or one team ID
  creatorId: string;
  notifyOnComplete: 'creator' | 'all_rassaps';
}

export interface Taasuka {
  id: string;
  name: string;
  misgeretId: string;
  inventory: InventoryItem[];
  tasks: Task[];
  personnelIds: string[]; // IDs of soldiers participating in this Taasuka
  teams: Team[];
}

export interface Notification {
  id: string;
  userId: string; // The user who receives the notification
  message: string;
  isRead: boolean;
  createdAt: string; // ISO string
  taskId?: string; // Optional link to the task
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface AppData {
  misgerets: Misgeret[];
  taasukot: Taasuka[];
  notifications: Notification[];
}