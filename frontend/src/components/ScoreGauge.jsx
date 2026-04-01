function gaugeColor(score) {
  if (score > 80) {
    return "#22c55e";
  }
  if (score >= 50) {
    return "#f97316";
  }
  return "#ef4444";
}

export default function ScoreGauge({ score = 0 }) {
  const normalizedScore = Math.max(0, Math.min(100, Number(score) || 0));
  const color = gaugeColor(normalizedScore);
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-[260px] flex-col items-center justify-center">
        <div className="relative h-48 w-48 animate-[fadeIn_800ms_ease-out]">
          <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
            <circle cx="70" cy="70" r="54" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
            <circle
              cx="70"
              cy="70"
              r="54"
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold text-white">{normalizedScore}</span>
            <span className="mt-1 text-sm uppercase tracking-[0.28em] text-slate-400">/ 100</span>
          </div>
        </div>
        <p className="mt-3 text-sm font-medium uppercase tracking-[0.35em] text-slate-300">Compliance Score</p>
      </div>
    </section>
  );
}
