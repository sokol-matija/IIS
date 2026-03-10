const API_URL = import.meta.env.VITE_API_URL || "";

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  createdAt?: string;
  updatedAt?: string;
}

async function authFetch(url: string, token: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return res;
}

export async function getCategories(token: string): Promise<Category[]> {
  const res = await authFetch(`${API_URL}/api/categories`, token);
  const data = await res.json();
  return data.data || [];
}

export async function createCategory(
  token: string,
  cat: { name: string; slug: string; description?: string }
): Promise<Category> {
  const res = await authFetch(`${API_URL}/api/categories`, token, {
    method: "POST",
    body: JSON.stringify(cat),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Create failed");
  }
  const data = await res.json();
  return data.data;
}

export async function updateCategory(
  token: string,
  id: number,
  cat: { name?: string; slug?: string; description?: string }
): Promise<Category> {
  const res = await authFetch(`${API_URL}/api/categories/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(cat),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Update failed");
  }
  const data = await res.json();
  return data.data;
}

export async function deleteCategory(token: string, id: number): Promise<void> {
  const res = await authFetch(`${API_URL}/api/categories/${id}`, token, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Delete failed");
  }
}
