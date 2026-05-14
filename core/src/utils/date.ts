export function formatDate(date: Date | null | undefined): string {
  if (!date) return "Present";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "Present";
  return d
    .toLocaleDateString("en-GB", { month: "2-digit", year: "numeric" })
    .replace("/", "/");
}
