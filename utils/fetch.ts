export interface FetchError extends Error {
  status: number;
}

export async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error(
      "An error occurred while fetching the data."
    ) as FetchError;
    error.message = await res.json();
    error.status = res.status;
    throw error;
  }
  return res.json();
}
