import { jsPDF } from "jspdf";
import toast from "react-hot-toast";

function writeWrappedLine(doc, text, x, y, maxWidth, lineHeight) {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

export default function ReportExport({ validation }) {
  function exportPdf() {
    if (!validation) {
      toast.error("No validation report available yet.");
      return;
    }

    const doc = new jsPDF();
    const timestamp = new Date();
    const score = validation.validation?.compliance_score ?? 0;
    const summary = validation.validation?.summary ?? "No summary available.";
    const violations = validation.validation?.violations ?? [];

    let y = 20;
    const left = 16;
    const maxWidth = 178;
    const lineHeight = 7;

    doc.setFontSize(18);
    doc.text("CAD-IQ Validation Report", left, y);
    y += 10;

    doc.setFontSize(11);
    doc.text(`Generated: ${timestamp.toLocaleString()}`, left, y);
    y += 8;
    doc.text(`Compliance Score: ${score}/100`, left, y);
    y += 10;

    doc.setFontSize(13);
    doc.text("Summary", left, y);
    y += 7;
    doc.setFontSize(11);
    y = writeWrappedLine(doc, summary, left, y, maxWidth, lineHeight) + 4;

    doc.setFontSize(13);
    doc.text("Violations", left, y);
    y += 8;

    if (violations.length === 0) {
      doc.setFontSize(11);
      doc.text("No violations found.", left, y);
    } else {
      violations.forEach((violation, index) => {
        if (y > 255) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(11);
        doc.setFont(undefined, "bold");
        doc.text(`#${violation.id ?? index + 1} - ${violation.rule ?? "Rule"}`, left, y);
        y += 7;

        doc.setFont(undefined, "normal");
        y = writeWrappedLine(doc, `Severity: ${violation.severity ?? "Unknown"}`, left, y, maxWidth, lineHeight);
        y = writeWrappedLine(doc, `Finding: ${violation.finding ?? "Not provided"}`, left, y, maxWidth, lineHeight);
        y = writeWrappedLine(doc, `Recommendation: ${violation.recommendation ?? "Not provided"}`, left, y, maxWidth, lineHeight);
        y += 6;
      });
    }

    doc.save("cadiq-validation-report.pdf");
    toast.success("PDF report exported.");
  }

  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={exportPdf}
        disabled={!validation}
        className="rounded-2xl bg-[#4f8ef7] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6aa0f8] disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-[#9ca3af]"
      >
        Export PDF Report
      </button>
    </div>
  );
}
