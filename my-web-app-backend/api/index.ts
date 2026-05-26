import type { IncomingMessage, ServerResponse } from "node:http";
import { getServer } from "../src/server";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const server = await getServer();
  return server(req, res);
}
