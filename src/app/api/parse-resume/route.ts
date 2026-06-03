import { NextResponse } from "next/server";
import PDFParser from "pdf2json";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const runtime = "nodejs";

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}

function parsePdfText(buffer: Buffer) {
  return new Promise<string>((resolve, reject) => {
    const parser = new PDFParser(null, true);

    parser.on("pdfParser_dataError", (error) => {
      parser.destroy();

      if (error instanceof Error) {
        reject(error);
        return;
      }

      reject(error.parserError);
    });

    parser.on("pdfParser_dataReady", () => {
      const text = parser.getRawTextContent().trim();
      parser.destroy();
      resolve(text);
    });

    parser.parseBuffer(buffer);
  });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return errorResponse("Please upload a PDF resume.", 400);
    }

    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      return errorResponse("Only PDF files are accepted.", 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return errorResponse("Resume must be 5MB or smaller.", 400);
    }

    if (file.size === 0) {
      return errorResponse("Uploaded PDF is empty.", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await parsePdfText(buffer);

    if (!text) {
      return errorResponse("No readable text was found in this PDF.", 400);
    }

    return NextResponse.json({
      success: true,
      text,
    });
  } catch (error) {
    console.error("Resume parsing failed:", error);

    return errorResponse("Unable to parse this PDF. Please try another file.", 500);
  }
}
