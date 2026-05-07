import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Headphones,
  Mic2,
  Radio,
  SlidersHorizontal,
  Sparkles,
  Waves,
  Zap,
} from "lucide-react";
import SpectrumCanvas from "./components/SpectrumCanvas";
import { DEMO_PRESETS, getDemoPreset, type DemoPresetKey } from "./engine/demoPresets";
import { EQ_31_BANDS } from "./engine/eqBands";
import { formatFrequency, nearestEqBand } from "./engine/coordinateMapper";
import "./index.css";

type ModeKey = "speech" | "vocal" | "fullmix" | "feedback";

const modes: Array<{
  key: ModeKey;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    key: "speech",
    label: "Speech",
    description: "Ceramah / MC",
    icon: <Mic2 size={17} />,
  },
  {
    key: "vocal",
    label: "Vocal",
    description: "Clarity & body",
    icon: <Headphones size={17} />,
  },
  {
    key: "fullmix",
    label: "Full Mix",
    description: "Tonal balance",
    icon: <Waves size={17} />,
  },
  {
    key: "feedback",
    label: "Feedback",
    description: "Find ringing",
    icon: <AlertTriangle size={17} />,
  },
];

function App() {
  const [mode, setMode] = useState<ModeKey>("speech");
  const [presetKey, setPresetKey] = useState<DemoPresetKey>("feedback25k");
  const [debug, setDebug] = useState(false);

  const preset = useMemo(() => getDemoPreset(presetKey), [presetKey]);

  const nearestFeedbackBand = preset.feedback
    ? nearestEqBand(preset.feedback.freq, EQ_31_BANDS)
    : 2500;

  return (
    <main className="app">
      <section className="hero-card">
        <div className="hero-glow hero-glow-a" />
        <div className="hero-glow hero-glow-b" />

        <div className="hero-content">
          <div className="brand-row">
            <div className="brand-mark">
              <Activity size={23} />
            </div>
            <div>
              <p className="eyebrow">SoundFit EQ Coach</p>
              <h1>See what you hear.</h1>
            </div>
          </div>

          <p className="hero-copy">
            Bantu operator sound membaca frekuensi, menemukan feedback, dan tahu slider EQ mana
            yang sebaiknya disentuh.
          </p>

          <div className="hero-actions">
            <button className="primary-button">
              <Radio size={18} />
              Analyzer Demo
            </button>
            <button className="soft-button" onClick={() => setDebug((value) => !value)}>
              <Sparkles size={18} />
              {debug ? "Hide Debug" : "Debug"}
            </button>
          </div>
        </div>
      </section>

      <section className="floating-panel mode-panel">
        <div className="section-header compact">
          <div>
            <p className="eyebrow">Choose mode</p>
            <h2>What do you want to fix?</h2>
          </div>
        </div>

        <div className="mode-grid">
          {modes.map((item) => (
            <button
              key={item.key}
              className={`mode-button ${mode === item.key ? "active" : ""}`}
              onClick={() => setMode(item.key)}
            >
              <span className="mode-icon">{item.icon}</span>
              <span>
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="analyzer-panel">
        <div className="section-header analyzer-top">
          <div>
            <p className="eyebrow">Rolling EQ Trace</p>
            <h2>{preset.label}</h2>
            <p className="muted">{preset.subtitle}</p>
          </div>
          <div className="live-pill">
            <span className="pulse-dot" />
            Static V2.1
          </div>
        </div>

        <div className="preset-pills">
          {DEMO_PRESETS.map((item) => (
            <button
              key={item.key}
              className={`preset-pill ${presetKey === item.key ? "active" : ""}`}
              onClick={() => setPresetKey(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <SpectrumCanvas preset={preset} debug={debug} />

        <div className="mini-summary">
          <span>
            <CheckCircle2 size={16} />
            Log-scale spectrum
          </span>
          <span>
            <Zap size={16} />
            EQ trace ready
          </span>
          <span>
            <AlertTriangle size={16} />
            Feedback marker
          </span>
        </div>
      </section>

      <section className={`feedback-panel ${preset.feedback ? "danger" : ""}`}>
        <div className="feedback-badge">
          <AlertTriangle size={23} />
        </div>
        <div>
          <p className="eyebrow">Feedback Finder</p>
          {preset.feedback ? (
            <>
              <h2>Possible feedback around {formatFrequency(nearestFeedbackBand)}Hz</h2>
              <p>
                Ada narrow peak yang dominan. Coba turunkan slider{" "}
                <strong>{formatFrequency(nearestFeedbackBand)}Hz</strong> pelan-pelan dulu.
              </p>
              <div className="feedback-tags">
                <span>Confidence: {preset.feedback.confidence}</span>
                <span>Prominence +{preset.feedback.prominenceDb} dB</span>
              </div>
            </>
          ) : (
            <>
              <h2>No strong feedback peak</h2>
              <p>
                Tidak ada peak sempit ekstrem pada preset ini. Pantau area 2–8 kHz saat mic mulai ring.
              </p>
            </>
          )}
        </div>
      </section>

      <section className="coach-grid">
        <article className="coach-card">
          <div className="coach-icon blue">
            <Waves size={20} />
          </div>
          <p className="eyebrow">Insight</p>
          <h3>Read the sound shape</h3>
          <p>
            Kurva biru tebal menunjukkan karakter suara rata-rata, bukan spectrum yang liar sesaat.
          </p>
        </article>

        <article className="coach-card">
          <div className="coach-icon green">
            <SlidersHorizontal size={20} />
          </div>
          <p className="eyebrow">Action</p>
          <h3>Touch the right slider</h3>
          <p>
            App menerjemahkan masalah frekuensi menjadi saran slider EQ yang mudah dicoba.
          </p>
        </article>
      </section>

      <section className="eq-panel">
        <div className="section-header compact">
          <div>
            <p className="eyebrow">Suggested EQ</p>
            <h2>Slider focus</h2>
          </div>
          <SlidersHorizontal size={21} />
        </div>

        <div className="eq-strip">
          {[63, 125, 250, 315, 500, 1000, 2000, 2500, 3150, 4000, 8000].map((band) => {
            const isFeedbackBand =
              preset.feedback && nearestEqBand(preset.feedback.freq, EQ_31_BANDS) === band;
            const isMuddyBand = presetKey === "muddyVocal" && [250, 315].includes(band);
            const isBoomBand = presetKey === "boomyBass" && [125].includes(band);
            const active = isFeedbackBand || isMuddyBand || isBoomBand;

            return (
              <div key={band} className={`eq-band ${active ? "active" : ""}`}>
                <div className="eq-track">
                  <div className="eq-handle" />
                </div>
                <span>{formatFrequency(band)}</span>
              </div>
            );
          })}
        </div>
      </section>

      <nav className="bottom-nav">
        <button className="nav-button active">
          <Activity size={18} />
          Analyzer
        </button>
        <button className="nav-button">
          <AlertTriangle size={18} />
          Feedback
        </button>
        <button className="nav-button">
          <SlidersHorizontal size={18} />
          EQ
        </button>
      </nav>
    </main>
  );
}

export default App;
