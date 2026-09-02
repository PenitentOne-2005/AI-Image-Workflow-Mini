const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeoutMs = 25000,
) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === "AbortError") {
      throw new Error("AI API request timed out (25s limit)");
    }
    throw error;
  }
};

export default fetchWithTimeout;
