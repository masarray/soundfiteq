/** Standard nominal ISO third-octave centers for a 31-band graphic EQ. */
export const EQ_31_BANDS = [
  20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315,
  400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000,
  5000, 6300, 8000, 10000, 12500, 16000, 20000,
] as const;

export const MAJOR_FREQUENCY_LINES = [31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000] as const;
export const DB_LINES = [0, -20, -40, -60, -80] as const;
