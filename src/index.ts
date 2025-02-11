import type { Ai } from "@cloudflare/workers-types";
import {
  CloudflareVectorizeStore,
  CloudflareWorkersAIEmbeddings,
} from "@langchain/cloudflare";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { Document } from "langchain/document";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Env } from "./types";

const app = new Hono<{ Bindings: Env }>();

function VectorizeStore(ai: Ai, vectorize: VectorizeIndex) {
  const embeddings = new CloudflareWorkersAIEmbeddings({
    binding: ai,
    modelName: "@cf/baai/bge-base-en-v1.5",
  });
  const store = new CloudflareVectorizeStore(embeddings, {
    index: vectorize,
  });
  return store;
}

app.use("*", cors());
app.get("/", async (c) => {
  const text =
    "2024年の日本シリーズは、横浜DeNAベイスターズ（以下、DeNA）と福岡ソフトバンクホークス（以下、ソフトバンク）による第75回日本選手権シリーズ。";
  const store = VectorizeStore(c.env.AI, c.env.VECTORIZE);
  const results = await store.similaritySearch("どこが優勝した？", 3);

  return c.json(results);
});
type AddText = { addText: string };
function DocsConvertMetadataFlatFormat(docs: Document<Record<string, any>>[]) {
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
app.post("/add", async (c) => {
  const { addText } = await c.req.json<AddText>();
  const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
  const docs = await textSplitter.createDocuments([addText]);
  const convertDocs = DocsConvertMetadataFlatFormat(docs);
  const store = VectorizeStore(c.env.AI, c.env.VECTORIZE);
  await store.addDocuments(convertDocs, {
    ids: convertDocs.map((doc) => doc.metadata.id),
  });

  return c.json({ success: true });
});
type IDS = { ids: string[] };

app.delete("/", async (c) => {
  const { ids } = await c.req.json<IDS>();
  const store = VectorizeStore(c.env.AI, c.env.VECTORIZE);
  await store.delete({ ids: ids });

  return c.json({ success: true });
});
app.delete("/:id", async (c) => {
  const id = await c.req.param("id");
  const store = VectorizeStore(c.env.AI, c.env.VECTORIZE);
  await store.delete({ ids: [id] });

  return c.json({ success: true });
});
export default app;
