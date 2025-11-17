"use client";

import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import {
  useAlerts,
  useCreateAlert,
  useUpdateAlert,
  useToggleAlert,
  useDeleteAlert,
  type ConditionType,
} from "@/hooks/use-alerts";
import { useSymbolSearch } from "@/hooks/use-symbol-search";
import { useAlertFormStore } from "@/stores/alert-form-store";
import { useUserPreferences } from "@/hooks/use-user-preferences";

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [validationError, setValidationError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    ticker: "",
    threshold: "",
    type: "buy" as "buy" | "sell" | "rebalance",
    message: "",
    webhook_url: "",
  });

  // Zustand store for form state
  const {
    ticker,
    threshold,
    type,
    conditionType,
    message,
    searchQuery,
    showDropdown,
    setTicker,
    setThreshold,
    setConditionType,
    setMessage,
    setSearchQuery,
    setShowDropdown,
    resetForm,
  } = useAlertFormStore();

  // React Query hooks
  const { data: alerts = [], isLoading } = useAlerts();
  const createAlertMutation = useCreateAlert();
  const updateAlertMutation = useUpdateAlert();
  const toggleAlertMutation = useToggleAlert();
  const deleteAlertMutation = useDeleteAlert();
  const { data: symbolResults = [], isLoading: isSearching } =
    useSymbolSearch(searchQuery);
  const { data: userPreferences } = useUserPreferences();

  // Close dropdown when clicking outside (this useEffect is necessary for UX)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setShowDropdown]);

  const handleTickerChange = (value: string) => {
    const upperValue = value.toUpperCase();
    setTicker(upperValue);
    setSearchQuery(value);
    setValidationError("");

    if (symbolResults.length > 0) {
      setShowDropdown(true);
    }
  };

  const selectSymbol = (symbol: { symbol: string }) => {
    setTicker(symbol.symbol);
    setSearchQuery("");
    setShowDropdown(false);
    setValidationError("");
  };

  const validateSymbol = async (symbol: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `/api/symbols/validate?symbol=${encodeURIComponent(symbol)}`
      );
      const data = await response.json();

      if (!data.valid) {
        setValidationError(
          `Symbol "${symbol}" not found. Please search and select a valid symbol.`
        );
        return false;
      }

      setValidationError("");
      return true;
    } catch (error) {
      console.error("Error validating symbol:", error);
      setValidationError("Failed to validate symbol. Please try again.");
      return false;
    }
  };

  const addAlert = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate symbol before creating alert
    const isValid = await validateSymbol(ticker);
    if (!isValid) {
      return;
    }

    try {
      await createAlertMutation.mutateAsync({
        ticker,
        threshold,
        type,
        message,
        condition_type: conditionType,
      });
      resetForm();
      setValidationError("");
    } catch (error) {
      console.error("Error adding alert:", error);
      setValidationError(
        error instanceof Error ? error.message : "Failed to create alert"
      );
    }
  };

  const toggleAlert = async (id: string, active: boolean) => {
    try {
      await toggleAlertMutation.mutateAsync({ id, active: !active });
    } catch (error) {
      console.error("Error toggling alert:", error);
    }
  };

  const deleteAlert = async (id: string) => {
    if (!confirm("Are you sure you want to delete this alert?")) return;

    try {
      await deleteAlertMutation.mutateAsync(id);
    } catch (error) {
      console.error("Error deleting alert:", error);
    }
  };

  const startEditing = (alert: {
    id: string;
    ticker: string;
    threshold: number;
    type: "buy" | "sell" | "rebalance";
    message?: string;
  }) => {
    setEditingId(alert.id);
    setEditForm({
      ticker: alert.ticker,
      threshold: alert.threshold.toString(),
      type: alert.type,
      message: alert.message || "",
      webhook_url: userPreferences?.webhook_url || "",
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({ ticker: "", threshold: "", type: "buy", message: "", webhook_url: "" });
  };

  const saveEdit = async (id: string) => {
    try {
      // Update the alert
      await updateAlertMutation.mutateAsync({
        id,
        ticker: editForm.ticker,
        threshold: editForm.threshold,
        type: editForm.type,
        message: editForm.message,
      });

      // Update webhook URL in user preferences
      await fetch('/api/user-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhook_url: editForm.webhook_url }),
      });

      setEditingId(null);
    } catch (error) {
      console.error("Error updating alert:", error);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-black">
        <div className="text-center space-y-6 p-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Stock Alerts App
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Get real-time notifications for your investment thresholds
          </p>
          <SignInButton mode="modal">
            <button className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Sign In to Get Started
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Weezer&apos;s Stock Alerts
            </h1>
            <UserButton />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Quick Create Alert
            </h2>
            <Link
              href="/alerts/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Advanced Alert
            </Link>
          </div>
          <form onSubmit={addAlert} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative" ref={dropdownRef}>
                <label
                  htmlFor="ticker"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Ticker Symbol
                </label>
                <input
                  id="ticker"
                  name="ticker"
                  value={ticker}
                  onChange={(e) => handleTickerChange(e.target.value)}
                  placeholder="e.g., AAPL, BTC-USD"
                  required
                  autoComplete="off"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    validationError
                      ? "border-red-500 dark:border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {isSearching && (
                  <div className="absolute right-3 top-10 text-gray-400">
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                )}
                {showDropdown && symbolResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {symbolResults.map((result, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => selectSymbol(result)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {result.symbol}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {result.name}
                            </div>
                          </div>
                          <div className="ml-2 text-right">
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {result.exchange}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {result.type}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {validationError && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {validationError}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="threshold"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Threshold Price ($)
                </label>
                <input
                  id="threshold"
                  name="threshold"
                  type="number"
                  step="0.01"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  placeholder="e.g., 44.00"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="conditionType"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Condition Type
                </label>
                <select
                  id="conditionType"
                  name="conditionType"
                  value={conditionType}
                  onChange={(e) => setConditionType(e.target.value as ConditionType)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="greater_than">Greater Than</option>
                  <option value="less_than">Less Than</option>
                  <option value="crossing">Crossing (any direction)</option>
                  <option value="crossing_up">Crossing Up</option>
                  <option value="crossing_down">Crossing Down</option>
                  <option value="entering_channel">Entering Channel</option>
                  <option value="exiting_channel">Exiting Channel</option>
                  <option value="inside_channel">Inside Channel</option>
                  <option value="outside_channel">Outside Channel</option>
                  <option value="moving_up">Moving Up (amount)</option>
                  <option value="moving_down">Moving Down (amount)</option>
                  <option value="moving_up_pct">Moving Up %</option>
                  <option value="moving_down_pct">Moving Down %</option>
                </select>
              </div>
            </div>
            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Message (optional)
              </label>
              <textarea
                id="message"
                name="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g., Add $100 to investment account"
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={createAlertMutation.isPending}
              className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createAlertMutation.isPending ? "Adding..." : "Add Alert"}
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Your Alerts ({alerts.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <div className="px-6 py-8 text-center text-gray-500">
                Loading alerts...
              </div>
            ) : alerts.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No alerts yet. Create your first alert above!
              </div>
            ) : (
              alerts.map((alert) => {
                const isEditing = editingId === alert.id;
                return (
                  <div
                    key={alert.id}
                    className={`transition-all duration-300 ${
                      isEditing
                        ? "bg-blue-50 dark:bg-blue-900/20 scale-[1.02]"
                        : ""
                    }`}
                  >
                    <div className="px-6 py-4">
                      {!isEditing ? (
                        // View Mode
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2 flex-wrap gap-y-2">
                              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                {alert.name || alert.ticker}
                              </span>
                              {alert.name && (
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  ({alert.ticker})
                                </span>
                              )}
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  alert.type === "buy"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    : alert.type === "sell"
                                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                    : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                }`}
                              >
                                {alert.type}
                              </span>
                              {alert.condition_type && (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                  {alert.condition_type.replace(/_/g, " ")}
                                </span>
                              )}
                              {alert.trigger_mode && (
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  alert.trigger_mode === "every_time"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                                }`}>
                                  {alert.trigger_mode === "once" ? "Once" : "Recurring"}
                                </span>
                              )}
                              {userPreferences?.webhook_url && (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200" title="Webhook enabled">
                                  🔗
                                </span>
                              )}
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  alert.active
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {alert.active ? "Active" : "Inactive"}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                              <div>
                                {alert.upper_bound && alert.lower_bound ? (
                                  <span>Channel: ${alert.lower_bound} - ${alert.upper_bound}</span>
                                ) : (
                                  <span>Threshold: ${alert.threshold}</span>
                                )}
                              </div>
                              {alert.expires_at && (
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-600 dark:text-gray-400">
                                    ⏰ Expires: {new Date(alert.expires_at).toLocaleString()}
                                  </span>
                                </div>
                              )}
                              {alert.trigger_count !== undefined && alert.trigger_count > 0 && (
                                <div className="text-blue-600 dark:text-blue-400">
                                  🔔 Triggered {alert.trigger_count} time{alert.trigger_count !== 1 ? "s" : ""}
                                  {alert.last_triggered_at && ` (last: ${new Date(alert.last_triggered_at).toLocaleString()})`}
                                </div>
                              )}
                            </div>
                            {alert.message && (
                              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300 italic">
                                💬 {alert.message}
                              </div>
                            )}
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                              Created:{" "}
                              {new Date(alert.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => startEditing(alert)}
                              className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-200 rounded transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                toggleAlert(alert.id, alert.active)
                              }
                              disabled={toggleAlertMutation.isPending}
                              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded transition-colors disabled:opacity-50"
                            >
                              {alert.active ? "Disable" : "Enable"}
                            </button>
                            <button
                              onClick={() => deleteAlert(alert.id)}
                              disabled={deleteAlertMutation.isPending}
                              className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-200 rounded transition-colors disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Edit Mode
                        <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                          <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-3">
                            Editing Alert
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Ticker Symbol
                              </label>
                              <input
                                type="text"
                                value={editForm.ticker}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    ticker: e.target.value.toUpperCase(),
                                  })
                                }
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Threshold ($)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={editForm.threshold}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    threshold: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Alert Type
                              </label>
                              <select
                                value={editForm.type}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    type: e.target.value as
                                      | "buy"
                                      | "sell"
                                      | "rebalance",
                                  })
                                }
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                              >
                                <option value="buy">
                                  Buy (price drops below)
                                </option>
                                <option value="sell">
                                  Sell (price rises above)
                                </option>
                                <option value="rebalance">Rebalance</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Message (optional)
                            </label>
                            <textarea
                              value={editForm.message}
                              onChange={(e) =>
                                setEditForm({ ...editForm, message: e.target.value })
                              }
                              placeholder="e.g., Add $100 to investment account"
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Webhook URL (optional)
                            </label>
                            <input
                              type="url"
                              value={editForm.webhook_url}
                              onChange={(e) =>
                                setEditForm({ ...editForm, webhook_url: e.target.value })
                              }
                              placeholder="https://hooks.slack.com/services/..."
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              Applies to all your alerts
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 pt-2">
                            <button
                              onClick={() => saveEdit(alert.id)}
                              disabled={updateAlertMutation.isPending}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                            >
                              {updateAlertMutation.isPending
                                ? "Saving..."
                                : "Save Changes"}
                            </button>
                            <button
                              onClick={cancelEditing}
                              disabled={updateAlertMutation.isPending}
                              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
