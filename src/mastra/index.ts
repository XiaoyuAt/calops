import { Mastra } from "@mastra/core";
import { calOpsAgent } from "./agents";

export const mastra = new Mastra({
  agents: { calOpsAgent },
});
