import { ZodError } from "zod";

export function formatMcpError(message: string, statusCode?: number) {
  const displayMessage = message || "Unknown error occurred";
  const text = statusCode ? `HTTP ${statusCode}: ${displayMessage}` : displayMessage;
  
  return {
    isError: true,
    content: [
      {
        type: "text",
        text
      }
    ]
  };
}

export function formatZodError(error: ZodError) {
  const issues = error.issues
    .map(issue => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
    
  return {
    isError: true,
    content: [
      {
        type: "text",
        text: `Validation failed:\n${issues}`
      }
    ]
  };
}
