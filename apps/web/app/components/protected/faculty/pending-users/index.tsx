import { PendingUsersTable } from "~/components/protected/faculty/pending-users/pending-users-table";
import { PendingUsersToolbar } from "~/components/protected/faculty/pending-users/pending-users-toolbar";
import { usePendingUsers } from "~/components/protected/faculty/pending-users/use-pending-users";
import { Spinner } from "~/components/ui/spinner";

export default function PendingUsers() {
  const {
    filtered,
    loading,
    search,
    setSearch,
    saving,
    selected,
    approving,
    allSelected,
    getField,
    handleEdit,
    handleBulkApprove,
    toggleOne,
    toggleAll,
  } = usePendingUsers();

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <PendingUsersToolbar
        search={search}
        onSearchChange={setSearch}
        selectedCount={selected.size}
        approving={approving}
        onApprove={handleBulkApprove}
      />
      <PendingUsersTable
        students={filtered}
        selected={selected}
        saving={saving}
        allSelected={allSelected}
        getField={getField}
        onEdit={handleEdit}
        onToggleOne={toggleOne}
        onToggleAll={toggleAll}
      />
    </div>
  );
}
