'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { addProject } from '@/store/slices/projects-slice';
import { serializeProject } from '@/store/types';
import Button from '@/components/ui/Button';
import CreateProjectForm from './CreateProjectForm';
import type { Project } from '@/types/index';

type ProjectWithCount = Project & { _count: { tasks: number } };

interface Props {
  projects: ProjectWithCount[];
}

export default function ProjectList({ projects }: Props) {
  const [showForm, setShowForm] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();

  function handleCreated(project: Project) {
    dispatch(addProject(serializeProject(project)));
    router.refresh();
    setShowForm(false);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-body">
          {projects.length} {projects.length === 1 ? 'project' : 'projects'}
        </p>
        <Button onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancel' : 'New Project'}
        </Button>
      </div>

      {showForm && (
        <div className="mb-6">
          <CreateProjectForm onCreated={handleCreated} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {projects.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface py-16 text-center">
          <p className="font-semibold text-body">No projects yet</p>
          <p className="mt-1 text-sm text-muted">Create your first project to get started</p>
          <Button className="mt-4" onClick={() => setShowForm(true)}>
            New Project
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map(project => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="group block rounded-lg border border-border bg-surface p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div
              className="mb-3 h-1 w-full rounded-full"
              style={{ backgroundColor: project.color }}
            />
            <h2 className="font-semibold text-heading group-hover:text-primary-text">
              {project.name}
            </h2>
            {project.description && (
              <p className="mt-1 line-clamp-2 text-sm text-body">{project.description}</p>
            )}
            <p className="mt-3 text-xs text-muted">
              {project._count.tasks} {project._count.tasks === 1 ? 'task' : 'tasks'}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
