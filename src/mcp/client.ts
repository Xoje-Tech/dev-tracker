export class McpClient {
  constructor(private baseUrl: string, private apiKey: string) {}

  private async request(path: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        "x-api-key": this.apiKey,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorBody: any = await response.json().catch(() => ({}));
      let msg = errorBody.error || response.statusText || "HTTP Error";
      if (errorBody.error === "Validation failed" && errorBody.details) {
        const issues = Object.entries(errorBody.details)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : String(msgs)}`)
          .join("\n");
        msg = `Validation failed:\n${issues}`;
      }
      throw new Error(msg);
    }

    return response.json();
  }

  async get(path: string) {
    return this.request(path);
  }

  async post(path: string, body: any) {
    return this.request(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async put(path: string, body?: any) {
    return this.request(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch(path: string, body: any) {
    return this.request(path, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  async delete(path: string) {
    return this.request(path, {
      method: "DELETE",
    });
  }
}
