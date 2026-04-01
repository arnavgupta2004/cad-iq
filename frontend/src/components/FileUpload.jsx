import { useMemo, useRef, useState } from "react";

const ACCEPTED_EXTENSIONS = [".stl", ".step", ".iges", ".png", ".jpg", ".jpeg", ".stp", ".igs"];

function extensionForFile(file) {
  const parts = file.name.toLowerCase().split(".");
  return parts.length > 1 ? `.${parts.pop()}` : "";
}

export default function FileUpload({ onValidationComplete, onValidationStart }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("Upload a CAD file or image to validate it against automotive design rules.");

  const accept = useMemo(() => ACCEPTED_EXTENSIONS.join(","), []);

  async function processFile(file) {
    const extension = extensionForFile(file);
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setStatus("Unsupported file type. Please upload STL, STEP, IGES, PNG, or JPG.");
      return;
    }

    setIsLoading(true);
    onValidationStart?.(file);
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
        throw new Error(uploadData.detail || "Upload failed");
      }

      setStatus("Running AI validation...");
      const validateResponse = await fetch("http://localhost:8000/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(uploadData),
      });

      const validationData = await validateResponse.json();
      if (!validateResponse.ok) {
        throw new Error(validationData.detail || "Validation failed");
      }

      onValidationComplete?.({ file, uploadData, validationData });
      setStatus(`Validation complete for ${file.name}.`);
    } catch (error) {
      onValidationComplete?.(null);
      setStatus(error.message || "Something went wrong while validating the file.");
    } finally {
      setIsLoading(false);
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
    handleFiles(event.dataTransfer.files);
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur">
      <div
        className={`relative rounded-2xl border border-dashed px-5 py-10 text-center transition ${
          isDragging ? "border-cyan-400 bg-cyan-400/10" : "border-white/15 bg-[#141923]"
        } ${isLoading ? "pointer-events-none opacity-75" : "cursor-pointer hover:border-cyan-300/70 hover:bg-[#181f2c]"}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-200">
          <span className="text-2xl">+</span>
        </div>
        <h2 className="text-lg font-semibold text-white">Upload CAD File</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Drag and drop STL, STEP, IGES, PNG, or JPG files here, or click to browse.
        </p>
        {isLoading ? (
          <div className="mt-6 flex items-center justify-center gap-3 text-sm text-cyan-200">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-200/30 border-t-cyan-200" />
            Processing design...
          </div>
        ) : null}
      </div>
      <p className="mt-4 text-sm text-slate-300">{status}</p>
    </section>
  );
}
