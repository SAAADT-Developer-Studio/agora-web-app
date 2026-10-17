import { ARCHIVE_LABEL, ARCHIVE_MESSAGE } from "~/lib/articleClusterLookup";

export function ArchiveNotice() {
  return (
    <p className="border-primary/15 bg-primary/5 text-surface-text/80 mb-6 flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-md border px-3 py-2 text-sm leading-relaxed">
      <span className="text-primary text-xs font-semibold tracking-wider uppercase">
        {ARCHIVE_LABEL}
      </span>
      <span>{ARCHIVE_MESSAGE}</span>
    </p>
  );
}
