"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Search, UserCheck } from "lucide-react";

interface PendingUser {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
}

type AccountType = "STUDENT" | "FACULTY";

interface StudentForm {
  rollNo: string;
  course: string;
  branch: string;
  semester: string;
  cgpa: string;
  bio: string;
  skills: string; // comma-separated
}

interface FacultyForm {
  employeeId: string;
  designation: string;
  department: string;
}

const INITIAL_STUDENT: StudentForm = {
  rollNo: "",
  course: "",
  branch: "",
  semester: "",
  cgpa: "",
  bio: "",
  skills: "",
};

const INITIAL_FACULTY: FacultyForm = {
  employeeId: "",
  designation: "",
  department: "",
};

export default function PendingApprovalsPage() {
  const [data, setData] = useState<PendingUser[]>([]);
  const [filtered, setFiltered] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal state
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [accountType, setAccountType] = useState<AccountType>("STUDENT");
  const [studentForm, setStudentForm] = useState<StudentForm>(INITIAL_STUDENT);
  const [facultyForm, setFacultyForm] = useState<FacultyForm>(INITIAL_FACULTY);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/user?pending=true")
      .then((r) => r.json())
      .then((d) => {
        const users = Array.isArray(d) ? d : [];
        setData(users);
        setFiltered(users);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const s = search.toLowerCase();
    setFiltered(
      data.filter(
        (u) =>
          (u.name || "").toLowerCase().includes(s) ||
          u.email.toLowerCase().includes(s),
      ),
    );
  }, [search, data]);

  const openModal = (user: PendingUser) => {
    setSelectedUser(user);
    setAccountType("STUDENT");
    setStudentForm(INITIAL_STUDENT);
    setFacultyForm(INITIAL_FACULTY);
    setFormError(null);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setFormError(null);
  };

  const handleSubmit = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    setFormError(null);

    try {
      let body: Record<string, unknown>;
      let endpoint: string;

      if (accountType === "STUDENT") {
        endpoint = "/api/student";
        body = {
          userId: selectedUser.id,
          rollNo: studentForm.rollNo,
          course: studentForm.course,
          branch: studentForm.branch,
          semester: parseInt(studentForm.semester),
          cgpa: studentForm.cgpa ? parseFloat(studentForm.cgpa) : null,
          bio: studentForm.bio || null,
          skills: studentForm.skills
            ? studentForm.skills
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
        };
      } else {
        endpoint = "/api/faculty";
        body = {
          userId: selectedUser.id,
          employeeId: facultyForm.employeeId,
          designation: facultyForm.designation,
          department: facultyForm.department,
        };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        setFormError(err.error || "Something went wrong.");
        return;
      }

      setData((prev) => prev.filter((u) => u.id !== selectedUser.id));
      closeModal();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pending Approvals</h1>
        <p className="text-sm text-slate-500 mt-1">
          Assign roles to newly registered users
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Awaiting Assignment
            </CardTitle>
            <Clock size={18} className="text-yellow-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{data.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          size={16}
        />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-12 text-center text-slate-500"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-12 text-center text-slate-500"
                  >
                    No pending users.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-semibold text-slate-900">
                      {user.name || "—"}
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {user.email}
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs">
                      {new Date(user.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => openModal(user)}>
                        Assign Role
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Assign Role Modal */}
      <Dialog
        open={!!selectedUser}
        onOpenChange={(open) => !open && closeModal()}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Role</DialogTitle>
            <p className="text-sm text-slate-500">
              {selectedUser?.name || selectedUser?.email}
            </p>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Account Type Toggle */}
            <div className="space-y-1.5">
              <Label>Account Type</Label>
              <Select
                value={accountType}
                onValueChange={(v: AccountType) => setAccountType(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="FACULTY">Faculty</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {accountType === "STUDENT" ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Roll No *</Label>
                    <Input
                      value={studentForm.rollNo}
                      onChange={(e) =>
                        setStudentForm((p) => ({
                          ...p,
                          rollNo: e.target.value,
                        }))
                      }
                      placeholder="e.g. CSE23001"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Course *</Label>
                    <Select
                      value={studentForm.course}
                      onValueChange={(v: string) =>
                        setStudentForm((p) => ({ ...p, course: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BTECH">B.Tech</SelectItem>
                        <SelectItem value="MTECH">M.Tech</SelectItem>
                        <SelectItem value="MCA">MCA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Branch *</Label>
                    <Input
                      value={studentForm.branch}
                      onChange={(e) =>
                        setStudentForm((p) => ({
                          ...p,
                          branch: e.target.value,
                        }))
                      }
                      placeholder="e.g. CSE"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Semester *</Label>
                    <Input
                      type="number"
                      min={1}
                      max={12}
                      value={studentForm.semester}
                      onChange={(e) =>
                        setStudentForm((p) => ({
                          ...p,
                          semester: e.target.value,
                        }))
                      }
                      placeholder="e.g. 5"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>CGPA</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      max={10}
                      value={studentForm.cgpa}
                      onChange={(e) =>
                        setStudentForm((p) => ({ ...p, cgpa: e.target.value }))
                      }
                      placeholder="e.g. 8.5"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Skills</Label>
                    <Input
                      value={studentForm.skills}
                      onChange={(e) =>
                        setStudentForm((p) => ({
                          ...p,
                          skills: e.target.value,
                        }))
                      }
                      placeholder="React, Python, ..."
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Employee ID *</Label>
                    <Input
                      value={facultyForm.employeeId}
                      onChange={(e) =>
                        setFacultyForm((p) => ({
                          ...p,
                          employeeId: e.target.value,
                        }))
                      }
                      placeholder="e.g. FAC001"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Designation *</Label>
                    <Input
                      value={facultyForm.designation}
                      onChange={(e) =>
                        setFacultyForm((p) => ({
                          ...p,
                          designation: e.target.value,
                        }))
                      }
                      placeholder="e.g. Assistant Professor"
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>Department *</Label>
                    <Input
                      value={facultyForm.department}
                      onChange={(e) =>
                        setFacultyForm((p) => ({
                          ...p,
                          department: e.target.value,
                        }))
                      }
                      placeholder="e.g. Computer Science"
                    />
                  </div>
                </div>
              </>
            )}

            {formError && <p className="text-sm text-red-600">{formError}</p>}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeModal}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Saving..." : "Confirm & Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
