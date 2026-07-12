import { createInterface } from "node:readline";
import {
  checkCompletionClaim,
  getAcceptanceCriteria,
  getAiEvals,
  getProductSpec,
  getRelatedArtifacts,
  getScope,
  getSuccessMetrics,
  listProductSpecs,
  validateProductSpec
} from "./mcp-tools.js";

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: unknown;
};

type ToolHandler = (args: Record<string, unknown>) => unknown;

const tools: Record<string, { description: string; inputSchema: object; handler: ToolHandler }> = {
  list_product_specs: {
    description: "List .product-spec.md files under a root directory.",
    inputSchema: objectSchema({ root: stringProperty("Root directory. Defaults to current working directory.") }),
    handler: (args) => listProductSpecs({ root: optionalString(args.root) })
  },
  get_product_spec: {
    description: "Return a parsed Product Spec document.",
    inputSchema: specPathSchema(),
    handler: (args) => getProductSpec(specPathArgs(args))
  },
  validate_product_spec: {
    description: "Validate a Product Spec file.",
    inputSchema: specPathSchema(),
    handler: (args) => validateProductSpec(specPathArgs(args))
  },
  get_scope: {
    description: "Return the structured Scope block from a Product Spec.",
    inputSchema: specPathSchema(),
    handler: (args) => getScope(specPathArgs(args))
  },
  get_acceptance_criteria: {
    description: "Return Acceptance Criteria from a Product Spec.",
    inputSchema: specPathSchema(),
    handler: (args) => getAcceptanceCriteria(specPathArgs(args))
  },
  get_ai_evals: {
    description: "Return AI Evals from a Product Spec.",
    inputSchema: specPathSchema(),
    handler: (args) => getAiEvals(specPathArgs(args))
  },
  get_success_metrics: {
    description: "Return Success Metrics from a Product Spec.",
    inputSchema: specPathSchema(),
    handler: (args) => getSuccessMetrics(specPathArgs(args))
  },
  get_related_artifacts: {
    description: "Return Related Artifacts from a Product Spec.",
    inputSchema: specPathSchema(),
    handler: (args) => getRelatedArtifacts(specPathArgs(args))
  },
  check_completion_claim: {
    description: "Return the Acceptance Criteria and AI Evals an agent must verify before claiming implementation is complete.",
    inputSchema: objectSchema({
      root: stringProperty("Root directory. Defaults to current working directory."),
      path: requiredStringProperty("Path to a .product-spec.md file."),
      claim: stringProperty("The implementation completion claim to check.")
    }),
    handler: (args) => checkCompletionClaim({
      ...specPathArgs(args),
      claim: optionalString(args.claim)
    })
  }
};

const SERVER_VERSION = "0.13.0";

export function runProductSpecMcpServer() {
  const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });

  rl.on("line", (line) => {
    if (!line.trim()) return;
    try {
      const request = JSON.parse(line) as JsonRpcRequest;
      const response = handleRequest(request);
      if (response) process.stdout.write(`${JSON.stringify(response)}\n`);
    } catch (error) {
      process.stdout.write(`${JSON.stringify(errorResponse(null, -32700, messageFor(error)))}\n`);
    }
  });
}

export function handleRequest(request: JsonRpcRequest) {
  if (!request.method) return errorResponse(request.id ?? null, -32600, "method is required");

  try {
    switch (request.method) {
      case "initialize":
        return resultResponse(request.id, {
          protocolVersion: "2024-11-05",
          serverInfo: { name: "productspec", version: SERVER_VERSION },
          capabilities: { tools: {} }
        });
      case "notifications/initialized":
        return null;
      case "tools/list":
        return resultResponse(request.id, {
          tools: Object.entries(tools).map(([name, tool]) => ({
            name,
            description: tool.description,
            inputSchema: tool.inputSchema
          }))
        });
      case "tools/call":
        return callTool(request);
      default:
        return errorResponse(request.id, -32601, `Unknown method: ${request.method}`);
    }
  } catch (error) {
    return errorResponse(request.id, -32000, messageFor(error));
  }
}

function callTool(request: JsonRpcRequest) {
  const params = asRecord(request.params);
  const name = params.name;
  if (typeof name !== "string") throw new Error("tools/call requires a string name");
  const tool = tools[name];
  if (!tool) throw new Error(`Unknown tool: ${name}`);
  const args = asRecord(params.arguments);
  return resultResponse(request.id, {
    content: [
      {
        type: "text",
        text: JSON.stringify(tool.handler(args), null, 2)
      }
    ]
  });
}

function resultResponse(id: JsonRpcRequest["id"], result: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, result };
}

function errorResponse(id: JsonRpcRequest["id"], code: number, message: string) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}

function specPathArgs(args: Record<string, unknown>) {
  const path = args.path;
  if (typeof path !== "string" || !path.trim()) throw new Error("path is required");
  return { root: optionalString(args.root), path };
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function messageFor(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown MCP error.";
}

function specPathSchema() {
  return objectSchema({
    root: stringProperty("Root directory. Defaults to current working directory."),
    path: requiredStringProperty("Path to a .product-spec.md file.")
  });
}

function objectSchema(properties: Record<string, object>) {
  return {
    type: "object",
    properties,
    additionalProperties: false
  };
}

function stringProperty(description: string) {
  return { type: "string", description };
}

function requiredStringProperty(description: string) {
  return { type: "string", description, minLength: 1 };
}
