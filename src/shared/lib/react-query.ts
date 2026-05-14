import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      onError: (error) => {
        // Global mutation error handler
        // Safely extract error message for toasts
        let errorMessage = 'An unexpected error occurred.';
        if (error instanceof Error) {
          try {
            // Check if it's our Stringified JSON error
            const parsed = JSON.parse(error.message);
            errorMessage = parsed.error || error.message;
          } catch {
            errorMessage = error.message;
          }
        }
        console.error('Mutation error:', errorMessage);
        // Toast integration can be added here once we have a Toast service
      },
    },
  },
});
