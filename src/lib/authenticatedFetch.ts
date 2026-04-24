import { auth } from './firebase';

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
  retryOnUnauthorized = true
) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('AUTH_REQUIRED');
  }

  const requestWithToken = async (forceRefresh: boolean) => {
    const token = await currentUser.getIdToken(forceRefresh);
    if (!token) {
      throw new Error('AUTH_REQUIRED');
    }

    const headers = new Headers(init.headers || {});
    headers.set('Authorization', `Bearer ${token}`);

    return fetch(input, {
      ...init,
      headers,
    });
  };

  let response = await requestWithToken(false);

  if (response.status === 401 && retryOnUnauthorized) {
    response = await requestWithToken(true);
  }

  return response;
}
