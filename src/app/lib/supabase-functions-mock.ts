// Mock module for @supabase/functions-js
// This prevents runtime errors when edge functions are not used
// Edge functions are disabled in this project - all logic runs client-side

export class FunctionsClient {
  constructor(url: string, headers?: Record<string, string>) {}

  setAuth(token: string) {
    return this;
  }

  invoke(functionName: string, options?: any) {
    return Promise.resolve({
      data: null,
      error: new Error('Edge functions are disabled in this project')
    });
  }
}

// Export both named and default
export { FunctionsClient as default };
