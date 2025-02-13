import { Document } from "langchain/document";

export function DocsConvertMetadataFlatFormat(
  docs: Document<Record<string, any>>[]
) {
  const convertDocs = docs.map((doc, index) => ({
    ...doc,
    metadata: {
      source: String(doc.metadata.source || ""),
      timestamp: Date.now(),
      id: `doc_${Date.now()}_${index}`,
    },
  }));

  return convertDocs;
}
