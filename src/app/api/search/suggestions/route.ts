import { resolvePublicMockRequest } from "../../../../mocks/runtime-public";

export function GET(request: Request): Response {
  return resolvePublicMockRequest(request);
}
