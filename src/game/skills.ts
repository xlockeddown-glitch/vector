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
