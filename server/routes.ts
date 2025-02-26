import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertProjectSchema, insertGroupSchema, insertTaskSchema, insertSubtaskSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.get("/api/projects", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const projects = await storage.getProjectsWithChildren(req.user.id);
    res.json(projects);
  });

  app.post("/api/projects", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertProjectSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    
    const project = await storage.createProject({
      ...parsed.data,
      userId: req.user.id,
    });
    res.status(201).json(project);
  });

  app.post("/api/projects/:projectId/groups", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertGroupSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    
    const project = await storage.getProject(parseInt(req.params.projectId));
    if (!project || project.userId !== req.user.id) return res.sendStatus(404);

    const group = await storage.createGroup({
      ...parsed.data,
      projectId: project.id,
    });
    res.status(201).json(group);
  });

  app.post("/api/groups/:groupId/tasks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertTaskSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    
    const group = await storage.getGroup(parseInt(req.params.groupId));
    if (!group) return res.sendStatus(404);
    
    const project = await storage.getProject(group.projectId);
    if (!project || project.userId !== req.user.id) return res.sendStatus(404);

    const task = await storage.createTask({
      ...parsed.data,
      groupId: group.id,
    });
    res.status(201).json(task);
  });

  app.post("/api/tasks/:taskId/subtasks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertSubtaskSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    
    const task = await storage.getTask(parseInt(req.params.taskId));
    if (!task) return res.sendStatus(404);
    
    const group = await storage.getGroup(task.groupId);
    if (!group) return res.sendStatus(404);
    
    const project = await storage.getProject(group.projectId);
    if (!project || project.userId !== req.user.id) return res.sendStatus(404);

    const subtask = await storage.createSubtask({
      ...parsed.data,
      taskId: task.id,
    });
    res.status(201).json(subtask);
  });

  app.patch("/api/tasks/:taskId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const task = await storage.getTask(parseInt(req.params.taskId));
    if (!task) return res.sendStatus(404);
    
    const group = await storage.getGroup(task.groupId);
    if (!group) return res.sendStatus(404);
    
    const project = await storage.getProject(group.projectId);
    if (!project || project.userId !== req.user.id) return res.sendStatus(404);

    const updatedTask = await storage.updateTask(task.id, {
      completed: req.body.completed,
    });
    res.json(updatedTask);
  });

  app.patch("/api/subtasks/:subtaskId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const subtask = await storage.getSubtask(parseInt(req.params.subtaskId));
    if (!subtask) return res.sendStatus(404);
    
    const task = await storage.getTask(subtask.taskId);
    if (!task) return res.sendStatus(404);
    
    const group = await storage.getGroup(task.groupId);
    if (!group) return res.sendStatus(404);
    
    const project = await storage.getProject(group.projectId);
    if (!project || project.userId !== req.user.id) return res.sendStatus(404);

    const updatedSubtask = await storage.updateSubtask(subtask.id, {
      completed: req.body.completed,
    });
    res.json(updatedSubtask);
  });

  const httpServer = createServer(app);
  return httpServer;
}
