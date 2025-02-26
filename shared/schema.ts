import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  password: text("password").notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").notNull(),
});

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  projectId: integer("project_id").notNull(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  groupId: integer("group_id").notNull(),
});

export const subtasks = pgTable("subtasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  taskId: integer("task_id").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  firstName: true,
  lastName: true,
  email: true,
  password: true,
}).extend({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
});

export const insertGroupSchema = createInsertSchema(groups).pick({
  name: true,
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  title: true,
});

export const insertSubtaskSchema = createInsertSchema(subtasks).pick({
  title: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Subtask = typeof subtasks.$inferSelect;

export type ProjectWithChildren = Project & {
  groups: (Group & {
    tasks: (Task & {
      subtasks: Subtask[];
    })[];
  })[];
};