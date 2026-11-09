import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from "docx";
import { saveAs } from "file-saver";
import { MarketplaceItem } from "@/types/marketplace";

export async function exportMarketplaceExamToDocx(exam: MarketplaceItem) {
  const questions = exam.exam_data?.questions || exam.preview_data.sample_questions || [];

  const children: any[] = [
    // Header
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "BỘ GIÁO DỤC VÀ ĐÀO TẠO - ĐỀ THI CHUẨN MA TRẬN 2025",
          bold: true,
          size: 22,
        }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: exam.title.toUpperCase(),
          bold: true,
          size: 26,
        }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Môn: ${exam.subject} - Khối: ${exam.grade} | Tác giả: ${exam.seller_name} (${exam.seller_tier.toUpperCase()})`,
          italics: true,
          size: 20,
        }),
      ],
      spacing: { after: 300 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      text: "--------------------------------------------------------------------------------",
      spacing: { after: 300 },
    }),

    // Bảng ma trận đề thi
    new Paragraph({
      children: [
        new TextRun({
          text: "I. MA TRẬN CẤU TRÚC ĐỀ THI",
          bold: true,
          size: 22,
        }),
      ],
      spacing: { after: 150 },
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: "Tổng số câu", alignment: AlignmentType.CENTER })],
              width: { size: 25, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph({ text: "Trắc nghiệm 4 lựa chọn", alignment: AlignmentType.CENTER })],
              width: { size: 25, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph({ text: "Trắc nghiệm Đúng/Sai", alignment: AlignmentType.CENTER })],
              width: { size: 25, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph({ text: "Trả lời ngắn / Tự luận", alignment: AlignmentType.CENTER })],
              width: { size: 25, type: WidthType.PERCENTAGE },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  text: `${exam.question_count} câu`,
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  text: `${exam.preview_data.matrix.multiple_choice_count} câu`,
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  text: `${exam.preview_data.matrix.true_false_count} câu`,
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  text: `${exam.preview_data.matrix.short_answer_count} câu`,
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
          ],
        }),
      ],
    }),

    new Paragraph({
      text: "",
      spacing: { after: 300 },
    }),

    // Danh sách câu hỏi
    new Paragraph({
      children: [
        new TextRun({
          text: "II. NỘI DUNG ĐỀ THI",
          bold: true,
          size: 22,
        }),
      ],
      spacing: { after: 200 },
    }),
  ];

  // Render từng câu hỏi
  questions.forEach((q: any, idx: number) => {
    const qNum = idx + 1;
    const qRuns = [
      new TextRun({ text: `Câu ${qNum}: `, bold: true }),
      new TextRun({ text: q.content }),
    ];

    children.push(
      new Paragraph({
        children: qRuns,
        spacing: { after: 120 },
      })
    );

    if (Array.isArray(q.options) && q.options.length > 0) {
      q.options.forEach((opt: string) => {
        children.push(
          new Paragraph({
            text: `    ${opt}`,
            spacing: { after: 80 },
          })
        );
      });
    }

    children.push(
      new Paragraph({
        text: "",
        spacing: { after: 100 },
      })
    );
  });

  // Hướng dẫn giải chi tiết (nếu có exam_data)
  if (exam.exam_data?.questions && exam.exam_data.questions.length > 0) {
    children.push(
      new Paragraph({
        text: "--------------------------------------------------------------------------------",
        alignment: AlignmentType.CENTER,
        spacing: { before: 300, after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "III. BẢNG ĐÁP ÁN & HƯỚNG DẪN GIẢI CHI TIẾT",
            bold: true,
            size: 22,
          }),
        ],
        spacing: { after: 200 },
      })
    );

    exam.exam_data.questions.forEach((q: any, idx: number) => {
      const qNum = idx + 1;
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Câu ${qNum} - Đáp án: `, bold: true }),
            new TextRun({ text: `${q.correct_answer || "Đang cập nhật"}`, bold: true, color: "008000" }),
          ],
          spacing: { after: 80 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Lời giải chi tiết: ", italics: true, bold: true }),
            new TextRun({ text: q.explanation || "Xem lời giải từng bước trong Studio." }),
          ],
          spacing: { after: 200 },
        })
      );
    });
  }

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      text: "--- HẾT ---",
      spacing: { before: 400 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Được tạo bởi Nền tảng EduTest - Thư viện đề thi chia sẻ uy tín cho Giáo viên`,
          italics: true,
          size: 18,
          color: "666666",
        }),
      ],
      spacing: { before: 100 },
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const cleanTitle = exam.title.replace(/[\\/:*?"<>|]/g, "_").slice(0, 50);
  saveAs(blob, `${cleanTitle}_${exam.subject}_Lop${exam.grade}.docx`);
}

