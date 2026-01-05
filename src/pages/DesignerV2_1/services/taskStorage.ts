import { type DesignTask, type TaskStorageAdapter } from '../types/task';

const TASKS_KEY_PREFIX = 'khuyoot:designerV2_1:tasks';

/**
 * LocalStorage-based task storage with mock API structure
 * Combines localStorage for quick retrieval with API-like interface
 */
class LocalStorageTaskAdapter implements TaskStorageAdapter {
  private getStorageKey(userId?: string): string {
    return `${TASKS_KEY_PREFIX}:${userId ?? 'anon'}`;
  }

  private getAllTasks(userId?: string): Map<string, DesignTask> {
    try {
      const key = this.getStorageKey(userId);
      const raw = window.localStorage.getItem(key);
      if (!raw) return new Map();
      
      const obj = JSON.parse(raw) as Record<string, DesignTask>;
      return new Map(Object.entries(obj));
    } catch {
      return new Map();
    }
  }

  private saveAllTasks(tasks: Map<string, DesignTask>, userId?: string): void {
    try {
      const key = this.getStorageKey(userId);
      const obj = Object.fromEntries(tasks);
      window.localStorage.setItem(key, JSON.stringify(obj));
    } catch (err) {
      console.error('[TaskStorage] Failed to save tasks:', err);
    }
  }

  async getTask(taskId: string, userId?: string): Promise<DesignTask | null> {
    const tasks = this.getAllTasks(userId);
    return tasks.get(taskId) ?? null;
  }

  async saveTask(task: DesignTask, userId?: string): Promise<void> {
    const tasks = this.getAllTasks(userId);
    tasks.set(task.taskId, task);
    this.saveAllTasks(tasks, userId);
  }

  async listTasks(userId?: string): Promise<DesignTask[]> {
    const tasks = this.getAllTasks(userId);
    return Array.from(tasks.values()).sort((a, b) => 
      new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime()
    );
  }

  async deleteTask(taskId: string, userId?: string): Promise<void> {
    const tasks = this.getAllTasks(userId);
    tasks.delete(taskId);
    this.saveAllTasks(tasks, userId);
  }
}

export const taskStorage = new LocalStorageTaskAdapter();

/**
 * Generate a unique task ID
 */
export function generateTaskId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Build a shareable URL for a task
 */
export function getTaskUrl(taskId: string): string {
  const base = window.location.origin;
  return `${base}/designer-v2-1/design/${taskId}`;
}

/**
 * Copy URL to clipboard
 */
export async function copyTaskUrlToClipboard(taskId: string): Promise<boolean> {
  try {
    const url = getTaskUrl(taskId);
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}
