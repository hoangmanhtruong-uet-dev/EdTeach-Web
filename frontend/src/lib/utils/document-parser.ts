/**
 * Trích xuất văn bản thật từ các định dạng tệp tài liệu:
 * - .txt, .md (plain text)
 * - .docx (sử dụng mammoth)
 * - .pdf (sử dụng unpdf)
 */

export interface ParsedDocumentResult {
  text: string;
  charCount: number;
  wordCount: number;
  format: "txt" | "md" | "docx" | "pdf" | "unknown";
  error?: string;
}

export async function parseDocumentFile(file: File): Promise<ParsedDocumentResult> {
  const filename = file.name.toLowerCase();

  // 1. Plain text / Markdown
  if (filename.endsWith(".txt") || filename.endsWith(".md") || file.type.startsWith("text/")) {
    try {
      const text = await file.text();
      return {
        text,
        charCount: text.length,
        wordCount: text.trim() ? text.trim().split(/\s+/).length : 0,
        format: filename.endsWith(".md") ? "md" : "txt",
      };
    } catch (err: any) {
      return {
        text: "",
        charCount: 0,
        wordCount: 0,
        format: "txt",
        error: "Không thể đọc tệp văn bản: " + (err.message || String(err)),
      };
    }
  }

  // 2. DOCX Word Document
  if (filename.endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value || "";
      return {
        text,
        charCount: text.length,
        wordCount: text.trim() ? text.trim().split(/\s+/).length : 0,
        format: "docx",
      };
    } catch (err: any) {
      console.error("DOCX parsing error:", err);
      return {
        text: `[Tài liệu DOCX: ${file.name}]`,
        charCount: 0,
        wordCount: 0,
        format: "docx",
        error: "Không thể phân tích tệp DOCX: " + (err.message || String(err)),
      };
    }
  }

  // 3. PDF Document
  if (filename.endsWith(".pdf") || file.type === "application/pdf") {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const { extractText } = await import("unpdf");
      const { text } = await extractText(new Uint8Array(arrayBuffer));
      const extractedText = Array.isArray(text) ? text.join("\n\n") : (text || "");
      return {
        text: extractedText,
        charCount: extractedText.length,
        wordCount: extractedText.trim() ? extractedText.trim().split(/\s+/).length : 0,
        format: "pdf",
      };
    } catch (err: any) {
      console.error("PDF parsing error:", err);
      return {
        text: `[Tài liệu PDF: ${file.name}]`,
        charCount: 0,
        wordCount: 0,
        format: "pdf",
        error: "Không thể trích xuất văn bản từ PDF: " + (err.message || String(err)),
      };
    }
  }

  return {
    text: "",
    charCount: 0,
    wordCount: 0,
    format: "unknown",
    error: "Định dạng tệp không được hỗ trợ. Vui lòng tải lên file .txt, .md, .docx hoặc .pdf.",
  };
}
