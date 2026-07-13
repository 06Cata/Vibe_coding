import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument } from "pdf-lib";

const DEFAULT_TARGET = "ig/aws-saa";
const DEFAULT_CHUNK_SIZE = 160;
const SPLIT_FILE_PATTERN = /_\d+\.pdf$/i;

type PdfTarget = {
  inputPath: string;
  outputDirectory: string;
};

function parseChunkSize(value: string | undefined) {
  if (!value) {
    return DEFAULT_CHUNK_SIZE;
  }

  const chunkSize = Number(value);

  if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
    throw new Error("Page chunk size must be a positive integer.");
  }

  return chunkSize;
}

function isPdfFile(filePath: string) {
  return path.extname(filePath).toLowerCase() === ".pdf";
}

function isGeneratedSplitFile(filePath: string) {
  return SPLIT_FILE_PATTERN.test(path.basename(filePath));
}

async function getPdfTargets(targetPath: string): Promise<PdfTarget[]> {
  const stats = await stat(targetPath);

  if (stats.isFile()) {
    if (!isPdfFile(targetPath)) {
      throw new Error(`Target file is not a PDF: ${targetPath}`);
    }

    return [
      {
        inputPath: targetPath,
        outputDirectory: path.dirname(targetPath),
      },
    ];
  }

  if (!stats.isDirectory()) {
    throw new Error(`Target is neither a PDF file nor a directory: ${targetPath}`);
  }

  const entries = await readdir(targetPath, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(targetPath, entry.name))
    .filter((filePath) => isPdfFile(filePath) && !isGeneratedSplitFile(filePath))
    .map((inputPath) => ({
      inputPath,
      outputDirectory: targetPath,
    }));
}

function getOutputPath(inputPath: string, outputDirectory: string, index: number) {
  const extension = path.extname(inputPath);
  const baseName = path.basename(inputPath, extension);

  return path.join(outputDirectory, `${baseName}_${index}${extension}`);
}

async function splitPdf(target: PdfTarget, chunkSize: number) {
  const sourceBytes = await readFile(target.inputPath);
  const sourcePdf = await PDFDocument.load(sourceBytes);
  const pageCount = sourcePdf.getPageCount();
  const fileName = path.basename(target.inputPath);

  if (pageCount <= chunkSize) {
    console.info(`Skipped ${fileName}: ${pageCount} pages does not exceed ${chunkSize}.`);
    return;
  }

  await mkdir(target.outputDirectory, { recursive: true });

  const splitCount = Math.ceil(pageCount / chunkSize);

  for (let splitIndex = 0; splitIndex < splitCount; splitIndex += 1) {
    const startPage = splitIndex * chunkSize;
    const endPage = Math.min(startPage + chunkSize, pageCount);
    const outputPdf = await PDFDocument.create();
    const pageIndexes = Array.from(
      { length: endPage - startPage },
      (_, pageOffset) => startPage + pageOffset,
    );
    const copiedPages = await outputPdf.copyPages(sourcePdf, pageIndexes);

    copiedPages.forEach((page) => outputPdf.addPage(page));

    const outputBytes = await outputPdf.save();
    const outputPath = getOutputPath(target.inputPath, target.outputDirectory, splitIndex + 1);

    await writeFile(outputPath, outputBytes);
    console.info(`Created ${outputPath} (${startPage + 1}-${endPage}).`);
  }
}

async function main() {
  const targetPath = process.argv[2] ?? DEFAULT_TARGET;
  const chunkSize = parseChunkSize(process.argv[3]);
  const targets = await getPdfTargets(targetPath);

  if (targets.length === 0) {
    throw new Error(`No PDF files found in: ${targetPath}`);
  }

  for (const target of targets) {
    await splitPdf(target, chunkSize);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error while splitting PDFs.";
  console.error(message);
  process.exit(1);
});
