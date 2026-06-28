'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/Label';
import type { Task } from '@/types/index';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  dueDate: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  projectId: string;
  onCreated: (task: Task) => void;
  onCancel: () => void;
}

export default function CreateTaskForm({ projectId, onCreated, onCancel }: Props) {
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { status: 'TODO', priority: 'MEDIUM' },
  });

  async function onSubmit(data: FormValues) {
    setServerError('');
    const payload = {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
    };
    const res = await fetch(`/api/projects/${projectId}/tasks`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    if (!res.ok) {
      setServerError(body.error ?? 'Something went wrong');
      return;
    }
    onCreated(body.data.task);
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">
      <h3 className="mb-4 font-semibold text-heading">New Task</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="task-title">Title</Label>
          <Input
            id="task-title"
            placeholder="What needs to be done?"
            error={errors.title?.message}
            {...register('title')}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="task-description">Description</Label>
          <Input
            id="task-description"
            placeholder="Optional details..."
            error={errors.description?.message}
            {...register('description')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="task-status">Status</Label>
            <select
              id="task-status"
              className="block w-full rounded-lg border border-border-input px-3 py-2 text-sm text-heading shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              {...register('status')}
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-priority">Priority</Label>
            <select
              id="task-priority"
              className="block w-full rounded-lg border border-border-input px-3 py-2 text-sm text-heading shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              {...register('priority')}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="task-due-date">Due date</Label>
          <input
            id="task-due-date"
            type="date"
            className="block w-full rounded-lg border border-border-input px-3 py-2 text-sm text-heading shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            {...register('dueDate')}
          />
        </div>

        {serverError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{serverError}</p>
        )}

        <div className="flex gap-2 pt-1">
          <Button type="submit" loading={isSubmitting}>
            Create
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
