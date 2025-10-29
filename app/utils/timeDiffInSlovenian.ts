export function timeDiffInSlovenian(pastDate: Date) {
  const now = new Date();
  const diffMs = now.getTime() - pastDate.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) {
    if (diffSeconds === 1) return "pred 1 sekundo";
    if (diffSeconds === 2) return "pred 2 sekundama";
    if (diffSeconds === 3 || diffSeconds === 4)
      return `pred ${diffSeconds} sekundami`;
    return `pred ${diffSeconds} sekundami`;
  }

  if (diffHours < 1) {
    if (diffMinutes === 1) return "pred 1 minuto";
    if (diffMinutes === 2) return "pred 2 minutama";
    if (diffMinutes === 3 || diffMinutes === 4)
      return `pred ${diffMinutes} minutami`;
    return `pred ${diffMinutes} minutami`;
  }

  if (diffDays < 1) {
    if (diffHours === 1) return "pred 1 uro";
    if (diffHours === 2) return "pred 2 urama";
    if (diffHours === 3 || diffHours === 4) return `pred ${diffHours} urami`;
    return `pred ${diffHours} urami`;
  }

  if (diffDays === 1) return "pred 1 dnem";
  if (diffDays === 2) return "pred 2 dnevoma";
  if (diffDays === 3 || diffDays === 4) return `pred ${diffDays} dnevi`;
  return `pred ${diffDays} dnevi`;
}
