/**
 * pdf-proxy.ts
 *
 * Exam-Glow uses a Django backend to proxy PDFs from XtremePapers and GCE Guide
 * because those servers block cross-origin iframe embedding (X-Frame-Options / CORS).
 *
 * StudySphere is pure frontend, so we:
 *  1. Fetch the PDF bytes through a public CORS proxy (allorigins.win)
 *  2. Create a local blob:// URL
 *  3. Render that blob URL in an <iframe> — bypassing all CORS/X-Frame blocks
 *
 * This mirrors exactly what Exam-Glow's PastPaperProxyView and SyllabusPdfView do.
 */

// allorigins.win wraps any URL and returns the raw bytes with permissive CORS headers
const CORS_PROXY = "https://api.allorigins.win/raw?url=";

export async function fetchPdfAsBlob(url: string): Promise<string> {
  const proxyUrl = CORS_PROXY + encodeURIComponent(url);
  const res = await fetch(proxyUrl);
  if (!res.ok) throw new Error(`Proxy fetch failed: ${res.status}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
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
 * Tries years from newest to oldest: 26, 25, 24, 23, 22
 */
export function buildSyllabusUrls(code: string, subjectName: string): string[] {
  const folder = `${subjectName} (${code})`;
  return ["26", "25", "24", "23", "22"].map(
    (yy) =>
      `https://www.gceguide.xyz/Cambridge%20IGCSE/${encodeURIComponent(folder)}/${code}_y${yy}_sy.pdf`
  );
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
