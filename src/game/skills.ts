import { mulberry32 } from "./rng";

export type SkillId =
  | "lance-pierce"
  | "halo-ring"
  | "crater-punch"
  | "rail-long"
  | "beacon-mark"
  | "ship-hold";

export const SKILLS: { id: SkillId; name: string; line: string }[] = [
  { id: "lance-pierce", name: "Lance", line: "Pierces one more." },
  { id: "halo-ring", name: "Halo", line: "The ring grows." },
  { id: "crater-punch", name: "Crater", line: "The blast hits harder." },
  { id: "rail-long", name: "Rail", line: "A longer straight." },
  { id: "beacon-mark", name: "Beacon", line: "Marks take more." },
  { id: "ship-hold", name: "Ship", line: "The special lasts longer." },
];

export function offerSkills(owned: SkillId[], seed: number) {
  const pool = SKILLS.map((skill) => skill.id).filter((id) => !owned.includes(id));
  const next = mulberry32(seed);
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    const swap = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = swap;
  }
  return copy.slice(0, 3);
}
