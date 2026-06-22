"use client";

if (typeof window !== 'undefined' && !(window as any).__fetchIntercepted) {
  (window as any).__fetchIntercepted = true;
  const originalFetch = window.fetch;
  const targetApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  window.fetch = function (input, init) {
    let url = '';
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.href;
    } else if (input instanceof Request) {
      url = input.url;
    }

    // Intercept and rewrite localhost:5000 to targetApiUrl
    if (url.includes('http://localhost:5000') && targetApiUrl !== 'http://localhost:5000') {
      const newUrl = url.replace('http://localhost:5000', targetApiUrl);
      if (typeof input === 'string') {
        input = newUrl;
      } else if (input instanceof URL) {
        input = new URL(newUrl);
      } else if (input instanceof Request) {
        try {
          input = new Request(newUrl, input);
        } catch (e) {
          // fallback
        }
      }
      url = newUrl;
    }

    // Check if it's an API request
    const isApiUrl = url.includes('/api/') && (url.includes('localhost:5000') || url.includes(targetApiUrl));

    if (isApiUrl) {
      if (input instanceof Request) {
        try {
          const newRequest = new Request(input, { credentials: 'include' });
          return originalFetch(newRequest, init);
        } catch (e) {
          return originalFetch(input, init);
        }
      }

      init = init || {};
      init.credentials = 'include';
    }
    return originalFetch(input, init);
  };
}

export default function FetchCredentialsSetup() {
  return null;
}
