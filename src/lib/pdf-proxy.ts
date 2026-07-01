/**
 * pdf-proxy.ts
 *
 * Exam-Glow uses a Django backend to stream PDFs to bypass X-Frame-Options.
 * StudySphere is pure frontend, so we use Google Docs Viewer instead:
 *   https://docs.google.com/viewer?url=<encoded>&embedded=true
 *
 * Google Docs Viewer fetches the PDF from any public URL and renders it
 * inside an <iframe> — no CORS issues, no X-Frame-Options problems.
 * This is the industry-standard client-side alternative to a proxy server.
 */

const GOOGLE_VIEWER = "https://docs.google.com/viewer?embedded=true&url=";

export function getViewerUrl(pdfUrl: string): string {
  return `/api/pdf-proxy?url=${encodeURIComponent(pdfUrl)}`;
}

/**
 * Build XtremePapers PDF URL — exact same logic as Exam-Glow's CambridgePapersView
 * s_char: 's' = May/June, 'w' = Oct/Nov, 'm' = Feb/Mar
 */
export function buildXtremeUrl(
  code: string,
  folder: string,
  year: string,
  session: string,
  paperNum: string,
  variant: string,
  type: "qp" | "ms"
): string {
  const s = session === "May/June" ? "s" : session === "Oct/Nov" ? "w" : "m";
  const yy = year.slice(-2);
  const filename = `${code}_${s}${yy}_${type}_${paperNum}${variant}.pdf`;
  return `https://papers.xtremepape.rs/CAIE/IGCSE/${encodeURIComponent(folder)}/${filename}`;
}

/**
 * Build GCE Guide syllabus PDF URL — exact same logic as Exam-Glow's SyllabusPdfView._gceguide_urls
 * Returns URLs for years 2026 → 2022 (newest first).
 */
export function buildSyllabusUrls(code: string, subjectName: string): string[] {
  const folder = `${subjectName} (${code})`;
  return ["26", "25", "24", "23", "22"].map(
    (yy) =>
      `https://www.gceguide.xyz/Cambridge%20IGCSE/${encodeURIComponent(folder)}/${code}_y${yy}_sy.pdf`
  );
}

/** Get the viewer URL for the most likely syllabus PDF (tries y25 first) */
export function getSyllabusViewerUrl(code: string, subjectName: string): string {
  const folder = `${subjectName} (${code})`;
  // Use y25 as primary — same year Exam-Glow tries first
  const pdfUrl = `https://www.gceguide.xyz/Cambridge%20IGCSE/${encodeURIComponent(folder)}/${code}_y25_sy.pdf`;
  return getViewerUrl(pdfUrl);
}

/** Same subject name map as Exam-Glow's SyllabusPdfView.SUBJECT_NAMES */
export const SYLLABUS_SUBJECT_NAMES: Record<string, string> = {
  "0610": "Biology",
  "0970": "Biology",
  "0620": "Chemistry",
  "0971": "Chemistry",
  "0625": "Physics",
  "0972": "Physics",
  "0653": "Combined Science",
  "0654": "Co-ordinated Sciences",
  "0580": "Mathematics",
  "0980": "Mathematics",
  "0606": "Additional Mathematics",
  "0607": "International Mathematics",
  "0452": "Accounting",
  "0985": "Accounting",
  "0450": "Business Studies",
  "0986": "Business Studies",
  "0455": "Economics",
  "0987": "Economics",
  "0478": "Computer Science",
  "0984": "Computer Science",
  "0417": "Information and Communication Technology",
  "0983": "Information and Communication Technology",
  "0500": "English - First Language",
  "0990": "English - First Language",
  "0510": "English as a Second Language",
  "0511": "English as a Second Language",
  "0475": "Literature in English",
  "0992": "Literature in English",
  "0460": "Geography",
  "0976": "Geography",
  "0470": "History",
  "0977": "History",
  "0495": "Sociology",
  "0457": "Global Perspectives",
  "0490": "Religious Studies",
  "0448": "Pakistan Studies",
  "0680": "Environmental Management",
  "0266": "Psychology",
  "0520": "French",
  "0525": "German",
  "0530": "Spanish",
  "0400": "Art and Design",
  "0411": "Drama",
  "0410": "Music",
  "0445": "Design and Technology",
  "0413": "Physical Education",
  "0648": "Food and Nutrition",
};

// Keep fetchPdfAsBlob for backwards compat but now just returns a viewer URL
export async function fetchPdfAsBlob(url: string): Promise<string> {
  return getViewerUrl(url);
}
