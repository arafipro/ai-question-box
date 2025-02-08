import type { Ai, VectorizeIndex } from "@cloudflare/workers-types";

export type Env = {
  AI: Ai;
  VECTORIZE: VectorizeIndex;
};
