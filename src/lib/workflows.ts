// Stage templates for the two disciplines. Shared client + server.
export type Discipline = "designer" | "editor";

export interface StageTemplate {
  key: string;
  title: string;
  description: string;
  time_estimate: string;
  checklist: string[];
  common_mistakes: string[];
  senior_tips: string[];
}

export const DESIGNER_STAGES: StageTemplate[] = [
  {
    key: "brief",
    title: "Brief",
    description: "Absorb the creative brief. Confirm scope, audience, deliverables, and success criteria before touching any tool.",
    time_estimate: "30–60 min",
    checklist: [
      "Read the brief twice, out loud once",
      "List every deliverable + spec",
      "Write down open questions",
      "Confirm deadline and priority",
    ],
    common_mistakes: [
      "Skimming the brief and starting to design",
      "Assuming platform specs instead of confirming",
    ],
    senior_tips: [
      "If the brief is unclear, the design will be too — clarify now, not later.",
      "Restate the objective in one sentence. If you can't, you don't understand it.",
    ],
  },
  {
    key: "research",
    title: "Research",
    description: "Study the brand, category, and competitive landscape. Build a POV before you have a visual.",
    time_estimate: "1–2 hrs",
    checklist: [
      "Review brand guidelines end-to-end",
      "Collect 15+ competitor references",
      "Note visual patterns and clichés to avoid",
      "Summarize your POV in 3 bullets",
    ],
    common_mistakes: [
      "Only looking at direct competitors",
      "Copying trends instead of understanding them",
    ],
    senior_tips: ["Research is the design. What you look at shapes what you make."],
  },
  {
    key: "moodboard",
    title: "Moodboard",
    description: "Curate a tight visual direction. Intent > volume — every image should defend a decision.",
    time_estimate: "1–2 hrs",
    checklist: [
      "Choose one clear direction (not three)",
      "12–20 images maximum",
      "Include type, color, texture, motion refs",
      "Write a 1-line rationale per cluster",
    ],
    common_mistakes: ["Pinterest dump with no POV", "Mixing 4 directions to hedge"],
    senior_tips: ["A moodboard without an argument is decoration."],
  },
  {
    key: "direction",
    title: "Design Direction",
    description: "Define the system: type scale, palette, grid, and tone before making finished pieces.",
    time_estimate: "2–4 hrs",
    checklist: [
      "Lock primary + secondary type",
      "Define color palette with usage rules",
      "Choose grid and spacing scale",
      "Write the 'voice' in one paragraph",
    ],
    common_mistakes: ["Skipping the system and jumping to layouts"],
    senior_tips: ["Constraints unlock speed. Set them before you design."],
  },
  {
    key: "wireframe",
    title: "Wireframe",
    description: "Solve hierarchy and composition in grayscale. Prove the layout works before adding polish.",
    time_estimate: "2–3 hrs",
    checklist: [
      "Draft 3 layout options per deliverable",
      "Test information hierarchy at 25% zoom",
      "No colors, no fonts, no images yet",
    ],
    common_mistakes: ["Adding polish to hide weak composition"],
    senior_tips: ["If it works in grayscale, it works. If it doesn't, color won't save it."],
  },
  {
    key: "design",
    title: "Design",
    description: "Execute the chosen direction. Craft over quantity.",
    time_estimate: "4–8 hrs",
    checklist: [
      "Follow the design system strictly",
      "Pixel-align every element",
      "Check on the actual output device",
      "Get one round of self-critique before submitting",
    ],
    common_mistakes: ["Fighting the system you just built", "Off-grid alignment"],
    senior_tips: ["Craft is what separates good from great."],
  },
  {
    key: "qc",
    title: "Quality Check",
    description: "Ruthless self-review against every checklist item.",
    time_estimate: "30–60 min",
    checklist: [
      "Alignment and spacing consistent",
      "Typography hierarchy correct",
      "Contrast meets AA",
      "Copy proofread twice",
      "Brand rules respected",
      "Export specs correct",
    ],
    common_mistakes: ["Trusting yourself instead of the checklist"],
    senior_tips: ["The checklist is the senior in the room."],
  },
  {
    key: "export",
    title: "Export",
    description: "Package deliverables with correct naming, formats, and folder structure.",
    time_estimate: "30 min",
    checklist: [
      "Correct formats per platform",
      "Named per convention",
      "Organized folder structure",
      "Preview on a fresh device",
    ],
    common_mistakes: ["Wrong color space", "Missing bleed"],
    senior_tips: ["Delivery IS the design to the client."],
  },
  {
    key: "reflection",
    title: "Reflection",
    description: "Capture what worked, what didn't, and what you'd change next time.",
    time_estimate: "15 min",
    checklist: [
      "Write 3 things that worked",
      "Write 3 things to improve",
      "Note one skill to practice",
    ],
    common_mistakes: ["Skipping reflection to start the next project"],
    senior_tips: ["Reflection compounds. Skipping it is why juniors stay junior."],
  },
];

export const EDITOR_STAGES: StageTemplate[] = [
  {
    key: "brief",
    title: "Brief",
    description: "Understand the story, the audience, and the platform before opening the timeline.",
    time_estimate: "30–60 min",
    checklist: ["Read the brief twice", "Clarify deliverables", "Confirm platform specs"],
    common_mistakes: ["Editing before understanding intent"],
    senior_tips: ["Story first. Cuts second."],
  },
  {
    key: "organize",
    title: "Organize Footage",
    description: "Ingest, label, and structure media so you can find what matters.",
    time_estimate: "1–2 hrs",
    checklist: ["Ingest and back up", "Sync audio", "Rename + tag clips", "Build selects bins"],
    common_mistakes: ["Editing directly from raw dumps"],
    senior_tips: ["Organization is speed. Speed is craft."],
  },
  {
    key: "review",
    title: "Review Footage",
    description: "Watch everything. Log gold moments and story beats.",
    time_estimate: "1–3 hrs",
    checklist: ["Watch every clip", "Mark best takes", "Log key soundbites"],
    common_mistakes: ["Skipping to obvious selects"],
    senior_tips: ["The best moment is usually one you didn't expect."],
  },
  {
    key: "story",
    title: "Story Structure",
    description: "Outline the arc before touching the timeline.",
    time_estimate: "1 hr",
    checklist: ["Write the hook", "Structure beginning/middle/end", "Define the payoff"],
    common_mistakes: ["No structure — hoping it emerges in the edit"],
    senior_tips: ["A great cut can't save a broken structure."],
  },
  {
    key: "rough",
    title: "Rough Cut",
    description: "Assemble the story loosely. Focus on flow, not polish.",
    time_estimate: "3–5 hrs",
    checklist: ["Assemble in order", "Test pacing", "Get someone to watch it"],
    common_mistakes: ["Polishing before pacing works"],
    senior_tips: ["Rough cut = story test."],
  },
  {
    key: "fine",
    title: "Fine Cut",
    description: "Refine every cut, transition, and beat.",
    time_estimate: "3–5 hrs",
    checklist: ["Trim frames, not seconds", "Refine transitions", "Adjust for rhythm"],
    common_mistakes: ["Rushing the fine cut"],
    senior_tips: ["Frame-level attention is what makes it feel professional."],
  },
  {
    key: "graphics",
    title: "Graphics",
    description: "Add titles, lower-thirds, callouts, and any motion graphics.",
    time_estimate: "2–3 hrs",
    checklist: ["Consistent typography", "Readable at platform size", "On-brand"],
    common_mistakes: ["Overusing effects"],
    senior_tips: ["If it's not helping the story, it's hurting it."],
  },
  {
    key: "sound",
    title: "Sound Design",
    description: "Layer music, SFX, and ambience. Balance dialogue.",
    time_estimate: "2–3 hrs",
    checklist: ["Levels to platform spec", "Music supports story", "SFX add weight without distraction"],
    common_mistakes: ["Loud music, quiet dialogue"],
    senior_tips: ["Bad sound reads as amateur even with great visuals."],
  },
  {
    key: "color",
    title: "Color",
    description: "Grade for consistency and mood.",
    time_estimate: "1–2 hrs",
    checklist: ["Match shots", "Set look", "Check on multiple displays"],
    common_mistakes: ["Over-grading"],
    senior_tips: ["Subtle > extreme."],
  },
  {
    key: "export",
    title: "Export",
    description: "Deliver in the right format and settings.",
    time_estimate: "30 min",
    checklist: ["Codec + bitrate correct", "Aspect + resolution correct", "Preview final file"],
    common_mistakes: ["Wrong export settings"],
    senior_tips: ["Always watch the exported file, not the timeline."],
  },
  {
    key: "reflection",
    title: "Reflection",
    description: "Capture lessons for next project.",
    time_estimate: "15 min",
    checklist: ["3 wins", "3 improvements", "1 skill to practice"],
    common_mistakes: ["Skipping reflection"],
    senior_tips: ["Reflection compounds."],
  },
];

export function stagesFor(discipline: Discipline): StageTemplate[] {
  return discipline === "editor" ? EDITOR_STAGES : DESIGNER_STAGES;
}
