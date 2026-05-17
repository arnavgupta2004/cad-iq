import { useRef, useState } from "react";
import toast from "react-hot-toast";

import { STL_EXTENSION, isStlFile, validateStlFile } from "../lib/validateStl";

export default function FileUpload({ onValidationComplete, onValidationStart, onValidationStateChange, isProcessing }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState("Upload an STL mesh to extract geometry and run a full compliance analysis.");
  const [dotCount, setDotCount] = useState(0);

  function setProcessingState(active) {
    onValidationStateChange?.(active);
    if (active) {
      setDotCount((current) => (current + 1) % 4);
    }
  }

  async function processFile(file) {
    if (!isStlFile(file)) {
      const message = "Only STL files are supported. Export your CAD model as STL and try again.";
      setStatus(message);
      toast.error(message);
      return;
    }

    onValidationStart?.(file);
    setProcessingState(true);
    setStatus(`Uploading ${file.name}...`);

    try {
      setStatus("Extracting mesh geometry...");
      const result = await validateStlFile(file);
      setStatus("Analyzing design with AI...");
      onValidationComplete?.(result);
      setStatus(`Validation complete for ${file.name}.`);
      toast.success("Design validated successfully.");
    } catch (error) {
      onValidationComplete?.(null);
      const message = error.message || "Validation failed. Please try again.";
      setStatus(message);
      toast.error(message);
    } finally {
      setProcessingState(false);
    }
  }

  function handleFiles(fileList) {
    const [file] = Array.from(fileList || []);
    if (file) {
      processFile(file);
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    if (!isProcessing) {
      handleFiles(event.dataTransfer.files);
    }
  }

  return (
    <section className="rounded-3xl border border-[#4f8ef7]/20 bg-[#1a1d27] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
      <div
        className={`relative rounded-2xl border border-dashed px-5 py-10 text-center transition ${
          isDragging ? "border-[#4f8ef7] bg-[#4f8ef7]/10" : "border-[#4f8ef7]/30 bg-[#0f1117]"
        } ${isProcessing ? "pointer-events-none opacity-70" : "cursor-pointer hover:border-[#4f8ef7] hover:bg-[#151925]"}`}
        onClick={() => {
          if (!isProcessing) {
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!isProcessing) {
            setIsDragging(true);
          }
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={STL_EXTENSION}
          className="hidden"
          disabled={isProcessing}
          onChange={(event) => handleFiles(event.target.files)}
        />
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#4f8ef7]/15 text-[#4f8ef7]">
          <span className="text-2xl">+</span>
        </div>
        <h2 className="text-lg font-semibold text-white">Upload STL Mesh</h2>
        <p className="mt-2 text-sm leading-6 text-[#9ca3af]">
          Drag and drop an STL file here, or click to browse. Geometry preview, compliance score, findings, and chat all
          run on real mesh data.
        </p>
        {isProcessing ? (
          <div className="mt-6 flex items-center justify-center gap-3 text-sm text-[#4f8ef7]">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#4f8ef7]/30 border-t-[#4f8ef7]" />
            Analyzing design with AI{".".repeat(dotCount + 1)}
          </div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isProcessing}
        className="mt-4 w-full rounded-2xl border border-[#4f8ef7]/40 bg-[#4f8ef7] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#6aa0f8] disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-700 disabled:text-[#9ca3af]"
      >
        {isProcessing ? "Processing..." : "Choose STL File"}
      </button>
      <p className="mt-4 text-sm text-[#9ca3af]">{status}</p>
    </section>
  );
}
