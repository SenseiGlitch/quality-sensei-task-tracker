import { users, projects, groups, tasks, subtasks } from "@shared/schema";
import type {
  User,
  InsertUser,
  Project,
  Group,
  Task,
  Subtask,
  ProjectWithChildren
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Project operations
  createProject(project: Omit<typeof projects.$inferInsert, "id">): Promise<Project>;
  getProject(id: number): Promise<Project | undefined>;
  getProjectsWithChildren(userId: number): Promise<ProjectWithChildren[]>;

  // Group operations
  createGroup(group: Omit<typeof groups.$inferInsert, "id">): Promise<Group>;
  getGroup(id: number): Promise<Group | undefined>;

  // Task operations
  createTask(task: Omit<typeof tasks.$inferInsert, "id">): Promise<Task>;
  getTask(id: number): Promise<Task | undefined>;
  updateTask(id: number, data: Partial<Task>): Promise<Task>;

  // Subtask operations
  createSubtask(subtask: Omit<typeof subtasks.$inferInsert, "id">): Promise<Subtask>;
  getSubtask(id: number): Promise<Subtask | undefined>;
  updateSubtask(id: number, data: Partial<Subtask>): Promise<Subtask>;

  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private groups: Map<number, Group>;
  private tasks: Map<number, Task>;
  private subtasks: Map<number, Subtask>;
  sessionStore: session.SessionStore;

  private userIdCounter: number = 1;
  private projectIdCounter: number = 1;
  private groupIdCounter: number = 1;
  private taskIdCounter: number = 1;
  private subtaskIdCounter: number = 1;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.groups = new Map();
    this.tasks = new Map();
    this.subtasks = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Prune expired entries every 24h
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user = { id, ...insertUser };
    this.users.set(id, user);
    return user;
  }

  // Project operations
  async createProject(data: Omit<typeof projects.$inferInsert, "id">): Promise<Project> {
    const id = this.projectIdCounter++;
    const project = { id, ...data };
    this.projects.set(id, project);
    return project;
  }

  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjectsWithChildren(userId: number): Promise<ProjectWithChildren[]> {
    const userProjects = Array.from(this.projects.values()).filter(
      (project) => project.userId === userId
    );

    return userProjects.map((project) => {
      const projectGroups = Array.from(this.groups.values()).filter(
        (group) => group.projectId === project.id
      );

      const groupsWithTasks = projectGroups.map((group) => {
        const groupTasks = Array.from(this.tasks.values()).filter(
          (task) => task.groupId === group.id
        );

        const tasksWithSubtasks = groupTasks.map((task) => {
          const taskSubtasks = Array.from(this.subtasks.values()).filter(
            (subtask) => subtask.taskId === task.id
          );

          return {
            ...task,
            subtasks: taskSubtasks,
          };
        });

        return {
          ...group,
          tasks: tasksWithSubtasks,
        };
      });

      return {
        ...project,
        groups: groupsWithTasks,
      };
    });
  }

  // Group operations
  async createGroup(data: Omit<typeof groups.$inferInsert, "id">): Promise<Group> {
    const id = this.groupIdCounter++;
    const group = { id, ...data };
    this.groups.set(id, group);
    return group;
  }

  async getGroup(id: number): Promise<Group | undefined> {
    return this.groups.get(id);
  }

  // Task operations
  async createTask(data: Omit<typeof tasks.$inferInsert, "id">): Promise<Task> {
    const id = this.taskIdCounter++;
    const task = { id, ...data };
    this.tasks.set(id, task);
    return task;
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async updateTask(id: number, data: Partial<Task>): Promise<Task> {
    const task = this.tasks.get(id);
    if (!task) throw new Error("Task not found");
    
    const updatedTask = { ...task, ...data };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  // Subtask operations
  async createSubtask(data: Omit<typeof subtasks.$inferInsert, "id">): Promise<Subtask> {
    const id = this.subtaskIdCounter++;
    const subtask = { id, ...data };
    this.subtasks.set(id, subtask);
    return subtask;
  }

  async getSubtask(id: number): Promise<Subtask | undefined> {
    return this.subtasks.get(id);
  }

  async updateSubtask(id: number, data: Partial<Subtask>): Promise<Subtask> {
    const subtask = this.subtasks.get(id);
    if (!subtask) throw new Error("Subtask not found");
    
    const updatedSubtask = { ...subtask, ...data };
    this.subtasks.set(id, updatedSubtask);
    return updatedSubtask;
  }
}

export const storage = new MemStorage();
