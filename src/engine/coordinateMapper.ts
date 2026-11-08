export type SpectrumPoint = Readonly<{ freq: number; db: number }>;

export type PlotLayout = Readonly<{
  left: number;
  right: number;
  top: number;
  bottom: number;
  plotWidth: number;
  plotHeight: number;
}>;

const MIN_FREQUENCY = 20;
const MAX_FREQUENCY = 20000;
const MIN_DB = -80;
const MAX_DB = 0;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

export function createPlotLayout(width: number, height: number): PlotLayout {
  const left = 46;
  const right = Math.max(left + 16, width - 23);
  const top = 18;
  const bottom = Math.max(top + 16, height - 48);
  return { left, right, top, bottom, plotWidth: right - left, plotHeight: bottom - top };
}

/** Map audible frequency to a clamped logarithmic X coordinate. */
export function freqToX(freq: number, layout: PlotLayout): number {
  const safe = clamp(freq, MIN_FREQUENCY, MAX_FREQUENCY);
  const normalized = Math.log(safe / MIN_FREQUENCY) / Math.log(MAX_FREQUENCY / MIN_FREQUENCY);
  return layout.left + normalized * layout.plotWidth;
}

export function dbToY(db: number, layout: PlotLayout): number {
  const normalized = (MAX_DB - clamp(db, MIN_DB, MAX_DB)) / (MAX_DB - MIN_DB);
  return layout.top + normalized * layout.plotHeight;
}

/** Return the center closest in logarithmic distance, as EQ bands are ratios. */
export function nearestEqBand(freq: number, bands: readonly number[]): number {
  if (!bands.length) throw new Error("At least one EQ band is required");
  const safe = Math.max(MIN_FREQUENCY, Number.isFinite(freq) ? freq : MIN_FREQUENCY);
  return bands.reduce(
    (best, band) => Math.abs(Math.log(safe / band)) < Math.abs(Math.log(safe / best)) ? band : best,
    bands[0],
  );
}

export function formatFrequency(freq: number): string {
  if (freq >= 1000) return `${Number((freq / 1000).toFixed(2))}k`;
  return String(Number(freq.toFixed(1)));
}
