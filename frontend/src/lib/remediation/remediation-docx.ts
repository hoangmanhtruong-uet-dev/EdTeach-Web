import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  Packer,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from "docx";
import { saveAs } from "file-saver";
import { RemediationSheetData } from "./remediation-store";

function cleanMath(text: string): string {
  if (!text) return "";
  return text.replace(/\$\$/g, " ").replace(/\$/g, " ");
}

export async function exportRemediationToDocx(
  sheet: RemediationSheetData,
  includeSolutions = true
) {
  const tutorName = sheet.customBranding?.tutorName || "Thầy/Cô EduTest";
  const tutorPhone = sheet.customBranding?.phone || "";
  const centerName = sheet.customBranding?.centerName || "Hệ Thống Khảo Thí Tutor OS";

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              bottom: 1000,
              left: 1200,
              right: 1200,
            },
          },
        },
        children: [
          // 1. Header Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.SINGLE, size: 8, color: "CCCCCC" },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: centerName.toUpperCase(),
                            bold: true,
                            size: 20,
                            font: "Times New Roman",
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `Lớp: ${sheet.className || sheet.grade} · Môn: ${sheet.subject}`,
                            italics: true,
                            size: 18,
                            font: "Times New Roman",
                          }),
                        ],
                      }),
                      ...(tutorPhone
                        ? [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: `Hotline: ${tutorPhone}`,
                                  size: 16,
                                  font: "Times New Roman",
                                }),
                              ],
                            }),
                          ]
                        : []),
                    ],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [
                          new TextRun({
                            text: "PHIẾU CỦNG CỐ KIẾN THỨC",
                            bold: true,
                            size: 20,
                            color: "D97706",
                            font: "Times New Roman",
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [
                          new TextRun({
                            text: `Học sinh: ${sheet.studentName}`,
                            bold: true,
                            size: 20,
                            font: "Times New Roman",
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [
                          new TextRun({
                            text: `Mã phiếu: #${sheet.token}`,
                            italics: true,
                            size: 16,
                            color: "666666",
                            font: "Times New Roman",
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // Empty space
          new Paragraph({ text: "" }),

          // Banner Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `BÀI TẬP LUYỆN BÙ LỖ HỔNG — ${sheet.examTitle.toUpperCase()}`,
                bold: true,
                size: 24,
                font: "Times New Roman",
              }),
            ],
          }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `(Hệ thống tự động sinh các câu hỏi đồng dạng số đẹp khắc phục các lỗi sai của em)`,
                italics: true,
                size: 18,
                color: "555555",
                font: "Times New Roman",
              }),
            ],
          }),

          new Paragraph({ text: "" }),

          // Questions List
          ...sheet.clonedQuestions.flatMap((q, idx) => {
            const paragraphs = [];

            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Câu ${idx + 1} [Tương tự Câu ${q.originalQuestionNumber} đề gốc - ${q.cognitiveLabel}]: `,
                    bold: true,
                    size: 22,
                    font: "Times New Roman",
                  }),
                  new TextRun({
                    text: cleanMath(q.content.replace(/^\[Tương tự Câu \d+ đề kiểm tra\]\s*/, "")),
                    size: 22,
                    font: "Times New Roman",
                  }),
                ],
              })
            );

            // Options
            if (q.options) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: "  A. ", bold: true, size: 20, font: "Times New Roman" }),
                    new TextRun({ text: `${cleanMath(q.options.A)}     `, size: 20, font: "Times New Roman" }),
                    new TextRun({ text: "  B. ", bold: true, size: 20, font: "Times New Roman" }),
                    new TextRun({ text: `${cleanMath(q.options.B)}`, size: 20, font: "Times New Roman" }),
                  ],
                })
              );
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: "  C. ", bold: true, size: 20, font: "Times New Roman" }),
                    new TextRun({ text: `${cleanMath(q.options.C)}     `, size: 20, font: "Times New Roman" }),
                    new TextRun({ text: "  D. ", bold: true, size: 20, font: "Times New Roman" }),
                    new TextRun({ text: `${cleanMath(q.options.D)}`, size: 20, font: "Times New Roman" }),
                  ],
                })
              );
            }

            // Solutions section if enabled
            if (includeSolutions) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `👉 Đáp án đúng: ${q.correctAnswer}`,
                      bold: true,
                      color: "059669",
                      size: 20,
                      font: "Times New Roman",
                    }),
                  ],
                })
              );
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Lời giải chi tiết: ${cleanMath(q.explanation)}`,
                      italics: true,
                      size: 18,
                      color: "333333",
                      font: "Times New Roman",
                    }),
                  ],
                })
              );
              if (q.casioTip) {
                paragraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Mẹo Casio fx-580: ${cleanMath(q.casioTip)}`,
                        bold: true,
                        size: 18,
                        color: "7C3AED",
                        font: "Times New Roman",
                      }),
                    ],
                  }),
                  new Paragraph({ text: "" })
                );
              }
            } else {
              paragraphs.push(new Paragraph({ text: "" }));
            }

            return paragraphs;
          }),

          // Footer
          new Paragraph({ text: "" }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `--- BẢN QUYỀN THUỘC VỀ ${tutorName.toUpperCase()} · PHÁT HÀNH QUA EDUTEST TUTOR OS ---`,
                italics: true,
                size: 16,
                color: "888888",
                font: "Times New Roman",
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeFilename = `Phieu_Luyen_Bu_${sheet.studentName.replace(/\s+/g, "_")}_${sheet.token}.docx`;
  saveAs(blob, safeFilename);
}
