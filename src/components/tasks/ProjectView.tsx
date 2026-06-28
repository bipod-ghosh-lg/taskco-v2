'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setTasks, setFilter, clearFilters, addTask, updateTaskItem, removeTask } from '@/store/slices/tasks-slice';
import { serializeTask } from '@/store/types';
import Button from '@/components/ui/Button';
import CreateTaskForm from './CreateTaskForm';
import type { Project, Task } from '@/types/index';

const STATUS_ORDER: Task['status'][] = ['TODO', 'IN_PROGRESS', 'DONE'];

const STATUS_LABELS: Record<Task['status'], string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

// Badge classes use Tailwind color scales directly — these are semantic
// badge pairs, not app-wide tokens, so they stay as raw Tailwind classes.
const STATUS_BADGE: Record<Task['status'], string> = {
  TODO: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  DONE: 'bg-green-100 text-green-800',
};

const PRIORITY_BADGE: Record<Task['priority'], string> = {
  HIGH: 'bg-red-100 text-red-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW: 'bg-green-100 text-green-800',
};

function formatDate(d: Date | string | null): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isPast(d: Date | string | null): boolean {
  if (!d) return false;
  return new Date(d) < new Date();
}

interface Props {
  project: Project;
  initialTasks: Task[];
}

export default function ProjectView({ project, initialTasks }: Props) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const filters = useAppSelector(state => state.tasks.filters);
  const [tasks, setLocalTasks] = useState<Task[]>(initialTasks);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    dispatch(setTasks(initialTasks.map(serializeTask)));
  }, [dispatch, initialTasks]);

  async function fetchTasks(status: string | null, priority: string | null) {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (priority) params.set('priority', priority);
    const res = await fetch(
      `/api/projects/${project.id}/tasks${params.toString() ? `?${params}` : ''}`,
      { credentials: 'include' },
    );
    if (res.ok) {
      const body = await res.json();
      setLocalTasks(body.data.tasks);
      dispatch(setTasks(body.data.tasks.map(serializeTask)));
    }
  }

  function handleStatusFilter(status: string | null) {
    const next = status === null ? null : filters.status === status ? null : status;
    dispatch(setFilter({ status: next }));
    fetchTasks(next, filters.priority);
  }

  function handlePriorityFilter(priority: string | null) {
    const next = priority === null ? null : filters.priority === priority ? null : priority;
    dispatch(setFilter({ priority: next }));
    fetchTasks(filters.status, next);
  }

  function handleClearFilters() {
    dispatch(clearFilters());
    fetchTasks(null, null);
  }

  async function handleStatusCycle(task: Task) {
    const nextIdx = (STATUS_ORDER.indexOf(task.status) + 1) % STATUS_ORDER.length;
    const nextStatus = STATUS_ORDER[nextIdx];
    const optimistic = { ...task, status: nextStatus };
    setLocalTasks(prev => prev.map(t => t.id === task.id ? optimistic : t));
    dispatch(updateTaskItem(serializeTask(optimistic)));

    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) {
      const body = await res.json();
      setLocalTasks(prev => prev.map(t => t.id === task.id ? body.data.task : t));
      dispatch(updateTaskItem(serializeTask(body.data.task)));
    } else {
      setLocalTasks(prev => prev.map(t => t.id === task.id ? task : t));
      dispatch(updateTaskItem(serializeTask(task)));
    }
  }

  async function handleDelete(taskId: string) {
    setLocalTasks(prev => prev.filter(t => t.id !== taskId));
    dispatch(removeTask(taskId));

    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      router.refresh();
    }
  }

  function handleTaskCreated(task: Task) {
    setLocalTasks(prev => [task, ...prev]);
    dispatch(addTask(serializeTask(task)));
    router.refresh();
    setShowForm(false);
  }

  const hasFilters = filters.status !== null || filters.priority !== null;

  const filterBtn = (active: boolean) =>
    active
      ? 'bg-primary text-white rounded-lg px-3 py-1.5 text-sm'
      : 'bg-surface border border-border text-subtle rounded-lg px-3 py-1.5 text-sm hover:bg-page';

  return (
    <div>
      {/* Project header */}
      <div className="mb-6 flex items-start gap-3">
        <div
          className="mt-1.5 h-4 w-4 shrink-0 rounded-full"
          style={{ backgroundColor: project.color }}
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold text-heading">{project.name}</h1>
          {project.description && (
            <p className="mt-1 text-body">{project.description}</p>
          )}
        </div>
        <Button onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancel' : 'New Task'}
        </Button>
      </div>

      {showForm && (
        <div className="mb-6">
          <CreateTaskForm
            projectId={project.id}
            onCreated={handleTaskCreated}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Filter bar */}
      <div className="mb-6 space-y-2">
        <div className="flex flex-wrap gap-2">
          <button className={filterBtn(filters.status === null)} onClick={() => handleStatusFilter(null)}>
            All Status
          </button>
          {STATUS_ORDER.map(s => (
            <button key={s} className={filterBtn(filters.status === s)} onClick={() => handleStatusFilter(s)}>
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={filterBtn(filters.priority === null)} onClick={() => handlePriorityFilter(null)}>
            All Priority
          </button>
          {(['LOW', 'MEDIUM', 'HIGH'] as Task['priority'][]).map(p => (
            <button key={p} className={filterBtn(filters.priority === p)} onClick={() => handlePriorityFilter(p)}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface py-16 text-center">
          {hasFilters ? (
            <>
              <p className="font-semibold text-body">No tasks match this filter</p>
              <button onClick={handleClearFilters} className="mt-3 text-sm text-primary-text hover:underline">
                Clear filters
              </button>
            </>
          ) : (
            <>
              <p className="font-semibold text-body">No tasks yet</p>
              <p className="mt-1 text-sm text-muted">Add your first task to get started</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => (
            <div
              key={task.id}
              className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-heading">{task.title}</p>
                {task.description && (
                  <p className="mt-0.5 line-clamp-1 text-sm text-body">{task.description}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE[task.priority]}`}>
                    {task.priority}
                  </span>
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[task.status]}`}>
                    {STATUS_LABELS[task.status]}
                  </span>
                  {task.dueDate && (
                    <span className={`text-xs ${isPast(task.dueDate) ? 'text-danger' : 'text-muted'}`}>
                      {formatDate(task.dueDate)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => handleStatusCycle(task)}
                  className="rounded border border-border px-2 py-1 text-xs text-body hover:bg-page"
                  title="Cycle status"
                >
                  {STATUS_LABELS[task.status]} →
                </button>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="rounded border border-red-200 px-2 py-1 text-xs text-danger hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
