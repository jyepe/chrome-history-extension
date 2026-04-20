import type { TransitionBucket, TransitionCounts } from "./types";

export function bucketTransition(t: string): TransitionBucket {
  switch (t) {
    case "typed":
    case "keyword":
    case "keyword_generated":
      return "typed";
    case "reload":
      return "reload";
    case "form_submit":
      return "form";
    default:
      return "link";
  }
}

export function countTransitions(
  transitions: readonly string[],
): TransitionCounts {
  const counts: TransitionCounts = {
    typed: 0,
    link: 0,
    reload: 0,
    form: 0,
    total: 0,
  };
  for (const t of transitions) {
    counts[bucketTransition(t)] += 1;
    counts.total += 1;
  }
  return counts;
}
