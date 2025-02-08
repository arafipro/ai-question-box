import type { Ai, VectorizeIndex } from "@cloudflare/workers-types";
import { CloudflareWorkersAIEmbeddings } from "@langchain/cloudflare";
import { Hono } from "hono";
import { cors } from "hono/cors";

type Env = {
  AI: Ai;
  VECTORIZE: VectorizeIndex;
};

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());
app.get("/", async (c) => {
  const text =
    "2024年の日本シリーズは、横浜DeNAベイスターズ（以下、DeNA）と福岡ソフトバンクホークス（以下、ソフトバンク）による第75回日本選手権シリーズ。";
  const embeddings = new CloudflareWorkersAIEmbeddings({
    binding: c.env.AI,
    modelName: "@cf/baai/bge-base-en-v1.5",
  });
  const VectorizeData = await embeddings.embedQuery(text);

  return c.json(VectorizeData);
});

export default app;
