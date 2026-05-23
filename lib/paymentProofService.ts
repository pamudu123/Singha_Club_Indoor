import type { DocumentPickerAsset } from "expo-document-picker";
import { requireSupabase } from "./supabase";

const PAYMENT_PROOFS_BUCKET = "payment-proofs";

function cleanFilePart(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

function normalizeProofPath(path: string) {
  return path.replace(/^payment-proofs\//, "");
}

function extensionFromAsset(asset: DocumentPickerAsset) {
  const fromName = asset.name?.split(".").pop();
  if (fromName && fromName !== asset.name) return cleanFilePart(fromName.toLowerCase());
  if (asset.mimeType === "application/pdf") return "pdf";
  if (asset.mimeType === "image/png") return "png";
  return "jpg";
}

export async function uploadPaymentProof(asset: DocumentPickerAsset, bookingReference: string) {
  const extension = extensionFromAsset(asset);
  const fileName = `payment-proof-${Date.now()}.${extension}`;
  const path = `${cleanFilePart(bookingReference)}/${fileName}`;
  const response = await fetch(asset.uri);
  const blob = await response.blob();

  const { data, error } = await requireSupabase().storage
    .from(PAYMENT_PROOFS_BUCKET)
    .upload(path, blob, {
      contentType: asset.mimeType || "application/octet-stream",
      upsert: false
    });

  if (error) throw error;
  return data.path;
}

export async function removePaymentProof(path: string | null | undefined) {
  if (!path) return;
  await requireSupabase().storage.from(PAYMENT_PROOFS_BUCKET).remove([normalizeProofPath(path)]);
}

export async function getPaymentProofUrl(path: string) {
  if (/^https?:\/\//.test(path) || path.startsWith("file://")) return path;
  const normalizedPath = normalizeProofPath(path);
  const { data, error } = await requireSupabase().storage.from(PAYMENT_PROOFS_BUCKET).createSignedUrl(normalizedPath, 60 * 10);
  if (error) throw error;
  return data.signedUrl;
}
