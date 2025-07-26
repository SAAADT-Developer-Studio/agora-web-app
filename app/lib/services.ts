import { config } from "~/config";

async function fetchApi(path: string) {
  const url = new URL(path, config.apiUrl);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  return response.json();
}

type Provider = {
  key: string;
  url: string;
  name: string;
  rank: number;
};

export async function fetchProviders() {
  return (await fetchApi("/providers")) as Provider[];
}
