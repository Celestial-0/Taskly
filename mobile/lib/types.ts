export type Task = {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  category?: string; // Now dynamic - can be any string
  priority?: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
};

export type TaskInput = {
  title: string;
  description?: string;
  category?: string; 
  priority?: Task['priority'];
};

export type Category = {
  id: string;
  name: string;
  color: string;
  icon?: string;
  taskCount?: number;
};