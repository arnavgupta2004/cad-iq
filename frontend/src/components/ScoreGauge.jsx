function gaugeColor(score) {
  if (score > 80) {
    return "#22c55e";
  }
  if (score >= 50) {
    return "#f59e0b";
  }
  return "#ef4444";
}

function GaugeSkeleton() {
  return (
    <section className="rounded-3xl border border-[#4f8ef7]/20 bg-[#1a1d27] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
      <div className="mx-auto flex w-full max-w-[260px] flex-col items-center justify-center">
        <div className="h-48 w-48 animate-pulse rounded-full border-[12px] border-[#253047] bg-[#0f1117]" />
        <div className="mt-6 h-4 w-40 animate-pulse rounded-full bg-[#253047]" />
      </div>
    </section>
  );
}

export default function ScoreGauge({ score = 0, isLoading = false }) {
  if (isLoading) {
    return <GaugeSkeleton />;
  }

  const normalizedScore = Math.max(0, Math.min(100, Number(score) || 0));
  const color = gaugeColor(normalizedScore);
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <section className="rounded-3xl border border-[#4f8ef7]/20 bg-[#1a1d27] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
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
            <span className="mt-1 text-sm uppercase tracking-[0.28em] text-[#9ca3af]">/ 100</span>
          </div>
        </div>
        <p className="mt-3 text-sm font-medium uppercase tracking-[0.35em] text-[#9ca3af]">Compliance Score</p>
      </div>
    </section>
  );
}
