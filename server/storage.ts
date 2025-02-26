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
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

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
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Project operations
  async createProject(data: Omit<typeof projects.$inferInsert, "id">): Promise<Project> {
    const [project] = await db.insert(projects).values(data).returning();
    return project;
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getProjectsWithChildren(userId: number): Promise<ProjectWithChildren[]> {
    // Get all projects for the user
    const userProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId));

    const result: ProjectWithChildren[] = [];

    for (const project of userProjects) {
      // Get all groups for this project
      const projectGroups = await db
        .select()
        .from(groups)
        .where(eq(groups.projectId, project.id));

      const groupsWithTasks = await Promise.all(
        projectGroups.map(async (group) => {
          // Get all tasks for this group
          const groupTasks = await db
            .select()
            .from(tasks)
            .where(eq(tasks.groupId, group.id));

          const tasksWithSubtasks = await Promise.all(
            groupTasks.map(async (task) => {
              // Get all subtasks for this task
              const taskSubtasks = await db
                .select()
                .from(subtasks)
                .where(eq(subtasks.taskId, task.id));

              return {
                ...task,
                subtasks: taskSubtasks,
              };
            })
          );

          return {
            ...group,
            tasks: tasksWithSubtasks,
          };
        })
      );

      result.push({
        ...project,
        groups: groupsWithTasks,
      });
    }

    return result;
  }

  // Group operations
  async createGroup(data: Omit<typeof groups.$inferInsert, "id">): Promise<Group> {
    const [group] = await db.insert(groups).values(data).returning();
    return group;
  }

  async getGroup(id: number): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group;
  }

  // Task operations
  async createTask(data: Omit<typeof tasks.$inferInsert, "id">): Promise<Task> {
    const [task] = await db.insert(tasks).values(data).returning();
    return task;
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async updateTask(id: number, data: Partial<Task>): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set(data)
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  // Subtask operations
  async createSubtask(data: Omit<typeof subtasks.$inferInsert, "id">): Promise<Subtask> {
    const [subtask] = await db.insert(subtasks).values(data).returning();
    return subtask;
  }

  async getSubtask(id: number): Promise<Subtask | undefined> {
    const [subtask] = await db.select().from(subtasks).where(eq(subtasks.id, id));
    return subtask;
  }

  async updateSubtask(id: number, data: Partial<Subtask>): Promise<Subtask> {
    const [subtask] = await db
      .update(subtasks)
      .set(data)
      .where(eq(subtasks.id, id))
      .returning();
    return subtask;
  }
}

export const storage = new DatabaseStorage();