/**
 * Task Schema for URL-based Task Management
 */

export type DesignTask = {
  taskId: string;
  metadata: {
    model: string; // URL or base64
    modelMimeType?: string;
    fabric: string; // URL or base64
    fabricMimeType?: string;
    sliderPos: number;
    createdAt: string; // ISO timestamp
    selectedModel: 'NanoBana' | 'Pro';
    refinementPrompt?: string;
    outputFit?: 'contain' | 'cover';
  };
  results?: {
    thumbnail?: string; // URL
    highRes?: string; // URL
    jobId?: string;
    templateUrl?: string;
    fabricUrl?: string;
  };
};

export type TaskStorageAdapter = {
  getTask(taskId: string): Promise<DesignTask | null>;
  saveTask(task: DesignTask): Promise<void>;
  listTasks(userId?: string): Promise<DesignTask[]>;
  deleteTask(taskId: string): Promise<void>;
};
