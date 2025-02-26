import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProjectSchema, insertGroupSchema, insertTaskSchema, insertSubtaskSchema, ProjectWithChildren } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, PlusCircle, LogOut, CheckCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  const { data: projects, isLoading } = useQuery<ProjectWithChildren[]>({
    queryKey: ["/api/projects"],
  });

  const projectForm = useForm({
    resolver: zodResolver(insertProjectSchema),
  });

  const groupForm = useForm({
    resolver: zodResolver(insertGroupSchema),
  });

  const taskForm = useForm({
    resolver: zodResolver(insertTaskSchema),
  });

  const subtaskForm = useForm({
    resolver: zodResolver(insertSubtaskSchema),
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await apiRequest("POST", "/api/projects", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      projectForm.reset();
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async ({ projectId, data }: { projectId: number; data: { name: string } }) => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/groups`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      groupForm.reset();
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async ({ groupId, data }: { groupId: number; data: { title: string } }) => {
      const res = await apiRequest("POST", `/api/groups/${groupId}/tasks`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      taskForm.reset();
    },
  });

  const createSubtaskMutation = useMutation({
    mutationFn: async ({ taskId, data }: { taskId: number; data: { title: string } }) => {
      const res = await apiRequest("POST", `/api/tasks/${taskId}/subtasks`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      subtaskForm.reset();
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ taskId, completed }: { taskId: number; completed: boolean }) => {
      const res = await apiRequest("PATCH", `/api/tasks/${taskId}`, { completed });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
  });

  const toggleSubtaskMutation = useMutation({
    mutationFn: async ({ subtaskId, completed }: { subtaskId: number; completed: boolean }) => {
      const res = await apiRequest("PATCH", `/api/subtasks/${subtaskId}`, { completed });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Quality Sensei
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">Welcome, {user?.username}</span>
            <Button variant="outline" size="sm" onClick={() => logoutMutation.mutate()}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-6">
          <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Projects
              </CardTitle>
              <CardDescription>Manage your tasks and projects</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...projectForm}>
                <form
                  onSubmit={projectForm.handleSubmit((data) => createProjectMutation.mutate(data))}
                  className="flex gap-2 mb-4"
                >
                  <FormField
                    control={projectForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="New project name" className="bg-background" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" size="icon" disabled={createProjectMutation.isPending}>
                    {createProjectMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <PlusCircle className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </Form>

              <ScrollArea className="h-[calc(100vh-300px)]">
                <Accordion
                  type="single"
                  collapsible
                  className="space-y-2"
                  value={selectedProject?.toString()}
                  onValueChange={(value) => setSelectedProject(value ? parseInt(value) : null)}
                >
                  {projects?.map((project) => (
                    <AccordionItem key={project.id} value={project.id.toString()} className="border border-border/40 rounded-lg overflow-hidden">
                      <AccordionTrigger className="hover:bg-primary/5 px-4">
                        {project.name}
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pt-2 pb-4">
                        <Form {...groupForm}>
                          <form
                            onSubmit={groupForm.handleSubmit((data) =>
                              createGroupMutation.mutate({ projectId: project.id, data })
                            )}
                            className="flex gap-2 mb-4"
                          >
                            <FormField
                              control={groupForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input placeholder="New group name" className="bg-background" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button type="submit" size="icon" disabled={createGroupMutation.isPending}>
                              {createGroupMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <PlusCircle className="h-4 w-4" />
                              )}
                            </Button>
                          </form>
                        </Form>

                        {project.groups.map((group) => (
                          <div key={group.id} className="mb-6 last:mb-0">
                            <h3 className="font-medium text-sm text-muted-foreground mb-2">
                              {group.name}
                            </h3>

                            <Form {...taskForm}>
                              <form
                                onSubmit={taskForm.handleSubmit((data) =>
                                  createTaskMutation.mutate({ groupId: group.id, data })
                                )}
                                className="flex gap-2 mb-2"
                              >
                                <FormField
                                  control={taskForm.control}
                                  name="title"
                                  render={({ field }) => (
                                    <FormItem className="flex-1">
                                      <FormControl>
                                        <Input placeholder="New task title" className="bg-background" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <Button type="submit" size="icon" disabled={createTaskMutation.isPending}>
                                  {createTaskMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <PlusCircle className="h-4 w-4" />
                                  )}
                                </Button>
                              </form>
                            </Form>

                            {group.tasks.map((task) => (
                              <div key={task.id} className="pl-4 mb-2">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={task.completed}
                                    onCheckedChange={(checked) =>
                                      toggleTaskMutation.mutate({
                                        taskId: task.id,
                                        completed: checked as boolean,
                                      })
                                    }
                                  />
                                  <span className={task.completed ? "line-through text-muted-foreground" : ""}>
                                    {task.title}
                                  </span>
                                </div>

                                <div className="pl-4 mt-2">
                                  <Form {...subtaskForm}>
                                    <form
                                      onSubmit={subtaskForm.handleSubmit((data) =>
                                        createSubtaskMutation.mutate({ taskId: task.id, data })
                                      )}
                                      className="flex gap-2 mb-2"
                                    >
                                      <FormField
                                        control={subtaskForm.control}
                                        name="title"
                                        render={({ field }) => (
                                          <FormItem className="flex-1">
                                            <FormControl>
                                              <Input placeholder="New subtask title" className="bg-background" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      <Button type="submit" size="icon" disabled={createSubtaskMutation.isPending}>
                                        {createSubtaskMutation.isPending ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <PlusCircle className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </form>
                                  </Form>

                                  {task.subtasks.map((subtask) => (
                                    <div key={subtask.id} className="flex items-center gap-2">
                                      <Checkbox
                                        checked={subtask.completed}
                                        onCheckedChange={(checked) =>
                                          toggleSubtaskMutation.mutate({
                                            subtaskId: subtask.id,
                                            completed: checked as boolean,
                                          })
                                        }
                                      />
                                      <span className={subtask.completed ? "line-through text-muted-foreground" : ""}>
                                        {subtask.title}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}