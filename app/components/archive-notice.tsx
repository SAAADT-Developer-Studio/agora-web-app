import {
  ARCHIVE_LABEL,
  ARCHIVE_MESSAGE,
  NEWER_CLUSTER_LABEL,
  NEWER_LIVE_MESSAGE,
} from "~/lib/articleClusterLookup";

export function ArchiveNotice({ newerTo }: { newerTo?: string | null }) {
  return (
    <p className="border-primary/15 bg-primary/5 text-surface-text/80 mb-6 flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-md border px-3 py-2 text-sm leading-relaxed">
      <span className="text-primary text-xs font-semibold tracking-wider uppercase">
        {ARCHIVE_LABEL}
      </span>
      <span>
        {ARCHIVE_MESSAGE}
        {newerTo ? (
          <>
            {" "}
            <a
              href={newerTo}
              className="text-primary font-medium underline decoration-current/30 underline-offset-2"
            >
              {NEWER_CLUSTER_LABEL}
            </a>
          </>
        ) : null}
      </span>
    </p>
  );
}

export function NewerCopyNotice({ newerTo }: { newerTo: string }) {
  return (
    <p className="border-primary/15 bg-primary/5 text-surface-text/80 mb-6 rounded-md border px-3 py-2 text-sm leading-relaxed">
      <a
        href={newerTo}
        className="text-primary font-medium underline decoration-current/30 underline-offset-2"
      >
        {NEWER_LIVE_MESSAGE}
      </a>
    </p>
  );
}
