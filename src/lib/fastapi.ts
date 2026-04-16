export async function callFastAPI(
  endpoint: string,
  options: RequestInit = {}
) {
  const res = await fetch(`${process.env.FASTAPI_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Key": process.env.INTERNAL_AI_KEY!,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    throw new Error("FastAPI request failed");
  }

  return res.json();
}