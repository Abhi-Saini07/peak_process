/**
 * What the apply form accepts as a document: PDF or Word, at most 10 MB.
 * A file must pass all three checks: its extension, its declared MIME type and
 * its first bytes. Pure (Uint8Array, no Node APIs), so the form and the API
 * route run the same rules.
 */

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_UPLOAD_LABEL = "10 MB";

type DocumentKind = { label: string; mimeTypes: readonly string[]; magic: readonly number[] };

const KINDS: Record<string, DocumentKind> = {
  pdf: { label: "PDF", mimeTypes: ["application/pdf"], magic: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  doc: { label: "Word (.doc)", mimeTypes: ["application/msword"], magic: [0xd0, 0xcf, 0x11, 0xe0] }, // OLE2
  docx: {
    label: "Word (.docx)",
    mimeTypes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    magic: [0x50, 0x4b], // PK (zip)
  },
};

/** Some browsers send no type, or a generic one, for Word files on machines
 *  without Office. The extension and the file's own bytes still have to match. */
const GENERIC_MIME_TYPES = ["", "application/octet-stream"];

export const ACCEPTED_DOCUMENT_EXTENSIONS = Object.keys(KINDS).map((ext) => `.${ext}`);
export const ACCEPT_ATTRIBUTE = ACCEPTED_DOCUMENT_EXTENSIONS.join(",");
/** How many leading bytes validateDocument needs. */
export const MAGIC_BYTES_NEEDED = 4;

export type FileFacts = { name: string; type: string; size: number };

export function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

function startsWith(head: Uint8Array, magic: readonly number[]): boolean {
  return magic.every((byte, i) => head[i] === byte);
}

/** Checks a document; `head` is its first bytes (at least MAGIC_BYTES_NEEDED). */
export function validateDocument(
  file: FileFacts,
  head: Uint8Array,
  what = "Your resume",
): { ok: true } | { ok: false; error: string } {
  if (file.size === 0) return { ok: false, error: `${what} is empty. Choose another file.` };
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: `${what} is larger than ${MAX_UPLOAD_LABEL}. Upload a smaller file.` };
  }
  const kind = KINDS[extensionOf(file.name)];
  if (!kind) return { ok: false, error: `${what} must be a PDF or Word file (.pdf, .doc or .docx).` };
  const mime = file.type.toLowerCase();
  if (!kind.mimeTypes.includes(mime) && !GENERIC_MIME_TYPES.includes(mime)) {
    return { ok: false, error: `${what} doesn't look like a ${kind.label} file. Save it as PDF or Word and try again.` };
  }
  if (!startsWith(head, kind.magic)) {
    return { ok: false, error: `${what} doesn't look like a real ${kind.label} file. Save it again as PDF or Word.` };
  }
  return { ok: true };
}
