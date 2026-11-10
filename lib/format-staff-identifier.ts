export function formatStaffIdentifier(fullName: string | null | undefined) {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "GXC-Staff";
  if (parts.length === 1) return `GXC-${parts[0]}`;
  const lastNameInitial = Array.from(parts[parts.length - 1])[0]?.toUpperCase() ?? "";
  return `GXC-${parts[0]} ${lastNameInitial}.`;
}
