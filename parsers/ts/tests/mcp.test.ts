import { describe, expect, it } from "vitest";
import { handleRequest } from "../src/mcp";

describe("ProductSpec MCP server", () => {
  it("advertises ProductSpec tools", () => {
    const response = handleRequest({ jsonrpc: "2.0", id: 1, method: "tools/list" });

    expect(response).toMatchObject({
      jsonrpc: "2.0",
      id: 1,
      result: {
        tools: expect.arrayContaining([
          expect.objectContaining({ name: "begin_spec_session" }),
          expect.objectContaining({ name: "check_spec_session" }),
          expect.objectContaining({ name: "list_product_specs" }),
          expect.objectContaining({ name: "get_acceptance_criteria" }),
          expect.objectContaining({ name: "get_spec_graph" }),
          expect.objectContaining({ name: "check_completion_claim" })
        ])
      }
    });
  });

  it("reports unknown methods as JSON-RPC errors", () => {
    expect(handleRequest({ jsonrpc: "2.0", id: 2, method: "missing/method" })).toEqual({
      jsonrpc: "2.0",
      id: 2,
      error: { code: -32601, message: "Unknown method: missing/method" }
    });
  });

  it("does not respond to notifications (requests without an id)", () => {
    expect(handleRequest({ jsonrpc: "2.0", method: "notifications/cancelled" })).toBeNull();
    expect(handleRequest({ jsonrpc: "2.0", method: "notifications/initialized" })).toBeNull();
  });

  it("reports an unknown tool as method-not-found", () => {
    expect(
      handleRequest({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "nope", arguments: {} } })
    ).toEqual({
      jsonrpc: "2.0",
      id: 3,
      error: { code: -32601, message: "Unknown tool: nope" }
    });
  });
});
