"use client";

import { useAuth } from "@/components/auth/AuthProvider";

/**
 * Custom fetch wrapper that handles 401 responses by triggering session expiry
 * This should be used for all API calls from the dashboard
 */
export function useApiClient() {
  const { handleSessionExpired } = useAuth();

  const apiFetch = async (
    url: string,
    options: RequestInit = {},
  ): Promise<Response> => {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    // If 401 Unauthorized, session has expired
    if (response.status === 401) {
      handleSessionExpired();
    }

    return response;
  };

  return { apiFetch };
}

/**
 * Standalone fetch function for use outside React components
 * This version doesn't have access to the auth context, so it just returns the response
 * The caller should check for 401 and handle appropriately
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

/**
 * Helper to check if response indicates session expiry
 */
export function isSessionExpired(response: Response): boolean {
  return response.status === 401;
}
