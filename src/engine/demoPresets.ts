import type { SpectrumPoint } from "./coordinateMapper";

export type DemoPresetKey = "feedback25k" | "muddyVocal" | "boomyBass" | "balanced";

export type DemoPreset = Readonly<{
  key: DemoPresetKey;
  label: string;
  subtitle: string;
  average: readonly SpectrumPoint[];
  live: readonly SpectrumPoint[];
  target: readonly SpectrumPoint[];
  eqTrace: readonly SpectrumPoint[];
  feedback?: Readonly<{
    freq: number;
    confidence: string;
    prominenceDb: number;
  }>;
}>;

export const DEMO_PRESETS: ReadonlyArray<Readonly<{ key: DemoPresetKey; label: string }>> = [
  { key: "feedback25k", label: "Feedback 2.5 kHz" },
  { key: "muddyVocal", label: "Muddy vocal" },
  { key: "boomyBass", label: "Boomy bass" },
  { key: "balanced", label: "Balanced" },
];

/** Deterministic static demonstration data. Not a live microphone analyzer. */
const FREQUENCIES = Array.from({ length: 121 }, (_, i) => 20 * Math.pow(1000, i / 120));

function bump(freq: number, center: number, widthOctaves: number): number {
  const octaves = Math.log2(freq / center) / widthOctaves;
  return Math.exp(-0.5 * octaves * octaves);
}

function baseLevel(freq: number): number {
  return -45 + 3.2 * bump(freq, 115, 1.15) + 2.0 * bump(freq, 1700, 2.0)
    - 6.0 * bump(freq, 15000, 1.7)
    + 0.9 * Math.sin(2.7 * Math.log2(freq / 40));
}

function makePreset(key: DemoPresetKey, label: string, subtitle: string): DemoPreset {
  const feedback = key === "feedback25k"
    ? { freq: 2500, confidence: "High", prominenceDb: 18 } as const
    : undefined;

  const anomaly = (freq: number): number => {
    switch (key) {
      case "feedback25k": return 18 * bump(freq, 2500, 0.085);
      case "muddyVocal": return 10 * bump(freq, 290, 0.6);
      case "boomyBass": return 13 * bump(freq, 125, 0.55);
      case "balanced": return 0;
    }
  };

  const target = FREQUENCIES.map((freq) => ({ freq, db: baseLevel(freq) }));
  const average = FREQUENCIES.map((freq) => ({
    freq,
    db: baseLevel(freq) + anomaly(freq) + 0.8 * Math.sin(Math.log2(freq / 30) * 4),
  }));
  const live = average.map(({ freq, db }) => ({
    freq,
    db: db + 1.4 * Math.sin(Math.log2(freq / 20) * 10) + 0.6 * Math.sin(Math.log2(freq / 25) * 17),
  }));
  const eqTrace = average.map(({ freq, db }) => ({ freq, db: db - 0.78 * anomaly(freq) }));

  return { key, label, subtitle, average, live, target, eqTrace, ...(feedback ? { feedback } : {}) };
}

const PRESETS: Record<DemoPresetKey, DemoPreset> = {
  feedback25k: makePreset("feedback25k", "Narrow feedback peak", "Static demonstration: narrow ringing at 2.5 kHz."),
  muddyVocal: makePreset("muddyVocal", "Muddy vocal", "Static demonstration: excess low-mid energy around 250–315 Hz."),
  boomyBass: makePreset("boomyBass", "Boomy bass", "Static demonstration: excess bass energy around 125 Hz."),
  balanced: makePreset("balanced", "Balanced spectrum", "Static demonstration: smooth, controlled frequency balance."),
};

export function getDemoPreset(key: DemoPresetKey): DemoPreset {
  return PRESETS[key];
}
