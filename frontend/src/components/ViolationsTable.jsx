function severityClasses(severity) {
  if (severity === "Critical") {
    return "bg-red-500/15 text-red-100";
  }
  if (severity === "Major") {
    return "bg-orange-500/15 text-orange-100";
  }
  return "bg-yellow-500/15 text-yellow-100";
}

export default function ViolationsTable({ summary, violations = [] }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-cyan-200">Validation Findings</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Compliance Review</h2>
        </div>
      </div>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">{summary}</p>

      {violations.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-sm text-emerald-100">
          No violations found. This design passed the current rule checks.
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm text-slate-200">
              <thead className="bg-white/5 text-xs uppercase tracking-[0.24em] text-slate-400">
                <tr>
                  <th className="px-4 py-4">#</th>
                  <th className="px-4 py-4">Rule Violated</th>
                  <th className="px-4 py-4">Finding</th>
                  <th className="px-4 py-4">Severity</th>
                  <th className="px-4 py-4">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {violations.map((violation, index) => (
                  <tr key={`${violation.id ?? index}-${violation.rule}`} className={`${severityClasses(violation.severity)} border-t border-white/10 align-top`}>
                    <td className="px-4 py-4 font-semibold">{violation.id ?? index + 1}</td>
                    <td className="px-4 py-4 min-w-[240px] font-medium">{violation.rule}</td>
                    <td className="px-4 py-4 min-w-[240px]">{violation.finding}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-current/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                        {violation.severity}
                      </span>
                    </td>
                    <td className="px-4 py-4 min-w-[260px]">{violation.recommendation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
