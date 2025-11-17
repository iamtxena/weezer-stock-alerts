import { useQuery } from '@tanstack/react-query';

export interface UserPreferences {
  user_id: string;
  webhook_url?: string;
}

export function useUserPreferences() {
  return useQuery({
    queryKey: ['user-preferences'],
    queryFn: async () => {
      const response = await fetch('/api/user-preferences');
      if (!response.ok) {
        throw new Error('Failed to fetch user preferences');
      }
      return response.json() as Promise<UserPreferences | null>;
    },
  });
}
