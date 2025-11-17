import { create } from 'zustand';
import type { ConditionType } from '@/hooks/use-alerts';

interface AlertFormState {
  ticker: string;
  threshold: string;
  type: 'buy' | 'sell' | 'rebalance';
  conditionType: ConditionType;
  message: string;
  isSubmitting: boolean;
  searchQuery: string;
  showDropdown: boolean;
  setTicker: (ticker: string) => void;
  setThreshold: (threshold: string) => void;
  setType: (type: 'buy' | 'sell' | 'rebalance') => void;
  setConditionType: (conditionType: ConditionType) => void;
  setMessage: (message: string) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  setSearchQuery: (query: string) => void;
  setShowDropdown: (show: boolean) => void;
  resetForm: () => void;
}

export const useAlertFormStore = create<AlertFormState>((set) => ({
  ticker: '',
  threshold: '',
  type: 'buy',
  conditionType: 'greater_than',
  message: '',
  isSubmitting: false,
  searchQuery: '',
  showDropdown: false,
  setTicker: (ticker) => set({ ticker }),
  setThreshold: (threshold) => set({ threshold }),
  setType: (type) => set({ type }),
  setConditionType: (conditionType) => set({ conditionType }),
  setMessage: (message) => set({ message }),
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setShowDropdown: (show) => set({ showDropdown: show }),
  resetForm: () =>
    set({
      ticker: '',
      threshold: '',
      type: 'buy',
      conditionType: 'greater_than',
      message: '',
      isSubmitting: false,
      searchQuery: '',
      showDropdown: false,
    }),
}));
