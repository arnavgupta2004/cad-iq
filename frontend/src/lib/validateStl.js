import { apiUrl } from "./api";

export const STL_EXTENSION = ".stl";

export function isStlFile(file) {
  if (!file?.name) {
    return false;
  }
  const parts = file.name.toLowerCase().split(".");
  return parts.length > 1 && `.${parts.pop()}` === STL_EXTENSION;
}

export async function validateStlFile(file) {
  const uploadFormData = new FormData();
  uploadFormData.append("file", file);

  const uploadResponse = await fetch(apiUrl("/upload"), {
    method: "POST",
    body: uploadFormData,
  });

  const uploadData = await uploadResponse.json();
  if (!uploadResponse.ok) {
    throw new Error(uploadData.detail || "Could not parse this STL file.");
  }

  const validateResponse = await fetch(apiUrl("/validate"), {
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

  return { file, uploadData, validationData };
}
