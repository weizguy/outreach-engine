import { setupServer } from "msw/node";
import { bedrockHandlers, firecrawlHandlers } from "./handlers";

export const server = setupServer(...firecrawlHandlers, ...bedrockHandlers);
