function severityClasses(severity) {
  if (severity === "Critical") {
    return "bg-red-500/12 text-red-100";
  }
  if (severity === "Major") {
    return "bg-orange-500/12 text-orange-100";
  }
  return "bg-yellow-500/12 text-yellow-100";
}

function TableSkeleton() {
  return (
    <section className="rounded-3xl border border-[#4f8ef7]/20 bg-[#1a1d27] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
      <div className="h-4 w-36 animate-pulse rounded-full bg-[#253047]" />
      <div className="mt-3 h-8 w-56 animate-pulse rounded-full bg-[#253047]" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-16 animate-pulse rounded-2xl bg-[#0f1117]" />
        ))}
      </div>
    </section>
  );
}

export default function ViolationsTable({ summary, violations = [], isLoading = false }) {
  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <section className="rounded-3xl border border-[#4f8ef7]/20 bg-[#1a1d27] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-[#4f8ef7]">Validation Findings</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Compliance Review</h2>
        </div>
      </div>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-[#9ca3af]">{summary}</p>

      {violations.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-sm text-emerald-100">
          No violations found. This design passed the current rule checks.
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-[#4f8ef7]/15">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm text-white">
              <thead className="bg-[#0f1117] text-xs uppercase tracking-[0.24em] text-[#9ca3af]">
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
                  <tr
                    key={`${violation.id ?? index}-${violation.rule}`}
                    className={`${severityClasses(violation.severity)} border-t border-white/8 align-top`}
                  >
                    <td className="px-4 py-4 font-semibold">{violation.id ?? index + 1}</td>
                    <td className="min-w-[240px] px-4 py-4 font-medium">{violation.rule}</td>
                    <td className="min-w-[240px] px-4 py-4">{violation.finding}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-current/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                        {violation.severity}
                      </span>
                    </td>
                    <td className="min-w-[260px] px-4 py-4">{violation.recommendation}</td>
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
