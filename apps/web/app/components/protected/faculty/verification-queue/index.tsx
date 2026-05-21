import { EmptyState } from "~/components/protected/faculty/verification-queue/empty-state";
import { useVerifications } from "~/components/protected/faculty/verification-queue/use-verifications";
import { VerificationTable } from "~/components/protected/faculty/verification-queue/verification-table";
import { VerificationToolbar } from "~/components/protected/faculty/verification-queue/verification-toolbar";
import { Spinner } from "~/components/ui/spinner";

export default function PendingVerifications() {
  const {
    filtered,
    loading,
    branches,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    branchFilter,
    setBranchFilter,
    selected,
    batchVerifying,
    allFilteredSelected,
    handleSingleApprove,
    handleBatchVerify,
    toggleOne,
    toggleAll,
  } = useVerifications();

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <VerificationToolbar
        search={search}
        onSearchChange={setSearch}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        branchFilter={branchFilter}
        onBranchChange={setBranchFilter}
        branches={branches}
        selectedCount={selected.size}
        batchVerifying={batchVerifying}
        onBatchVerify={handleBatchVerify}
      />
      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <VerificationTable
          items={filtered}
          selected={selected}
          allFilteredSelected={allFilteredSelected}
          onToggleOne={toggleOne}
          onToggleAll={toggleAll}
          onApprove={handleSingleApprove}
        />
      )}
    </div>
  );
}
