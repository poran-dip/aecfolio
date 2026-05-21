import type { FacultyProfile } from "./use-faculty-profile";

const fieldClass =
  "w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 text-sm cursor-not-allowed";

export function ProfileFields({ data }: { data: FacultyProfile }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-slate-700 mb-1.5"
        >
          Full Name
        </label>
        <input
          id="name"
          type="text"
          value={data.name}
          disabled
          className={fieldClass}
        />
      </div>
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-slate-700 mb-1.5"
        >
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={data.email}
          disabled
          className={fieldClass}
        />
      </div>
      <div>
        <label
          htmlFor="department"
          className="block text-sm font-medium text-slate-700 mb-1.5"
        >
          Department
        </label>
        <input
          id="department"
          type="text"
          value={data.faculty.department}
          disabled
          className={fieldClass}
        />
      </div>
      <div>
        <label
          htmlFor="designation"
          className="block text-sm font-medium text-slate-700 mb-1.5"
        >
          Designation
        </label>
        <input
          id="designation"
          type="text"
          value={data.faculty.designation}
          disabled
          className={fieldClass}
        />
      </div>
    </div>
  );
}
