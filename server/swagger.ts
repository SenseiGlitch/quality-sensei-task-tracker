import { OpenAPIV3 } from "openapi-types";

export const swaggerDocument: OpenAPIV3.Document = {
  openapi: "3.0.0",
  info: {
    title: "Quality Sensei API",
    description: "API documentation for Quality Sensei todo list application",
    version: "1.0.0",
  },
  servers: [
    {
      url: "/api",
      description: "API server",
    },
  ],
  paths: {
    "/register": {
      post: {
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "password", "firstName", "lastName", "email"],
                properties: {
                  username: { type: "string" },
                  password: { type: "string" },
                  firstName: { type: "string" },
                  lastName: { type: "string" },
                  email: { type: "string", format: "email" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "User created successfully",
          },
          400: {
            description: "Invalid input",
          },
        },
      },
    },
    "/login": {
      post: {
        summary: "Login with username and password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "password"],
                properties: {
                  username: { type: "string" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Login successful",
          },
          401: {
            description: "Invalid credentials",
          },
        },
      },
    },
    "/logout": {
      post: {
        summary: "Logout current user",
        responses: {
          200: {
            description: "Logout successful",
          },
        },
      },
    },
    "/projects": {
      get: {
        summary: "Get all projects for the current user",
        responses: {
          200: {
            description: "List of projects with their groups, tasks, and subtasks",
          },
          401: {
            description: "Not authenticated",
          },
        },
      },
      post: {
        summary: "Create a new project",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Project created successfully",
          },
          400: {
            description: "Invalid input",
          },
          401: {
            description: "Not authenticated",
          },
        },
      },
    },
    "/projects/{projectId}/groups": {
      post: {
        summary: "Create a new group in a project",
        parameters: [
          {
            name: "projectId",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Group created successfully",
          },
          400: {
            description: "Invalid input",
          },
          401: {
            description: "Not authenticated",
          },
          404: {
            description: "Project not found",
          },
        },
      },
    },
    "/groups/{groupId}/tasks": {
      post: {
        summary: "Create a new task in a group",
        parameters: [
          {
            name: "groupId",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title"],
                properties: {
                  title: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Task created successfully",
          },
          400: {
            description: "Invalid input",
          },
          401: {
            description: "Not authenticated",
          },
          404: {
            description: "Group not found",
          },
        },
      },
    },
    "/tasks/{taskId}": {
      patch: {
        summary: "Update a task",
        parameters: [
          {
            name: "taskId",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  completed: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Task updated successfully",
          },
          401: {
            description: "Not authenticated",
          },
          404: {
            description: "Task not found",
          },
        },
      },
    },
  },
};
