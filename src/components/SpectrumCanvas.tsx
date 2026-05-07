import { useEffect, useRef } from "react";
import {
  createPlotLayout,
  dbToY,
  formatFrequency,
  freqToX,
  nearestEqBand,
  type SpectrumPoint,
} from "../engine/coordinateMapper";
import { DB_LINES, EQ_31_BANDS, MAJOR_FREQUENCY_LINES } from "../engine/eqBands";
import type { DemoPreset } from "../engine/demoPresets";

type SpectrumCanvasProps = {
  preset: DemoPreset;
  debug?: boolean;
};

function drawCurve(
  ctx: CanvasRenderingContext2D,
  points: SpectrumPoint[],
  layout: ReturnType<typeof createPlotLayout>,
  strokeStyle: string,
  lineWidth: number,
  alpha = 1,
  dash: number[] = []
) {
  if (points.length < 2) return;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.setLineDash(dash);

  ctx.beginPath();
  points.forEach((point, index) => {
    const x = freqToX(point.freq, layout);
    const y = dbToY(point.db, layout);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawGrid(ctx: CanvasRenderingContext2D, layout: ReturnType<typeof createPlotLayout>) {
  ctx.save();

  const bg = ctx.createLinearGradient(0, layout.top, 0, layout.bottom);
  bg.addColorStop(0, "rgba(37,99,235,0.12)");
  bg.addColorStop(0.45, "rgba(255,255,255,0.04)");
  bg.addColorStop(1, "rgba(20,184,166,0.10)");
  ctx.fillStyle = bg;
  roundRect(ctx, layout.left - 6, layout.top - 6, layout.plotWidth + 12, layout.plotHeight + 12, 22);
  ctx.fill();

  DB_LINES.forEach((db) => {
    const y = dbToY(db, layout);
    ctx.strokeStyle = "rgba(148, 163, 184, 0.13)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(layout.left, y);
    ctx.lineTo(layout.right, y);
    ctx.stroke();

    ctx.fillStyle = "rgba(100,116,139,0.76)";
    ctx.font = "10px Inter, ui-sans-serif, system-ui";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(String(db), layout.left - 9, y);
  });

  MAJOR_FREQUENCY_LINES.forEach((freq) => {
    const x = freqToX(freq, layout);
    ctx.strokeStyle = "rgba(148, 163, 184, 0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, layout.top);
    ctx.lineTo(x, layout.bottom);
    ctx.stroke();

    ctx.fillStyle = "rgba(100,116,139,0.82)";
    ctx.font = "10.5px Inter, ui-sans-serif, system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(formatFrequency(freq), x, layout.bottom + 9);
  });

  ctx.restore();
}

function drawFeedbackMarker(
  ctx: CanvasRenderingContext2D,
  preset: DemoPreset,
  layout: ReturnType<typeof createPlotLayout>
) {
  if (!preset.feedback) return;

  const x = freqToX(preset.feedback.freq, layout);
  const y = dbToY(-25, layout);
  const nearest = nearestEqBand(preset.feedback.freq, EQ_31_BANDS);

  ctx.save();

  const glow = ctx.createRadialGradient(x, y, 2, x, y, 58);
  glow.addColorStop(0, "rgba(248,113,113,0.45)");
  glow.addColorStop(1, "rgba(248,113,113,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, 58, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(239,68,68,0.72)";
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 7]);
  ctx.beginPath();
  ctx.moveTo(x, layout.top);
  ctx.lineTo(x, layout.bottom);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(239,68,68,1)";
  ctx.beginPath();
  ctx.arc(x, y, 5.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(127,29,29,0.92)";
  roundRect(ctx, x - 54, layout.top + 10, 108, 28, 14);
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.font = "800 10.5px Inter, ui-sans-serif, system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`Cut ${formatFrequency(nearest)}`, x, layout.top + 24);

  ctx.restore();
}

function drawDebugOverlay(
  ctx: CanvasRenderingContext2D,
  preset: DemoPreset,
  layout: ReturnType<typeof createPlotLayout>
) {
  ctx.save();

  ctx.strokeStyle = "rgba(236,72,153,0.76)";
  ctx.lineWidth = 1.3;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(layout.left, layout.top, layout.plotWidth, layout.plotHeight);

  const peak = preset.average.reduce((max, point) => (point.db > max.db ? point : max), preset.average[0]);
  const nearest = nearestEqBand(peak.freq, EQ_31_BANDS);

  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(15,23,42,0.72)";
  roundRect(ctx, layout.left + 10, layout.top + 10, 198, 50, 14);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "700 10.5px Inter, ui-sans-serif, system-ui";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(`plot ${Math.round(layout.plotWidth)}×${Math.round(layout.plotHeight)}`, layout.left + 22, layout.top + 20);
  ctx.fillText(`peak ${formatFrequency(peak.freq)} / eq ${formatFrequency(nearest)}`, layout.left + 22, layout.top + 39);

  ctx.restore();
}

export default function SpectrumCanvas({ preset, debug = false }: SpectrumCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let animationFrame = 0;

    const draw = () => {
      const canvas = canvasRef.current;
      const wrapper = wrapperRef.current;
      if (!canvas || !wrapper) return;

      const rect = wrapper.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const cssWidth = Math.max(320, rect.width);
      const cssHeight = 304;

      canvas.width = Math.floor(cssWidth * dpr);
      canvas.height = Math.floor(cssHeight * dpr);
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssWidth, cssHeight);

      const layout = createPlotLayout(cssWidth, cssHeight);

      const background = ctx.createLinearGradient(0, 0, cssWidth, cssHeight);
      background.addColorStop(0, "#fbfdff");
      background.addColorStop(1, "#eef7ff");
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, cssWidth, cssHeight);

      drawGrid(ctx, layout);

      drawCurve(ctx, preset.target, layout, "rgba(15, 23, 42, 0.26)", 2, 1, [5, 8]);
      drawCurve(ctx, preset.live, layout, "rgba(59, 130, 246, 0.24)", 1.2, 1);
      drawCurve(ctx, preset.average, layout, "rgba(14, 165, 233, 0.98)", 3.4, 1);
      drawCurve(ctx, preset.eqTrace, layout, "rgba(16, 185, 129, 0.92)", 2.6, 0.96);

      drawFeedbackMarker(ctx, preset, layout);

      if (debug) {
        drawDebugOverlay(ctx, preset, layout);
      }
    };

    const requestDraw = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(draw);
    };

    requestDraw();
    window.addEventListener("resize", requestDraw);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", requestDraw);
    };
  }, [preset, debug]);

  return (
    <div ref={wrapperRef} className="spectrum-card">
      <canvas ref={canvasRef} className="spectrum-canvas" aria-label="SoundFit spectrum analyzer" />
      <div className="legend-row">
        <span><i className="dot-live" />Live</span>
        <span><i className="dot-average" />Average</span>
        <span><i className="dot-target" />Target</span>
        <span><i className="dot-eq" />EQ Trace</span>
      </div>
    </div>
  );
}
