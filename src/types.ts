import type { Ai, VectorizeIndex } from "@cloudflare/workers-types";

export type Env = {
  AI: Ai;
  VECTORIZE: VectorizeIndex;
};
export type AddText = { addText: string };
export type IDS = { ids: string[] };
