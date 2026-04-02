"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { PageLoader } from "@/components/ui/Spinner";
import {
  FolderGit2,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

interface Project {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  link: string | null;
}

const emptyProject = {
  title: "",
  description: "",
  techStack: [] as string[],
  link: "",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState(emptyProject);
  const [techInput, setTechInput] = useState("");

  useEffect(() => {
    fetch("/api/student/projects")
      .then((r) => r.json())
      .then((d) => setProjects(d.projects ?? []))
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyProject);
    setModalOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    setForm({
      title: p.title,
      description: p.description,
      techStack: [...p.techStack],
      link: p.link ?? "",
    });
    setModalOpen(true);
  };

  const addTech = () => {
    if (!techInput.trim() || form.techStack.includes(techInput.trim())) return;
    setForm((f) => ({ ...f, techStack: [...f.techStack, techInput.trim()] }));
    setTechInput("");
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Title and description are required");
      return;
    }
    setSaving(true);
    try {
      const url = editing
        ? `/api/student/projects/${editing.id}`
        : "/api/student/projects";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, link: form.link || null }),
      });
      if (res.ok) {
        const d = await res.json();
        if (editing) {
          setProjects((prev) =>
            prev.map((p) => (p.id === editing.id ? d.project : p)),
          );
          toast.success("Project updated!");
        } else {
          setProjects((prev) => [...prev, d.project]);
          toast.success("Project added!");
        }
        setModalOpen(false);
      }
    } catch {
      toast.error("Failed to save project");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await fetch(`/api/student/projects/${deleteId}`, { method: "DELETE" });
      setProjects((prev) => prev.filter((p) => p.id !== deleteId));
      toast.success("Project deleted");
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <Navbar
        title="Projects"
        subtitle="Showcase your technical work"
        actions={
          <Button onClick={openCreate} icon={<Plus size={14} />}>
            Add Project
          </Button>
        }
      />

      <div className="p-6 max-w-4xl mx-auto">
        {projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FolderGit2 size={28} className="text-slate-400" />
            </div>
            <h3 className="text-slate-700 font-semibold mb-2">
              No projects yet
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              Add your academic & personal projects to showcase your skills.
            </p>
            <Button onClick={openCreate} icon={<Plus size={14} />}>
              Add Your First Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow card-hover"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <p>GitHub</p>
                    </div>
                    <h3 className="font-semibold text-slate-900">{p.title}</h3>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {p.link && (
                      <a
                        href={p.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                    <button
                      onClick={() => openEdit(p)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteId(p.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-3">
                  {p.description}
                </p>

                {p.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {p.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Project" : "Add Project"}
        maxWidth="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              Save Project
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Project Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="e.g. Student Management System"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Description *
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
              placeholder="Describe what the project does, your role, and impact..."
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Tech Stack
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.techStack.map((tech) => (
                <span
                  key={tech}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full"
                >
                  {tech}
                  <button
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        techStack: f.techStack.filter((t) => t !== tech),
                      }))
                    }
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                placeholder="e.g. React"
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addTech())
                }
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 transition"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={addTech}
                icon={<Plus size={13} />}
              >
                Add
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              GitHub / Demo Link
            </label>
            <input
              type="url"
              value={form.link ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
              placeholder="https://github.com/username/repo"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition"
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleting}
      />
    </div>
  );
}
