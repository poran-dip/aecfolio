"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageLoader } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { Badge, VerificationBadge } from "@/components/ui/Badge";
import { ConfirmModal } from "@/components/ui/Modal";
import {
  ArrowLeft,
  CheckCircle,
  GraduationCap,
  Trophy,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface FullStudentProfile {
  id: string;
  name: string;
  rollNo: string;
  course: string;
  branch: string;
  semester: number;
  cgpa: number;
  results: {
    id: string;
    semester: number;
    sgpa: number;
    verified: boolean;
    verifiedAt: string;
  }[];
  achievements: {
    id: string;
    title: string;
    description: string;
    proofImage: string;
    verified: boolean;
  }[];
  certifications: {
    id: string;
    name: string;
    issuer: string;
    proofImage: string;
    verified: boolean;
  }[];
}

export default function FacultyStudentReviewPage({
  params,
}: {
  params: { studentId: string };
}) {
  const [data, setData] = useState<FullStudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Verification states
  const [verifyTarget, setVerifyTarget] = useState<{
    id: string;
    type: "result" | "achievement" | "cert";
  } | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Use unwrap to access dynamic params in App Router properly (React.use(params)) if needed, but since we are simple we will just use as is for now. Assuming params is resolvable.
  const studentId = params.studentId;

  const loadData = () => {
    fetch(`/api/faculty/students/${studentId}`)
      .then((r) => r.json())
      .then((d) => setData(d.student))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [studentId]);

  const handleVerify = async () => {
    if (!verifyTarget) return;
    setVerifying(true);

    let url = "";
    if (verifyTarget.type === "result")
      url = `/api/faculty/results/${verifyTarget.id}/verify`;
    else if (verifyTarget.type === "achievement")
      url = `/api/faculty/achievements/${verifyTarget.id}/verify`; // Future expansion
    else url = `/api/faculty/cert/${verifyTarget.id}/verify`; // Future expansion

    try {
      const res = await fetch(url, { method: "POST" });
      if (res.ok) {
        toast.success("Record verified and locked successfully!");
        loadData(); // Reload to reflect changes
      } else {
        toast.error("Failed to verify record.");
      }
    } catch {
      toast.error("Network error during verification.");
    } finally {
      setVerifying(false);
      setVerifyTarget(null);
    }
  };

  if (loading || !data) return <PageLoader />;

  return (
    <div>
      <Navbar
        title={`Reviewing: ${data.name}`}
        subtitle={`${data.rollNo} · ${data.course} ${data.branch} · Sem ${data.semester}`}
        actions={
          <Link href="/faculty">
            <Button variant="outline" size="sm" icon={<ArrowLeft size={16} />}>
              Back to Student List
            </Button>
          </Link>
        }
      />

      <div className="p-6 max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader
            title="Academic Results"
            icon={<GraduationCap size={18} />}
            description="Review and lock SGPA records"
          />
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-3">Semester</th>
                  <th className="px-6 py-3">Reported SGPA</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.results.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-slate-500"
                    >
                      No results reported yet.
                    </td>
                  </tr>
                ) : (
                  data.results.map((res) => (
                    <tr key={res.id}>
                      <td className="px-6 py-4 font-medium">
                        Semester {res.semester}
                      </td>
                      <td className="px-6 py-4 text-lg font-bold">
                        {res.sgpa.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <VerificationBadge verified={res.verified} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        {res.verified ? (
                          <span className="text-xs text-slate-400">
                            Locked on{" "}
                            {new Date(res.verifiedAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() =>
                              setVerifyTarget({ id: res.id, type: "result" })
                            }
                            icon={<CheckCircle size={14} />}
                          >
                            Verify & Lock
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Achievements & Certifications"
            icon={<Trophy size={18} />}
            description="Review student credentials"
          />
          <div className="space-y-4">
            {[...data.achievements, ...data.certifications].map((item: any) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50/50"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {item.title || item.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {item.description || item.issuer}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {item.proofImage ? (
                    <a
                      href={item.proofImage}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink size={14} /> View Proof
                    </a>
                  ) : (
                    <span className="text-sm text-slate-400">
                      No proof provided
                    </span>
                  )}

                  {/* For MVP we only implemented result verification API, achievement verification can be added similarly */}
                  {item.verified ? (
                    <Badge variant="success" icon>
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="warning" dot>
                      Pending
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            {data.achievements.length === 0 &&
              data.certifications.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">
                  No achievements logged.
                </p>
              )}
          </div>
        </Card>
      </div>

      <ConfirmModal
        open={!!verifyTarget}
        onClose={() => setVerifyTarget(null)}
        onConfirm={handleVerify}
        title="Confirm Verification"
        message="Are you sure you want to verify and lock this record? Once locked, the student will no longer be able to edit or delete it. Please ensure you have cross-checked the data."
        confirmLabel="Yes, Verify & Lock"
        confirmVariant="primary"
        loading={verifying}
      />
    </div>
  );
}
