export interface Accent {
  bg: string;
  text: string;
  ring: string;
  gradient: string;
}

const PALETTE: Accent[] = [
  { bg: "bg-violet-50", text: "text-violet-700", ring: "ring-violet-200", gradient: "from-violet-500 to-fuchsia-500" },
  { bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-200", gradient: "from-sky-500 to-cyan-400" },
  { bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-200", gradient: "from-rose-500 to-orange-400" },
  { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", gradient: "from-emerald-500 to-teal-400" },
  { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200", gradient: "from-amber-500 to-yellow-400" },
  { bg: "bg-indigo-50", text: "text-indigo-700", ring: "ring-indigo-200", gradient: "from-indigo-500 to-blue-400" },
];

export function accentFor(id: number): Accent {
  return PALETTE[id % PALETTE.length];
}
