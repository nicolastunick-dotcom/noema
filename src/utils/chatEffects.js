export const UPDATE_GLOW_TONES = ["violet", "rose", "emerald", "sky"];

export function getUpdateGlowTone(sequence = 0) {
  const safeSequence = Math.abs(Number(sequence) || 0);
  return UPDATE_GLOW_TONES[safeSequence % UPDATE_GLOW_TONES.length];
}

export function isNearBottom(node, threshold = 88) {
  if (!node) return true;
  const distanceFromBottom = node.scrollHeight - node.scrollTop - node.clientHeight;
  return distanceFromBottom <= threshold;
}
