import type { Ai } from "@cloudflare/workers-types";
import {
  CloudflareVectorizeStore,
  CloudflareWorkersAIEmbeddings,
} from "@langchain/cloudflare";
import { Hono } from "hono";
import { cors } from "hono/cors";
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
app.get("/add", async (c) => {
  const store = VectorizeStore(c.env.AI, c.env.VECTORIZE);
  await store.addDocuments(
    [
      {
        pageContent:
          "2024年の日本シリーズは、横浜DeNAベイスターズ（以下、DeNA）と福岡ソフトバンクホークス（以下、ソフトバンク）による第75回日本選手権シリーズ",
        metadata: {},
      },
      {
        pageContent: "2024年10月26日に開幕し、11月3日の第6戦まで行われた。",
        metadata: {},
      },
      {
        pageContent:
          "DeNAが4勝2敗でソフトバンクを破り、26年ぶり3度目の日本一に輝いた。",
        metadata: {},
      },
    ],
    { ids: ["id1", "id2", "id3"] }
  );

  return c.json({ success: true });
});
app.get("/delete", async (c) => {
  const store = VectorizeStore(c.env.AI, c.env.VECTORIZE);
  await store.delete({ ids: ["id1", "id2", "id3"] });

  return c.json({ success: true });
});

export default app;
