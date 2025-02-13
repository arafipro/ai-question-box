import { Hono } from "hono";
import { cors } from "hono/cors";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { DocsConvertMetadataFlatFormat } from "./lib/docs-convert-metadata-flat-format";
import { VectorizeStore } from "./lib/vectorize-store";
import { AddText, Env, IDS } from "./types";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());
app.get("/:search?/:maxResults?", async (c) => {
  const { search, maxResults } = await c.req.param();
  const store = VectorizeStore(c.env.AI, c.env.VECTORIZE);
  const results = await store.similaritySearch(
    search ?? "",
    parseInt(maxResults ?? "10")
  );

  return c.json(results);
});
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
