import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import pdfParse from "pdf-parse";

const uploadDirectory = path.resolve(process.cwd(), "uploads");

const sanitizeText = (value: string) => value.replace(/\s+/g, " ").trim();

type UploadedFilePayload = {
  fileUrl?: string;
  filePath?: string;
  sourceText: string;
};

export const ensureUploadDirectory = async () => {
  await fs.mkdir(uploadDirectory, { recursive: true });
};

const extractSourceText = async (file: Express.Multer.File) => {
  if (file.mimetype === "application/pdf") {
    const parsed = await pdfParse(file.buffer);
    return sanitizeText(parsed.text || "");
  }

  return sanitizeText(file.buffer.toString("utf-8"));
};

export const persistUploadedFile = async (
  file: Express.Multer.File
): Promise<UploadedFilePayload> => {
  return {
    sourceText: (await extractSourceText(file)).slice(0, 12000)
  };
};

export const persistUploadedFileToDisk = async (
  file: Express.Multer.File
): Promise<UploadedFilePayload> => {
  await ensureUploadDirectory();

  const extension =
    path.extname(file.originalname) || (file.mimetype === "application/pdf" ? ".pdf" : ".txt");
  const fileName = `${Date.now()}-${randomUUID()}${extension}`;
  const absolutePath = path.join(uploadDirectory, fileName);

  await fs.writeFile(absolutePath, file.buffer);

  return {
    fileUrl: `/uploads/${fileName}`,
    filePath: absolutePath,
    sourceText: (await extractSourceText(file)).slice(0, 12000)
  };
};
