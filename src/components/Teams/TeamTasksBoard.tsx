import React, { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  Edit2,
  Plus,
  Search,
  Trash2,
  X,
  CheckCircle,
  Loader2,
  AlertCircle,
  UserMinus,
  CheckCircle2,
  Shield,
  GripVertical
} from "lucide-react";
import { TeamMember, TeamTask } from "../../types/social";
import {
  listTeamTasks,
  createTeamTask,
  updateTeamTask,
  deleteTeamTask
} from "../../lib/api/teamsApi";

interface Props {
  teamId: string;
  currentUserId: string;
  members: TeamMember[];
  isDarkMode: boolean;
  canManage: boolean; // owner or admin
}

export default function TeamTasksBoard({
  teamId,
  currentUserId,
  members,
  isDarkMode,
  canManage
}: Props) {
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");

  // Drag states
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<Record<string, boolean>>({
    todo: false,
    in_progress: false,
    done: false
  });

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<TeamTask | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<"todo" | "in_progress" | "done">("todo");
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Load tasks
  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listTeamTasks(teamId);
      setTasks(data);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  // Handle Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError("Task title is required.");
      return;
    }
    if (title.length > 150) {
      setFormError("Title must be under 150 characters.");
      return;
    }

    setBusy(true);
    setFormError(null);
    try {
      const finalAssignee = canManage ? (assignedTo || null) : null;

      const { task, error: apiErr } = await createTeamTask({
        team_id: teamId,
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        assigned_to: finalAssignee,
        created_by: currentUserId,
        due_date: dueDate || null
      });

      if (apiErr) {
        setFormError(apiErr);
      } else {
        setTitle("");
        setDescription("");
        setAssignedTo("");
        setDueDate("");
        setStatus("todo");
        setShowAddModal(false);
        await loadTasks();
      }
    } catch (err: any) {
      setFormError(err?.message ?? "An error occurred.");
    } finally {
      setBusy(false);
    }
  };

  // Handle Edit Task
  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;
    if (!title.trim()) {
      setFormError("Task title is required.");
      return;
    }

    setBusy(true);
    setFormError(null);
    try {
      const finalAssignee = canManage ? (assignedTo || null) : showEditModal.assigned_to;

      const { error: apiErr } = await updateTeamTask(showEditModal.id, {
        title: title.trim(),
        description: description.trim() || null,
        status,
        assigned_to: finalAssignee,
        due_date: dueDate || null
      });

      if (apiErr) {
        setFormError(apiErr);
      } else {
        setShowEditModal(null);
        await loadTasks();
      }
    } catch (err: any) {
      setFormError(err?.message ?? "An error occurred.");
    } finally {
      setBusy(false);
    }
  };

  // Update task status from Drop action
  const handleUpdateStatus = async (taskId: string, newStatus: "todo" | "in_progress" | "done") => {
    // Reset drag tracking state immediately to prevent visual placeholders from getting stuck
    setDraggingTaskId(null);

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    if (task.status === newStatus) return;

    // Optimistically update local state for drag smoothness
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      const { error: apiErr } = await updateTeamTask(taskId, { status: newStatus });
      if (apiErr) {
        alert("Failed to move task: " + apiErr);
        await loadTasks();
      }
    } catch (err: any) {
      alert("Error moving task: " + err.message);
      await loadTasks();
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const { error: apiErr } = await deleteTeamTask(taskId);
      if (apiErr) {
        alert("Failed to delete task: " + apiErr);
      } else {
        setTasks(prev => prev.filter(t => t.id !== taskId));
      }
    } catch (err: any) {
      alert("Error deleting task: " + err.message);
    }
  };

  // Open edit modal and populate state
  const openEdit = (task: TeamTask) => {
    setTitle(task.title);
    setDescription(task.description ?? "");
    setAssignedTo(task.assigned_to ?? "");
    setDueDate(task.due_date ? new Date(task.due_date).toISOString().split("T")[0] : "");
    setStatus(task.status);
    setFormError(null);
    setShowEditModal(task);
  };

  // Open create modal and reset state
  const openCreate = (initialStatus: "todo" | "in_progress" | "done" = "todo") => {
    setTitle("");
    setDescription("");
    setAssignedTo("");
    setDueDate("");
    setStatus(initialStatus);
    setFormError(null);
    setShowAddModal(true);
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description?.toLowerCase() || "").includes(searchQuery.toLowerCase());

    const matchesAssignee =
      assigneeFilter === "all" ||
      (assigneeFilter === "unassigned" && !task.assigned_to) ||
      task.assigned_to === assigneeFilter;

    return matchesSearch && matchesAssignee;
  });

  const todoTasks = filteredTasks.filter(t => t.status === "todo");
  const inProgressTasks = filteredTasks.filter(t => t.status === "in_progress");
  const doneTasks = filteredTasks.filter(t => t.status === "done");

  // Tailwind styling constants based on Dark Mode
  const bgCard = isDarkMode ? "bg-slate-900 border-slate-700/50" : "bg-white border-slate-200";
  const textTitle = isDarkMode ? "text-white" : "text-slate-900";
  const textSub = isDarkMode ? "text-slate-400" : "text-slate-500";
  const inputClass = `w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-all duration-200 ${
    isDarkMode
      ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
  }`;
  const labelClass = `block text-xs font-bold mb-1.5 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`;

  return (
    <div className="space-y-6">
      {/* Search and Filter Panel */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm backdrop-blur-md ${bgCard}`}>
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-3 w-full">
          {/* Search bar */}
          <div className="relative w-full sm:max-w-xs">
            <Search className={`absolute left-3.5 top-3 w-4 h-4 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`} />
            <input
              type="text"
              placeholder="Search by title or details..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`${inputClass} pl-10`}
            />
          </div>

          {/* Assignee Filter */}
          <div className="w-full sm:max-w-xs">
            <select
              value={assigneeFilter}
              onChange={e => setAssigneeFilter(e.target.value)}
              className={`${inputClass}`}
            >
              <option value="all">All Assignees</option>
              <option value="unassigned">Unassigned Tasks</option>
              {members.map(m => (
                <option key={m.user_id} value={m.user_id}>
                  {m.profile?.name || "Member"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Add Task Button */}
        <button
          onClick={() => openCreate("todo")}
          className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadTasks} className="underline text-xs hover:text-red-300">Retry</button>
        </div>
      )}

      {/* Kanban Board Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
          <p className={`text-sm ${textSub}`}>Loading task board...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* TO DO COLUMN */}
          <TaskColumn
            title="To Do"
            status="todo"
            count={todoTasks.length}
            tasks={todoTasks}
            isDarkMode={isDarkMode}
            bgCard={bgCard}
            textTitle={textTitle}
            textSub={textSub}
            currentUserId={currentUserId}
            canManage={canManage}
            onEdit={openEdit}
            onDelete={handleDeleteTask}
            onAdd={() => openCreate("todo")}
            onUpdateStatus={handleUpdateStatus}
            dragOver={dragOverColumn.todo}
            setDragOver={active => setDragOverColumn(prev => ({ ...prev, todo: active }))}
            headerBg={isDarkMode ? "bg-slate-800/60" : "bg-slate-200/50"}
            dotAccent="bg-slate-400"
            borderAccent="border-t-slate-400"
            draggingTaskId={draggingTaskId}
            setDraggingTaskId={setDraggingTaskId}
          />

          {/* IN PROGRESS COLUMN */}
          <TaskColumn
            title="In Progress"
            status="in_progress"
            count={inProgressTasks.length}
            tasks={inProgressTasks}
            isDarkMode={isDarkMode}
            bgCard={bgCard}
            textTitle={textTitle}
            textSub={textSub}
            currentUserId={currentUserId}
            canManage={canManage}
            onEdit={openEdit}
            onDelete={handleDeleteTask}
            onAdd={() => openCreate("in_progress")}
            onUpdateStatus={handleUpdateStatus}
            dragOver={dragOverColumn.in_progress}
            setDragOver={active => setDragOverColumn(prev => ({ ...prev, in_progress: active }))}
            headerBg={isDarkMode ? "bg-indigo-950/20" : "bg-indigo-50/70"}
            dotAccent="bg-indigo-500 animate-pulse"
            borderAccent="border-t-indigo-500"
            draggingTaskId={draggingTaskId}
            setDraggingTaskId={setDraggingTaskId}
          />

          {/* DONE COLUMN */}
          <TaskColumn
            title="Done"
            status="done"
            count={doneTasks.length}
            tasks={doneTasks}
            isDarkMode={isDarkMode}
            bgCard={bgCard}
            textTitle={textTitle}
            textSub={textSub}
            currentUserId={currentUserId}
            canManage={canManage}
            onEdit={openEdit}
            onDelete={handleDeleteTask}
            onAdd={() => openCreate("done")}
            onUpdateStatus={handleUpdateStatus}
            dragOver={dragOverColumn.done}
            setDragOver={active => setDragOverColumn(prev => ({ ...prev, done: active }))}
            headerBg={isDarkMode ? "bg-emerald-950/20" : "bg-emerald-50/70"}
            dotAccent="bg-emerald-500"
            borderAccent="border-t-emerald-500"
            draggingTaskId={draggingTaskId}
            setDraggingTaskId={setDraggingTaskId}
          />
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border transition-all duration-300 ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}>
            <div className={`px-5 py-4 border-b flex items-center justify-between ${isDarkMode ? "border-slate-800 bg-slate-900/60" : "border-slate-100 bg-slate-50"}`}>
              <h3 className={`font-bold text-lg ${textTitle}`}>Create Task</h3>
              <button onClick={() => setShowAddModal(false)} className={isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-700"}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 text-xs rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}

              <div>
                <label className={labelClass}>Title *</label>
                <input
                  type="text"
                  placeholder="Task title..."
                  maxLength={150}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  placeholder="Describe details, references, or instructions..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className={`${inputClass} min-h-[90px] resize-y`}
                  maxLength={1000}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Column Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className={inputClass}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-300">Assignee</label>
                  {!canManage && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-500">
                      <Shield className="w-2.5 h-2.5" /> Read-Only for Members
                    </span>
                  )}
                </div>
                <select
                  value={assignedTo}
                  onChange={e => setAssignedTo(e.target.value)}
                  className={inputClass}
                  disabled={!canManage}
                >
                  <option value="">Unassigned</option>
                  {members.map(m => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.profile?.name || "Member"}
                    </option>
                  ))}
                </select>
                {!canManage && (
                  <p className="text-[10px] text-amber-500/90 mt-1 flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" /> Only owners and admins can assign tasks.
                  </p>
                )}
              </div>

              <div className={`pt-4 border-t flex justify-end gap-2 ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium ${isDarkMode ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-60 flex items-center gap-1.5 shadow-md"
                >
                  {busy && <Loader2 className="w-4 h-4 animate-spin" />} Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TASK MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border transition-all duration-300 ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}>
            <div className={`px-5 py-4 border-b flex items-center justify-between ${isDarkMode ? "border-slate-800 bg-slate-900/60" : "border-slate-100 bg-slate-50"}`}>
              <h3 className={`font-bold text-lg ${textTitle}`}>Edit Task</h3>
              <button onClick={() => setShowEditModal(null)} className={isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-700"}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditTask} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 text-xs rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}

              <div>
                <label className={labelClass}>Title *</label>
                <input
                  type="text"
                  maxLength={150}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className={`${inputClass} min-h-[90px] resize-y`}
                  maxLength={1000}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Column Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className={inputClass}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-300">Assignee</label>
                  {!canManage && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-500">
                      <Shield className="w-2.5 h-2.5" /> Read-Only for Members
                    </span>
                  )}
                </div>
                <select
                  value={assignedTo}
                  onChange={e => setAssignedTo(e.target.value)}
                  className={inputClass}
                  disabled={!canManage}
                >
                  <option value="">Unassigned</option>
                  {members.map(m => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.profile?.name || "Member"}
                    </option>
                  ))}
                </select>
                {!canManage && (
                  <p className="text-[10px] text-amber-500/90 mt-1 flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" /> Only owners and admins can assign tasks.
                  </p>
                )}
              </div>

              <div className={`pt-4 border-t flex justify-between items-center ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
                {/* Delete button */}
                {(showEditModal.created_by === currentUserId || canManage) ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(null);
                      handleDeleteTask(showEditModal.id);
                    }}
                    className="px-3.5 py-2 rounded-xl text-red-500 bg-red-500/10 hover:bg-red-500/20 text-xs font-bold flex items-center gap-1 transition-colors duration-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(null)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium ${isDarkMode ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-60 flex items-center gap-1.5 shadow-md"
                  >
                    {busy && <Loader2 className="w-4 h-4 animate-spin" />} Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── TASK COLUMN COMPONENT ────────────────────────────────────────────────────

interface ColumnProps {
  title: string;
  status: "todo" | "in_progress" | "done";
  count: number;
  tasks: TeamTask[];
  isDarkMode: boolean;
  bgCard: string;
  textTitle: string;
  textSub: string;
  currentUserId: string;
  canManage: boolean;
  onEdit: (task: TeamTask) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onUpdateStatus: (taskId: string, newStatus: "todo" | "in_progress" | "done") => void;
  dragOver: boolean;
  setDragOver: (active: boolean) => void;
  headerBg: string;
  dotAccent: string;
  borderAccent: string;
  draggingTaskId: string | null;
  setDraggingTaskId: (id: string | null) => void;
}

function TaskColumn({
  title,
  status,
  count,
  tasks,
  isDarkMode,
  bgCard,
  textTitle,
  textSub,
  currentUserId,
  canManage,
  onEdit,
  onDelete,
  onAdd,
  onUpdateStatus,
  dragOver,
  setDragOver,
  headerBg,
  dotAccent,
  borderAccent,
  draggingTaskId,
  setDraggingTaskId
}: ColumnProps) {
  
  // Drag and Drop Event Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Required to drop!
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) {
      onUpdateStatus(taskId, status);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-2xl border-t-4 flex flex-col min-h-[520px] max-h-[750px] overflow-hidden transition-all duration-300 shadow-md ${
        isDarkMode ? "bg-slate-900/60" : "bg-slate-100"
      } ${borderAccent} ${
        dragOver
          ? "border-2 border-dashed border-blue-500/80 bg-blue-500/5 dark:bg-blue-500/10 scale-[1.01]"
          : "border border-slate-200 dark:border-slate-800/40"
      }`}
    >
      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between border-b ${headerBg} ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${dotAccent}`} />
          <span className={`font-bold text-sm tracking-wide ${textTitle}`}>{title}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold ${isDarkMode ? "bg-slate-800 text-slate-300" : "bg-white text-slate-600 shadow-sm border border-slate-200"}`}>
            {count}
          </span>
        </div>
        <button
          onClick={onAdd}
          className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-slate-200 text-slate-600 hover:text-slate-800"}`}
          title={`Add task to ${title}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Cards list */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${isDarkMode ? "bg-slate-800/40" : "bg-white shadow-sm border border-slate-200"}`}>
              <CheckCircle2 className={`w-5 h-5 ${isDarkMode ? "text-slate-600" : "text-slate-300"}`} />
            </div>
            <p className={`text-xs font-semibold ${textSub}`}>Empty Column</p>
            <button
              onClick={onAdd}
              className="mt-1 text-[11px] text-blue-500 font-bold hover:underline"
            >
              Add task
            </button>
          </div>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              isDarkMode={isDarkMode}
              textTitle={textTitle}
              textSub={textSub}
              currentUserId={currentUserId}
              canManage={canManage}
              onEdit={onEdit}
              onDelete={onDelete}
              draggingTaskId={draggingTaskId}
              setDraggingTaskId={setDraggingTaskId}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── TASK CARD COMPONENT ──────────────────────────────────────────────────────

function TaskCard({
  task,
  isDarkMode,
  textTitle,
  textSub,
  currentUserId,
  canManage,
  onEdit,
  onDelete,
  draggingTaskId,
  setDraggingTaskId
}: {
  task: TeamTask;
  isDarkMode: boolean;
  textTitle: string;
  textSub: string;
  currentUserId: string;
  canManage: boolean;
  onEdit: (task: TeamTask) => void;
  onDelete: (id: string) => void;
  draggingTaskId: string | null;
  setDraggingTaskId: (id: string | null) => void;
}) {
  const isCreator = task.created_by === currentUserId;
  const isDone = task.status === "done";
  
  const isDragging = draggingTaskId === task.id;

  // Drag start handler
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", task.id);
    e.dataTransfer.effectAllowed = "move";
    setDraggingTaskId(task.id);
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
  };

  // Due Date Badge Builder
  const getDueDateBadge = () => {
    if (!task.due_date) return null;
    const due = new Date(task.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24));
    const dateFormatted = due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    
    if (isDone) {
      return (
        <span className="inline-flex items-center gap-1 text-[9.5px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/10">
          <CheckCircle className="w-2.5 h-2.5" /> Due {dateFormatted}
        </span>
      );
    } else if (diffDays < 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[9.5px] px-2 py-0.5 rounded bg-red-500/10 text-red-500 font-bold animate-pulse border border-red-500/15">
          <AlertCircle className="w-2.5 h-2.5" /> Overdue
        </span>
      );
    } else if (diffDays === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[9.5px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/10">
          <Clock className="w-2.5 h-2.5" /> Today
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 text-[9.5px] px-2 py-0.5 rounded bg-slate-500/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
          <Calendar className="w-2.5 h-2.5" /> {dateFormatted}
        </span>
      );
    }
  };

  // Dragging State Placeholder
  if (isDragging) {
    return (
      <div
        onDragEnd={handleDragEnd}
        className={`p-4 rounded-xl border-2 border-dashed h-[135px] flex items-center justify-center transition-all duration-200 select-none ${
          isDarkMode
            ? "border-slate-700 bg-slate-800/10 text-slate-600"
            : "border-slate-350 bg-slate-100/40 text-slate-400"
        }`}
      >
        <span className="text-xs font-semibold">Moving task...</span>
      </div>
    );
  }

  // Left Border Accent Indicator
  const leftBorderColor = 
    task.status === "todo" ? "border-l-slate-400" :
    task.status === "in_progress" ? "border-l-indigo-500" : "border-l-emerald-500";

  return (
    <div
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`group p-4 rounded-xl border-l-4 border transition-all duration-200 relative flex flex-col justify-between cursor-grab hover:cursor-grab active:cursor-grabbing hover:-translate-y-0.5 ${leftBorderColor} ${
        isDarkMode
          ? "bg-slate-900 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700 hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
          : "bg-white border-slate-200 hover:border-slate-350 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-start gap-1.5 min-w-0">
            {/* Draggable Grip Handle Icon — styled high contrast for visibility */}
            <GripVertical className="w-4 h-4 mt-0.5 text-slate-450 dark:text-slate-500 cursor-grab active:cursor-grabbing flex-shrink-0 hover:text-slate-600 dark:hover:text-slate-400" />
            <h4 className={`text-sm font-bold leading-snug tracking-tight ${textTitle} ${isDone ? "line-through opacity-50 text-slate-400" : ""}`}>
              {task.title}
            </h4>
          </div>
          {/* Action buttons (shown on hover) */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0">
            <button
              onClick={() => onEdit(task)}
              className={`p-1 rounded-md transition-colors ${isDarkMode ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-slate-100 text-slate-500 hover:text-slate-800"}`}
              title="Edit task"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            {(isCreator || canManage) && (
              <button
                onClick={() => onDelete(task.id)}
                className="p-1 rounded-md hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
                title="Delete task"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {task.description && (
          <p className={`text-xs mt-2 pl-5.5 leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-600"} ${isDone ? "opacity-50" : ""}`}>
            {task.description}
          </p>
        )}
      </div>

      {/* Assignment and Creator Badges */}
      <div className="mt-4 pt-3.5 pl-5.5 border-t border-slate-100 dark:border-slate-850 space-y-2">
        <div className="flex flex-col gap-2">
          {/* To (Assignee) badge */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[9px] uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500 w-8">To:</span>
            {task.assigned_profile ? (
              <div className={`flex items-center gap-1.5 min-w-0 px-2 py-0.5 rounded-md border ${
                isDarkMode 
                  ? "bg-blue-950/40 border-blue-800/30 text-blue-300" 
                  : "bg-blue-50 border-blue-100 text-blue-700 font-bold"
              }`}>
                <div className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0 bg-blue-500 flex items-center justify-center text-[8px] font-bold text-white">
                  {task.assigned_profile.avatar_url || task.assigned_profile.profile_pic ? (
                    <img src={task.assigned_profile.avatar_url || task.assigned_profile.profile_pic!} alt="" className="w-full h-full object-cover" />
                  ) : (
                    task.assigned_profile.name.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="text-xs font-semibold truncate">
                  {task.assigned_profile.name}
                </span>
              </div>
            ) : (
              <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">Unassigned</span>
            )}
          </div>

          {/* By (Creator) badge */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[9px] uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500 w-8">By:</span>
            {task.creator_profile ? (
              <div className={`flex items-center gap-1.5 min-w-0 px-2 py-0.5 rounded-md border ${
                isDarkMode 
                  ? "bg-slate-800/40 border-slate-750/30 text-slate-350" 
                  : "bg-slate-100 border-slate-200 text-slate-700 font-bold"
              }`}>
                <div className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0 bg-slate-400 flex items-center justify-center text-[8px] font-bold text-white">
                  {task.creator_profile.avatar_url || task.creator_profile.profile_pic ? (
                    <img src={task.creator_profile.avatar_url || task.creator_profile.profile_pic!} alt="" className="w-full h-full object-cover" />
                  ) : (
                    task.creator_profile.name.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="text-xs font-semibold truncate">
                  {task.creator_profile.name}
                </span>
              </div>
            ) : (
              <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">Unknown</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          {getDueDateBadge()}
          <span className="inline-flex items-center gap-0.5 text-[8.5px] px-1 rounded bg-slate-500/10 text-slate-400 dark:text-slate-500/80 font-mono">
            {task.id.slice(0, 4)}
          </span>
        </div>
      </div>
    </div>
  );
}
