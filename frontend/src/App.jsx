import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import ChatSidebar from "./components/ChatSidebar";
import FileUpload from "./components/FileUpload";
import ModelViewer from "./components/ModelViewer";
import ReportExport from "./components/ReportExport";
import ScoreGauge from "./components/ScoreGauge";
import ViolationsTable from "./components/ViolationsTable";

const DEMO_METADATA = {
  type: "stl",
  filename: "demo_bracket.stl",
  bounding_box: { x: 128, y: 84, z: 32 },
  volume: 14520.2,
  surface_area: 38210.4,
  faces: 4820,
  vertices: 2514,
  edge_lengths: { min: 0.24, max: 12.8 },
  watertight: true,
};

const DEMO_VALIDATION = {
  design_metadata: DEMO_METADATA,
  relevant_rules: [
    "Minimum wall thickness for injection molded plastic parts is 1.5mm to 4.5mm depending on material",
    "Rib thickness at base should be 50 to 70 percent of nominal wall thickness",
    "All brackets must have minimum 2 mounting points with adequate bolt boss design",
    "Draft angle for vertical walls in molded or cast parts must be at least 1 degree",
    "Minimum clearance between adjacent components in assembly must be 0.5mm",
  ],
  validation: {
    compliance_score: 74,
    summary: "The design is promising for a demo bracket, but wall thickness, edge sharpness, and mounting robustness should be improved before release.",
    violations: [
      {
        id: 1,
        rule: "Minimum wall thickness for injection molded plastic parts is 1.5mm to 4.5mm depending on material",
        severity: "Major",
        finding: "Several thin sections in the bracket are estimated below the recommended molding threshold.",
        recommendation: "Increase nominal wall thickness to at least 1.5mm and keep sections more uniform.",
      },
      {
        id: 2,
        rule: "Sharp edges with radius less than 0.3mm on exterior surfaces must be avoided",
        severity: "Minor",
        finding: "Leading outer edges appear too sharp for assembly-friendly handling.",
        recommendation: "Add edge radii or chamfers above 0.3mm on the exposed perimeter.",
      },
      {
        id: 3,
        rule: "All brackets must have minimum 2 mounting points with adequate bolt boss design",
        severity: "Critical",
        finding: "The current concept concentrates load around a single dominant mounting region.",
        recommendation: "Distribute load with a second mounting point and reinforce the boss geometry.",
      },
    ],
  },
};

function Navbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-white/5 bg-[#0f1117]/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-4 lg:px-6">
        <div>
          <div className="text-xl font-semibold tracking-[0.22em] text-white">CAD-IQ</div>
          <div className="mt-1 text-sm text-[#9ca3af]">AI-Powered Design Validation</div>
        </div>
      </div>
      <div className="h-px bg-[linear-gradient(90deg,transparent,rgba(79,142,247,0.95),transparent)] bg-[length:200%_100%] animate-[shimmer_4s_linear_infinite]" />
    </header>
  );
}

function EmptyResults() {
  return (
    <div className="rounded-3xl border border-[#4f8ef7]/20 bg-[radial-gradient(circle_at_top,_rgba(79,142,247,0.14),_transparent_40%),linear-gradient(180deg,#1a1d27,#151923)] p-10 shadow-[0_18px_60px_rgba(0,0,0,0.3)]">
      <p className="text-xs uppercase tracking-[0.42em] text-[#4f8ef7]">CAD-IQ</p>
      <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight text-white">Upload a part and get an instant automotive design compliance review.</h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-[#9ca3af]">
        The results panel will show the 3D preview, AI validation summary, compliance score, and rule violations after the backend finishes analyzing your file.
      </p>
    </div>
  );
}

function AnalysisSnapshot({ validationResult, designMetadata, violations, summary }) {
  return (
    <div className="rounded-3xl border border-[#4f8ef7]/20 bg-[#1a1d27] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
      <p className="text-xs uppercase tracking-[0.32em] text-[#4f8ef7]">Analysis Snapshot</p>
      <h2 className="mt-3 text-3xl font-semibold text-white">{summary}</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[#4f8ef7]/15 bg-[#0f1117] p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-[#9ca3af]">Violations</p>
          <p className="mt-3 text-3xl font-semibold text-white">{violations.length}</p>
        </div>
        <div className="rounded-2xl border border-[#4f8ef7]/15 bg-[#0f1117] p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-[#9ca3af]">Relevant Rules</p>
          <p className="mt-3 text-3xl font-semibold text-white">{validationResult.relevant_rules?.length ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-[#4f8ef7]/15 bg-[#0f1117] p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-[#9ca3af]">Detected Type</p>
          <p className="mt-3 text-3xl font-semibold capitalize text-white">{designMetadata?.type ?? "unknown"}</p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  const validationResult = analysis?.validationData ?? null;
  const designMetadata = validationResult?.design_metadata ?? analysis?.uploadData ?? null;
  const score = validationResult?.validation?.compliance_score ?? 0;
  const summary = validationResult?.validation?.summary ?? "No validation has been run yet.";
  const violations = validationResult?.validation?.violations ?? [];

  const validationForChat = useMemo(() => validationResult?.validation ?? null, [validationResult]);

  async function runDemoDesign() {
    setSelectedFile(null);
    setAnalysis(null);
    setIsValidating(true);

    try {
      const response = await fetch("http://localhost:8000/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(DEMO_METADATA),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Demo validation is unavailable.");
      }
      setAnalysis({ file: null, uploadData: DEMO_METADATA, validationData: data });
      toast.success("Demo design loaded.");
    } catch (error) {
      setAnalysis({ file: null, uploadData: DEMO_METADATA, validationData: DEMO_VALIDATION });
      toast.error("Live validation unavailable. Showing built-in demo results instead.");
    } finally {
      setIsValidating(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0f1117] text-white">
      <Navbar />
      <div className="mx-auto flex min-h-[calc(100vh-73px)] max-w-[1600px] flex-col gap-6 px-4 py-6 lg:flex-row lg:px-6">
        <aside className="flex w-full flex-col gap-6 lg:w-[30%]">
          <div className="rounded-3xl border border-[#4f8ef7]/20 bg-[#1a1d27] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
            <p className="text-xs uppercase tracking-[0.42em] text-[#4f8ef7]">CAD-IQ Console</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Automotive CAD intelligence for faster design validation.</h1>
            <p className="mt-4 text-sm leading-6 text-[#9ca3af]">
              Upload geometry or reference images, trigger backend validation, inspect findings, and ask context-aware follow-up questions.
            </p>
            <button
              type="button"
              onClick={runDemoDesign}
              disabled={isValidating}
              className="mt-5 rounded-2xl border border-[#4f8ef7]/40 bg-[#4f8ef7]/12 px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#4f8ef7]/22 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-[#9ca3af]"
            >
              {isValidating ? "Loading Demo..." : "Load Demo Design"}
            </button>
          </div>

          <FileUpload
            isProcessing={isValidating}
            onValidationStateChange={setIsValidating}
            onValidationStart={(file) => {
              setSelectedFile(file);
              setAnalysis(null);
            }}
            onValidationComplete={(result) => {
              setAnalysis(result);
              if (!result) {
                setSelectedFile(null);
              }
            }}
          />

          <ChatSidebar designMetadata={designMetadata} validationResult={validationForChat} />
        </aside>

        <section className="flex w-full flex-col gap-6 lg:w-[70%]">
          <ModelViewer file={selectedFile} />

          {validationResult || isValidating ? (
            <>
              <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
                <ScoreGauge score={score} isLoading={isValidating} />
                {isValidating ? (
                  <div className="rounded-3xl border border-[#4f8ef7]/20 bg-[#1a1d27] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
                    <div className="h-4 w-36 animate-pulse rounded-full bg-[#253047]" />
                    <div className="mt-4 h-10 w-3/4 animate-pulse rounded-2xl bg-[#253047]" />
                    <div className="mt-6 flex items-center gap-3 text-sm text-[#4f8ef7]">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#4f8ef7]/30 border-t-[#4f8ef7]" />
                      Analyzing design with AI...
                    </div>
                  </div>
                ) : (
                  <AnalysisSnapshot
                    validationResult={validationResult}
                    designMetadata={designMetadata}
                    violations={violations}
                    summary={summary}
                  />
                )}
              </div>
              <ViolationsTable summary={summary} violations={violations} isLoading={isValidating} />
              <ReportExport validation={validationResult} />
            </>
          ) : (
            <EmptyResults />
          )}
        </section>
      </div>
    </main>
  );
}
