export function Icon({
  href,
  className = "",
}: {
  href: string;
  className?: string;
}) {
  return (
    <svg className={className} aria-hidden="true" focusable="false">
      <use width="100%" height="100%" href={`${href}#icon`}></use>
    </svg>
  );
}
