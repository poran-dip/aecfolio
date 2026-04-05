export default function PendingApprovalScreen() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-semibold text-slate-800">
          account pending approval
        </h1>

        <p className="text-slate-600">
          your account has been created successfully, but it needs to be approved
          by a faculty member before you can access the dashboard.
        </p>

        <p className="text-sm text-slate-500">
          this usually doesn’t take long. you can check back later or contact a
          faculty member if it’s urgent.
        </p>

        {/* optional: logout button */}
        <button
          onClick={() => (window.location.href = "/api/auth/signout")}
          className="mt-4 rounded-xl border px-4 py-2 text-sm hover:bg-slate-100"
        >
          sign out
        </button>
      </div>
    </div>
  );
}
