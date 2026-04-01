import { useState } from "react";

import ChatSidebar from "./components/ChatSidebar";
import FileUpload from "./components/FileUpload";
import ModelViewer from "./components/ModelViewer";
import ReportExport from "./components/ReportExport";
import ScoreGauge from "./components/ScoreGauge";
import ViolationsTable from "./components/ViolationsTable";

function EmptyResults() {
  return (
    <div className="rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-10 shadow-[0_18px_60px_rgba(0,0,0,0.3)]">
      <p className="text-xs uppercase tracking-[0.42em] text-cyan-200">CAD-IQ</p>
      <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight text-white">Upload a part and get an instant automotive design compliance review.</h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400">
        The results panel will show the 3D preview, AI validation summary, compliance score, and rule violations after the backend finishes analyzing your file.
      </p>
    </div>
  );
}

export default function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  const validationResult = analysis?.validationData ?? null;
  const designMetadata = validationResult?.design_metadata ?? analysis?.uploadData ?? null;
  const score = validationResult?.validation?.compliance_score ?? 0;
  const summary = validationResult?.validation?.summary ?? "No validation has been run yet.";
  const violations = validationResult?.validation?.violations ?? [];

  return (
    <main className="min-h-screen bg-[#0f1117] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-6 px-4 py-6 lg:flex-row lg:px-6">
        <aside className="flex w-full flex-col gap-6 lg:w-[30%]">
          <div>
            <p className="text-xs uppercase tracking-[0.42em] text-cyan-200">CAD-IQ Console</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Automotive CAD intelligence for faster design validation.</h1>
            <p className="mt-4 text-sm leading-6 text-slate-400">
              Upload geometry or reference images, trigger backend validation, inspect findings, and ask context-aware follow-up questions.
            </p>
          </div>

          <FileUpload
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

          <ChatSidebar designMetadata={designMetadata} validationResult={validationResult?.validation ?? null} />
        </aside>

        <section className="flex w-full flex-col gap-6 lg:w-[70%]">
          <ModelViewer file={selectedFile} />

          {validationResult ? (
            <>
              <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
                <ScoreGauge score={score} />
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.32em] text-cyan-200">Analysis Snapshot</p>
                  <h2 className="mt-3 text-3xl font-semibold text-white">{summary}</h2>
                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-[#111722] p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Violations</p>
                      <p className="mt-3 text-3xl font-semibold text-white">{violations.length}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-[#111722] p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Relevant Rules</p>
                      <p className="mt-3 text-3xl font-semibold text-white">{validationResult.relevant_rules?.length ?? 0}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-[#111722] p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Detected Type</p>
                      <p className="mt-3 text-3xl font-semibold capitalize text-white">{designMetadata?.type ?? "unknown"}</p>
                    </div>
                  </div>
                </div>
              </div>
              <ViolationsTable summary={summary} violations={violations} />
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
