"use client";

import { Award, Check, FileBadge, FileText, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/dashboard/ui/Badge";
import { Card } from "@/components/dashboard/ui/Card";
import { Navbar } from "@/components/dashboard/ui/Navbar";
import { PageLoader } from "@/components/dashboard/ui/Spinner";

interface PendingItem {
  id: string;
  studentName: string;
  rollNo: string;
  type: "RESULT" | "ACHIEVEMENT" | "CERTIFICATE";
  title: string;
  dateSubmitted: string;
  details: string;
}

const mockPending: PendingItem[] = [
  {
    id: "1",
    studentName: "Alice Smith",
    rollNo: "CSE23001",
    type: "RESULT",
    title: "Semester 4 Marksheet",
    dateSubmitted: "2023-11-10",
    details: "CGPA: 8.9",
  },
  {
    id: "2",
    studentName: "Bob Jones",
    rollNo: "CSE23002",
    type: "ACHIEVEMENT",
    title: "Hackathon Winner",
    dateSubmitted: "2023-11-12",
    details: "First place in Smart India Hackathon 2023",
  },
  {
    id: "3",
    studentName: "Diana Prince",
    rollNo: "MCA24001",
    type: "CERTIFICATE",
    title: "AWS Cloud Practitioner",
    dateSubmitted: "2023-11-15",
    details: "Certification ID: AWS-12345",
  },
];

const getTypeIcon = (type: string) => {
  if (type === "RESULT")
    return <FileText size={18} className="text-blue-500" />;
  if (type === "ACHIEVEMENT")
    return <Award size={18} className="text-purple-500" />;
  if (type === "CERTIFICATE")
    return <FileBadge size={18} className="text-green-500" />;
};

export default function VerificationPage() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setItems(mockPending);
      setLoading(false);
    }, 400);
  }, []);

  const handleAction = (id: string, action: "approve" | "reject") => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast.success(`Item ${action}d successfully`);
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <Navbar
        title="Verification Queue"
        subtitle="Review and approve student submissions"
      />

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {items.length === 0 ? (
          <Card className="text-center py-12">
            <Check className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">
              All caught up!
            </h3>
            <p className="text-slate-500 mt-2">
              There are no pending items to verify.
            </p>
          </Card>
        ) : (
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-semibold">
                  <tr>
                    <th className="px-6 py-4">Item Details</th>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/50 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                            {getTypeIcon(item.type)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {item.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant={
                                  item.type === "RESULT"
                                    ? "default"
                                    : item.type === "ACHIEVEMENT"
                                      ? "default"
                                      : "success"
                                }
                              >
                                {item.type}
                              </Badge>
                              <span className="text-xs text-slate-500">
                                {item.details}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-700 block">
                          {item.studentName}
                        </span>
                        <span className="text-xs text-slate-500">
                          {item.rollNo}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-600">
                          {new Date(item.dateSubmitted).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAction(item.id, "approve")}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            title="Approve"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            onClick={() => handleAction(item.id, "reject")}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Reject"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
