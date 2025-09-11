"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, BookOpen, CheckCircle2, Circle } from "lucide-react"

interface Subject {
  id: string
  name: string
  color: string
  created_at: string
}

interface Task {
  id: string
  subject_id: string
  name: string
  completed: boolean
  created_at: string
  subjects?: Subject
}

export default function TaskManager() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [newSubjectName, setNewSubjectName] = useState("")
  const [newTaskName, setNewTaskName] = useState("")
  const [selectedSubjectId, setSelectedSubjectId] = useState("")
  const [loading, setLoading] = useState(true)
  const [addSubjectModalOpen, setAddSubjectModalOpen] = useState(false)
  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch subjects
      const { data: subjectsData, error: subjectsError } = await supabase
        .from("subjects")
        .select("*")
        .order("created_at", { ascending: true })

      if (subjectsError) throw subjectsError

      // Fetch tasks with subject information
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select(`
          *,
          subjects (
            id,
            name,
            color
          )
        `)
        .order("created_at", { ascending: false })

      if (tasksError) throw tasksError

      setSubjects(subjectsData || [])
      setTasks(tasksData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const addSubject = async () => {
    if (!newSubjectName.trim()) return

    try {
      const colors = ["#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#f97316"]
      const randomColor = colors[Math.floor(Math.random() * colors.length)]

      const { data, error } = await supabase
        .from("subjects")
        .insert([{ name: newSubjectName.trim(), color: randomColor }])
        .select()
        .single()

      if (error) throw error

      setSubjects([...subjects, data])
      setAddSubjectModalOpen(false)
      setNewSubjectName("")
    } catch (error) {
      console.error("Error adding subject:", error)
    }
  }

  const addTask = async () => {
    if (!newTaskName.trim() || !selectedSubjectId) return

    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert([
          {
            name: newTaskName.trim(),
            subject_id: selectedSubjectId,
            completed: false,
          },
        ])
        .select(`
          *,
          subjects (
            id,
            name,
            color
          )
        `)
        .single()

      if (error) throw error

      setTasks([data, ...tasks])
      setNewTaskName("")
      setAddTaskModalOpen(false)
      setSelectedSubjectId("")
    } catch (error) {
      console.error("Error adding task:", error)
    }
  }

  const toggleTaskStatus = async (taskId: string, completed: boolean) => {
    try {
      const { error } = await supabase.from("tasks").update({ completed }).eq("id", taskId)

      if (error) throw error

      setTasks(tasks.map((task) => (task.id === taskId ? { ...task, completed } : task)))
    } catch (error) {
      console.error("Error updating task:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const completedTasks = tasks.filter((task) => task.completed).length
  const totalTasks = tasks.length



  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold text-foreground">Yad Rakhva Mate</h1>
          {totalTasks > 0 && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" />
              {completedTasks} of {totalTasks} tasks completed
            </div>
          )}
        </div>
        <div className="flex justify-center gap-4">
          <button className="border p-2 rounded-lg" onClick={() => setAddTaskModalOpen(true)}>Add Task</button>
          <button className="border p-2 rounded-lg" onClick={() => setAddSubjectModalOpen(true)}>Add Subject</button>
        </div>

        {/* Add Subject Section */}
        <dialog className="bg-black"  id="add-subject-modal" open={addSubjectModalOpen} onClose={() => setAddSubjectModalOpen(false)}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Add Subject
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mx-4">
                <Input
                  placeholder="Enter subject name..."
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addSubject()}
                  className="flex-1"
                />
                <Button onClick={addSubject} disabled={!newSubjectName.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subject
                </Button>
                <Button onClick={() => setAddSubjectModalOpen(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </dialog>

        {/* Subjects List */}
        {subjects.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {subjects.map((subject) => (
              <Badge
                key={subject.id}
                variant="secondary"
                className="px-3 py-1"
                style={{ backgroundColor: subject.color + "20", color: subject.color }}
              >
                {subject.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Add Task Section */}
        <dialog className="bg-black" id="add-task-modal" open={addTaskModalOpen} onClose={() => setAddTaskModalOpen(false)}>
          {subjects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add Task
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full p-2 border border-input bg-background rounded-md text-foreground"
                  >
                    <option value="">Select a subject...</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter task name..."
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addTask()}
                      className="flex-1"
                    />
                    <Button onClick={addTask} disabled={!newTaskName.trim() || !selectedSubjectId}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                    <Button onClick={() => setAddTaskModalOpen(false)}>Cancel</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </dialog>

        {/* Tasks List */}
        {tasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={(checked) => toggleTaskStatus(task.id, checked as boolean)}
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="text-xs px-2 py-0.5"
                          style={{
                            backgroundColor: task.subjects?.color + "20",
                            color: task.subjects?.color,
                          }}
                        >
                          {task.subjects?.name}
                        </Badge>
                      </div>
                      <p
                        className={`text-sm ${task.completed ? "line-through text-muted-foreground" : "text-foreground"
                          }`}
                      >
                        {task.name}
                      </p>
                    </div>
                    {task.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {subjects.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No subjects yet</h3>
              <p className="text-muted-foreground">Add your first subject to start organizing your academic tasks.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
