import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export type ConditionType =
  | 'crossing'
  | 'crossing_up'
  | 'crossing_down'
  | 'greater_than'
  | 'less_than'
  | 'entering_channel'
  | 'exiting_channel'
  | 'inside_channel'
  | 'outside_channel'
  | 'moving_up'
  | 'moving_down'
  | 'moving_up_pct'
  | 'moving_down_pct';

export type TriggerMode = 'once' | 'every_time';

export interface Alert {
  id: string;
  user_id: string;
  ticker: string;
  threshold: number;
  type: 'buy' | 'sell' | 'rebalance';
  active: boolean;
  message?: string;
  name?: string;
  condition_type?: ConditionType;
  trigger_mode?: TriggerMode;
  expires_at?: string;
  last_price?: number;
  upper_bound?: number;
  lower_bound?: number;
  trigger_count?: number;
  last_triggered_at?: string;
  created_at: string;
}

// Fetch alerts
export function useAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const response = await fetch('/api/alerts');
      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }
      return response.json() as Promise<Alert[]>;
    },
  });
}

// Create alert
export function useCreateAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      ticker: string;
      threshold: string;
      type: 'buy' | 'sell' | 'rebalance';
      message?: string;
      name?: string;
      condition_type?: ConditionType;
      trigger_mode?: TriggerMode;
      expires_at?: string;
      upper_bound?: string;
      lower_bound?: string;
    }) => {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create alert');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

// Update alert (can update any fields: ticker, threshold, type, active, message)
export function useUpdateAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      ticker?: string;
      threshold?: string | number;
      type?: 'buy' | 'sell' | 'rebalance';
      active?: boolean;
      message?: string;
    }) => {
      const response = await fetch('/api/alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update alert');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

// Toggle alert active status (convenience wrapper)
export function useToggleAlert() {
  const updateAlert = useUpdateAlert();

  return {
    ...updateAlert,
    mutateAsync: async (data: { id: string; active: boolean }) => {
      return updateAlert.mutateAsync(data);
    },
  };
}

// Delete alert
export function useDeleteAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/alerts?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete alert');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}
