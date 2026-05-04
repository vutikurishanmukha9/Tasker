const COLORS = ["#0f766e", "#1e40af", "#9333ea", "#b91c1c", "#c2410c", "#0891b2", "#4338ca", "#16a34a"];

export const colorFor = (seed: string) => COLORS[Math.abs([...seed].reduce((a, c) => a + c.charCodeAt(0), 0)) % COLORS.length];

export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
