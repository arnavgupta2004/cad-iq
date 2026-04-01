import { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

const ACCEPTED_EXTENSIONS = [".stl", ".step", ".iges", ".png", ".jpg", ".jpeg", ".stp", ".igs"];

function extensionForFile(file) {
  const parts = file.name.toLowerCase().split(".");
  return parts.length > 1 ? `.${parts.pop()}` : "";
}

export default function FileUpload({ onValidationComplete, onValidationStart, onValidationStateChange, isProcessing }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState("Upload a CAD file or image to validate it against automotive design rules.");
  const [dotCount, setDotCount] = useState(0);

  const accept = useMemo(() => ACCEPTED_EXTENSIONS.join(","), []);

  function setProcessingState(active) {
    onValidationStateChange?.(active);
    if (active) {
      setDotCount((current) => (current + 1) % 4);
    }
  }

  async function processFile(file) {
    const extension = extensionForFile(file);
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      const message = "Could not parse this file format. Try uploading an STL or image.";
      setStatus(message);
      toast.error(message);
      return;
    }

    onValidationStart?.(file);
    setProcessingState(true);
    setStatus(`Uploading ${file.name}...`);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const uploadResponse = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: uploadFormData,
      });

      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok) {
        throw new Error(uploadData.detail || "Could not parse this file format. Try uploading an STL or image.");
      }

      setStatus("Analyzing design with AI...");
      const validateResponse = await fetch("http://localhost:8000/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(uploadData),
      });

      const validationData = await validateResponse.json();
      if (!validateResponse.ok) {
        throw new Error(validationData.detail || "Validation failed. Please try again.");
      }

      onValidationComplete?.({ file, uploadData, validationData });
      setStatus(`Validation complete for ${file.name}.`);
      toast.success("Design validated successfully.");
    } catch (error) {
      onValidationComplete?.(null);
      const message = error.message || "API request failed. Please try again.";
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
          accept={accept}
          className="hidden"
          disabled={isProcessing}
          onChange={(event) => handleFiles(event.target.files)}
        />
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#4f8ef7]/15 text-[#4f8ef7]">
          <span className="text-2xl">+</span>
        </div>
        <h2 className="text-lg font-semibold text-white">Upload CAD File</h2>
        <p className="mt-2 text-sm leading-6 text-[#9ca3af]">
          Drag and drop STL, STEP, IGES, PNG, or JPG files here, or click to browse.
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
        {isProcessing ? "Processing..." : "Choose File"}
      </button>
      <p className="mt-4 text-sm text-[#9ca3af]">{status}</p>
    </section>
  );
}
