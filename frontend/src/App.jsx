import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import ChatSidebar from "./components/ChatSidebar";
import FileUpload from "./components/FileUpload";
import ModelViewer from "./components/ModelViewer";
import ReportExport from "./components/ReportExport";
import ScoreGauge from "./components/ScoreGauge";
import ViolationsTable from "./components/ViolationsTable";
import { validateStlFile } from "./lib/validateStl";

const SAMPLE_STL_URL = "/samples/demo_bracket.stl";

function Navbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-white/5 bg-[#0f1117]/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-4 lg:px-6">
        <div>
          <div className="text-xl font-semibold tracking-[0.22em] text-white">CAD-IQ</div>
          <div className="mt-1 text-sm text-[#9ca3af]">AI-Powered STL Design Validation</div>
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
      <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight text-white">
        Upload an STL part for a full automotive design compliance review.
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-[#9ca3af]">
        The results panel shows a 3D mesh preview, extracted geometry metrics, Gemini-powered validation, compliance
        score, structured violations, PDF export, and context-aware engineering chat.
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
          <p className="text-xs uppercase tracking-[0.24em] text-[#9ca3af]">Mesh</p>
          <p className="mt-3 text-3xl font-semibold text-white">{designMetadata?.faces ?? 0} faces</p>
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

  async function runSampleAnalysis() {
    setIsValidating(true);
    setAnalysis(null);

    try {
      const response = await fetch(SAMPLE_STL_URL);
      if (!response.ok) {
        throw new Error("Sample STL is missing from the app bundle.");
      }

      const blob = await response.blob();
      const file = new File([blob], "demo_bracket.stl", { type: "model/stl" });
      setSelectedFile(file);

      const result = await validateStlFile(file);
      setAnalysis(result);
      toast.success("Sample bracket analyzed with live geometry and AI validation.");
    } catch (error) {
      setSelectedFile(null);
      setAnalysis(null);
      toast.error(error.message || "Sample analysis failed. Check that the backend is running.");
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
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
              Automotive CAD intelligence for faster STL validation.
            </h1>
            <p className="mt-4 text-sm leading-6 text-[#9ca3af]">
              Upload an STL mesh to extract real geometry, run rule retrieval and Gemini analysis, inspect findings, and
              ask follow-up engineering questions.
            </p>
            <button
              type="button"
              onClick={runSampleAnalysis}
              disabled={isValidating}
              className="mt-5 rounded-2xl border border-[#4f8ef7]/40 bg-[#4f8ef7]/12 px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#4f8ef7]/22 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-[#9ca3af]"
            >
              {isValidating ? "Analyzing Sample..." : "Analyze Sample Bracket"}
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
                      Extracting geometry and analyzing with AI...
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
