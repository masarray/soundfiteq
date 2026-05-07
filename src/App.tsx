import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Gauge,
  Headphones,
  History,
  Mic,
  RadioTower,
  RotateCcw,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Target,
  Waves,
} from 'lucide-react';

type Mode = 'Speech' | 'Vocal' | 'Full Mix' | 'Feedback';
type Severity = 'good' | 'warn' | 'danger' | 'info';

type SpectrumPoint = {
  freq: number;
  db: number;
};

type EqBand = {
  label: string;
  freq: number;
  gain: number;
  status: 'cut' | 'boost' | 'hold';
};

type Insight = {
  title: string;
  message: string;
  action: string;
  severity: Severity;
};

const EQ_BANDS: EqBand[] = [
  { label: '31', freq: 31, gain: 0, status: 'hold' },
  { label: '63', freq: 63, gain: 0, status: 'hold' },
  { label: '125', freq: 125, gain: -1, status: 'cut' },
  { label: '250', freq: 250, gain: -3, status: 'cut' },
  { label: '500', freq: 500, gain: -1, status: 'cut' },
  { label: '1k', freq: 1000, gain: 0, status: 'hold' },
  { label: '2k', freq: 2000, gain: 1, status: 'boost' },
  { label: '4k', freq: 4000, gain: 2, status: 'boost' },
  { label: '8k', freq: 8000, gain: 0, status: 'hold' },
  { label: '16k', freq: 16000, gain: 0, status: 'hold' },
];

const INSIGHTS: Insight[] = [
  {
    title: 'Low-mid terlalu dominan',
    message: 'Area 250â€“400 Hz terlihat tebal. Suara bisa terasa mendem atau boxy.',
    action: 'Coba cut 250 Hz / 315 Hz sekitar -2 sampai -3 dB.',
    severity: 'warn',
  },
  {
    title: 'Clarity vokal kurang keluar',
    message: 'Area 2â€“4 kHz sedikit di bawah target. Artikulasi bisa kurang jelas.',
    action: 'Boost ringan 2.5 kHz atau 3.15 kHz, jangan berlebihan.',
    severity: 'info',
  },
  {
    title: 'Feedback candidate detected',
    message: 'Peak sempit stabil muncul di sekitar 2.63 kHz.',
    action: 'Turunkan slider EQ 2.5 kHz bertahap -3 dB dulu.',
    severity: 'danger',
  },
];

const frequencyLabels = [31, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

function logX(freq: number, minFreq: number, maxFreq: number, left: number, width: number) {
  const ratio = Math.log(freq / minFreq) / Math.log(maxFreq / minFreq);
  return left + ratio * width;
}

function dbY(db: number, minDb: number, maxDb: number, top: number, height: number) {
  const clamped = Math.max(minDb, Math.min(maxDb, db));
  const normalized = (clamped - minDb) / (maxDb - minDb);
  return top + (1 - normalized) * height;
}

function buildCurve(kind: 'live' | 'average' | 'target' | 'eq', tick: number): SpectrumPoint[] {
  const freqs = Array.from({ length: 96 }, (_, i) => 20 * Math.pow(1000, i / 95));

  return freqs.map((freq, index) => {
    const logF = Math.log10(freq);
    const wave = Math.sin(index * 0.28 + tick * 0.055) * 3.2 + Math.cos(index * 0.11 + tick * 0.025) * 2.4;
    const lowMidBump = 14 * Math.exp(-Math.pow((logF - Math.log10(290)) / 0.27, 2));
    const clarityDip = -8 * Math.exp(-Math.pow((logF - Math.log10(2800)) / 0.24, 2));
    const feedbackNeedle = 21 * Math.exp(-Math.pow((logF - Math.log10(2630)) / 0.023, 2));
    const bassSlope = -8 * Math.max(0, logF - 2.1);

    if (kind === 'target') {
      const targetLow = 5 * Math.exp(-Math.pow((logF - Math.log10(130)) / 0.45, 2));
      const targetPresence = 4 * Math.exp(-Math.pow((logF - Math.log10(3200)) / 0.5, 2));
      return { freq, db: -52 + targetLow + targetPresence - Math.max(0, logF - 3.7) * 5 };
    }

    if (kind === 'eq') {
      const cut = -10 * Math.exp(-Math.pow((logF - Math.log10(280)) / 0.2, 2));
      const boost = 6 * Math.exp(-Math.pow((logF - Math.log10(3000)) / 0.24, 2));
      const feedbackCut = -12 * Math.exp(-Math.pow((logF - Math.log10(2630)) / 0.04, 2));
      return { freq, db: -52 + cut + boost + feedbackCut };
    }

    if (kind === 'average') {
      return { freq, db: -59 + lowMidBump + clarityDip * 0.5 + feedbackNeedle * 0.65 + bassSlope };
    }

    return { freq, db: -62 + lowMidBump + clarityDip + feedbackNeedle + bassSlope + wave };
  });
}

function SpectrumCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tick, setTick] = useState(0);

  const curves = useMemo(
    () => ({
      live: buildCurve('live', tick),
      average: buildCurve('average', tick),
      target: buildCurve('target', tick),
      eq: buildCurve('eq', tick),
    }),
    [tick]
  );

  useEffect(() => {
    const id = window.setInterval(() => setTick((v) => v + 1), 85);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const width = rect.width;
    const height = rect.height;
    const plot = { left: 44, right: width - 16, top: 22, bottom: height - 34 };
    const plotWidth = plot.right - plot.left;
    const plotHeight = plot.bottom - plot.top;
    const minFreq = 20;
    const maxFreq = 20000;
    const minDb = -86;
    const maxDb = -18;

    ctx.clearRect(0, 0, width, height);

    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, '#08111f');
    bg.addColorStop(0.56, '#0d1b2d');
    bg.addColorStop(1, '#121829');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for (const f of frequencyLabels) {
      const x = logX(f, minFreq, maxFreq, plot.left, plotWidth);
      ctx.beginPath();
      ctx.moveTo(x, plot.top);
      ctx.lineTo(x, plot.bottom);
      ctx.stroke();
    }

    for (const db of [-80, -70, -60, -50, -40, -30, -20]) {
      const y = dbY(db, minDb, maxDb, plot.top, plotHeight);
      ctx.beginPath();
      ctx.moveTo(plot.left, y);
      ctx.lineTo(plot.right, y);
      ctx.stroke();
      ctx.fillStyle = 'rgba(226,232,240,0.44)';
      ctx.font = '10px Inter, system-ui';
      ctx.fillText(`${db}`, 10, y + 3);
    }

    ctx.fillStyle = 'rgba(226,232,240,0.52)';
    ctx.font = '10px Inter, system-ui';
    frequencyLabels.forEach((f) => {
      const x = logX(f, minFreq, maxFreq, plot.left, plotWidth);
      const text = f >= 1000 ? `${f / 1000}k` : `${f}`;
      ctx.fillText(text, x - 8, height - 12);
    });

    const drawCurve = (points: SpectrumPoint[], color: string, lineWidth: number, alpha = 1) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      points.forEach((point, index) => {
        const x = logX(point.freq, minFreq, maxFreq, plot.left, plotWidth);
        const y = dbY(point.db, minDb, maxDb, plot.top, plotHeight);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();
    };

    drawCurve(curves.target, 'rgba(148,163,184,0.9)', 1.4, 0.75);
    drawCurve(curves.live, 'rgba(56,189,248,0.75)', 1.3, 0.8);
    drawCurve(curves.average, 'rgba(34,197,94,0.95)', 3.2, 0.95);
    drawCurve(curves.eq, 'rgba(251,191,36,0.98)', 2.8, 0.95);

    const feedbackFreq = 2630;
    const feedbackX = logX(feedbackFreq, minFreq, maxFreq, plot.left, plotWidth);
    const feedbackY = dbY(-32, minDb, maxDb, plot.top, plotHeight);
    ctx.save();
    ctx.strokeStyle = 'rgba(248,113,113,0.95)';
    ctx.fillStyle = 'rgba(248,113,113,0.16)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(feedbackX, feedbackY, 13 + Math.sin(tick * 0.25) * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(feedbackX, plot.top + 4);
    ctx.lineTo(feedbackX, plot.bottom);
    ctx.strokeStyle = 'rgba(248,113,113,0.45)';
    ctx.stroke();
    ctx.fillStyle = 'rgba(254,226,226,0.95)';
    ctx.font = '700 11px Inter, system-ui';
    ctx.fillText('2.63k feedback?', Math.min(feedbackX + 10, width - 104), Math.max(feedbackY - 12, 18));
    ctx.restore();

    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.strokeRect(plot.left, plot.top, plotWidth, plotHeight);
  }, [curves, tick]);

  return (
    <div className="spectrum-card">
      <div className="spectrum-head">
        <div>
          <p className="eyebrow">Rolling EQ Trace</p>
          <h2>Live spectrum + stable decision curve</h2>
        </div>
        <div className="confidence-pill">
          <CircleDot size={13} /> Good signal
        </div>
      </div>
      <canvas ref={canvasRef} className="spectrum-canvas" />
      <div className="legend-row">
        <span><i className="live" /> Live</span>
        <span><i className="avg" /> Rolling avg</span>
        <span><i className="target" /> Target</span>
        <span><i className="eq" /> EQ trace</span>
      </div>
    </div>
  );
}

function ModeSelector({ mode, setMode }: { mode: Mode; setMode: (mode: Mode) => void }) {
  const modes: { mode: Mode; icon: React.ReactNode }[] = [
    { mode: 'Speech', icon: <Mic size={16} /> },
    { mode: 'Vocal', icon: <Headphones size={16} /> },
    { mode: 'Full Mix', icon: <Waves size={16} /> },
    { mode: 'Feedback', icon: <RadioTower size={16} /> },
  ];

  return (
    <div className="mode-selector">
      {modes.map((item) => (
        <button key={item.mode} className={mode === item.mode ? 'active' : ''} onClick={() => setMode(item.mode)}>
          {item.icon}
          {item.mode}
        </button>
      ))}
    </div>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  return (
    <article className={`insight-card ${insight.severity}`}>
      <div className="insight-icon">
        {insight.severity === 'danger' ? <AlertTriangle size={18} /> : insight.severity === 'warn' ? <Gauge size={18} /> : <Sparkles size={18} />}
      </div>
      <div>
        <h3>{insight.title}</h3>
        <p>{insight.message}</p>
        <strong>{insight.action}</strong>
      </div>
    </article>
  );
}

function FeedbackAlert() {
  return (
    <section className="feedback-alert">
      <div className="alert-topline">
        <div className="alert-icon"><AlertTriangle size={19} /></div>
        <div>
          <p className="eyebrow">Feedback Finder</p>
          <h3>Possible feedback at 2.63 kHz</h3>
        </div>
      </div>
      <div className="alert-grid">
        <div>
          <span>Nearest EQ band</span>
          <strong>2.5 kHz</strong>
        </div>
        <div>
          <span>Confidence</span>
          <strong>High</strong>
        </div>
        <div>
          <span>Action</span>
          <strong>Cut -3 dB first</strong>
        </div>
      </div>
      <p className="alert-note">Ada nada mencuit dominan. Turunkan slider 2.5 kHz sedikit demi sedikit sampai feedback hilang.</p>
    </section>
  );
}

function SuggestedEqPanel() {
  return (
    <section className="panel-card">
      <div className="section-title">
        <div>
          <p className="eyebrow">Suggested EQ</p>
          <h2>Start with small moves</h2>
        </div>
        <SlidersHorizontal size={19} />
      </div>
      <div className="eq-bars">
        {EQ_BANDS.map((band) => {
          const height = 42 + Math.abs(band.gain) * 11;
          return (
            <div className="eq-band" key={band.label}>
              <div className="eq-track">
                <div className={`eq-knob ${band.status}`} style={{ height: `${height}px`, transform: band.gain >= 0 ? 'translateY(-8px)' : 'translateY(8px)' }} />
              </div>
              <span>{band.label}</span>
              <em>{band.gain > 0 ? `+${band.gain}` : band.gain}</em>
            </div>
          );
        })}
      </div>
      <div className="try-list">
        <span>Try this first</span>
        <p>Cut 250 Hz, cut 2.5 kHz if ringing, then boost presence lightly only if vocal still unclear.</p>
      </div>
    </section>
  );
}

function BeforeAfterPanel() {
  return (
    <section className="before-after">
      <div className="section-title">
        <div>
          <p className="eyebrow">Before / After</p>
          <h2>Tuning improvement check</h2>
        </div>
        <RotateCcw size={19} />
      </div>
      <div className="compare-grid">
        <div className="compare-box before">
          <span>Before</span>
          <strong>Muddy + feedback risk</strong>
          <p>Low-mid tebal, 2.63 kHz peak tinggi.</p>
        </div>
        <div className="compare-box after">
          <span>After target</span>
          <strong>Clearer speech</strong>
          <p>250â€“400 Hz turun, presence lebih rapi.</p>
        </div>
      </div>
    </section>
  );
}

function BottomNav() {
  return (
    <nav className="bottom-nav">
      <button className="active"><Activity size={18} /><span>Analyze</span></button>
      <button><Target size={18} /><span>Coach</span></button>
      <button><History size={18} /><span>History</span></button>
      <button><Settings size={18} /><span>Settings</span></button>
    </nav>
  );
}

export default function App() {
  const [mode, setMode] = useState<Mode>('Speech');

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div className="hero-bg" />
        <div className="app-topbar">
          <div className="brand-mark"><BarChart3 size={21} /></div>
          <div>
            <p className="eyebrow">SoundFit</p>
            <h1>EQ Coach</h1>
          </div>
          <button className="premium-button">V1 Demo</button>
        </div>

        <div className="hero-copy">
          <h2>See what you hear.</h2>
          <p>PWA assistant untuk membaca sound dari HP, menemukan frekuensi bermasalah, dan memberi arahan EQ sederhana untuk operator awam.</p>
        </div>

        <ModeSelector mode={mode} setMode={setMode} />

        <div className="hero-actions">
          <button className="primary-action">
            <Mic size={18} /> Start Listening <ChevronRight size={18} />
          </button>
          <button className="ghost-action">
            <CheckCircle2 size={18} /> Demo Signal
          </button>
        </div>
      </section>

      <section className="status-strip">
        <div><span>Mode</span><strong>{mode}</strong></div>
        <div><span>Smoothing</span><strong>Rolling 5s</strong></div>
        <div><span>EQ Type</span><strong>31-band</strong></div>
      </section>

      <SpectrumCanvas />
      <FeedbackAlert />

      <section className="insight-stack">
        <div className="section-title">
          <div>
            <p className="eyebrow">Coach Insights</p>
            <h2>What SoundFit hears</h2>
          </div>
          <Sparkles size={19} />
        </div>
        {INSIGHTS.map((insight) => <InsightCard key={insight.title} insight={insight} />)}
      </section>

      <SuggestedEqPanel />
      <BeforeAfterPanel />
      <div className="safe-bottom" />
      <BottomNav />
    </main>
  );
}

