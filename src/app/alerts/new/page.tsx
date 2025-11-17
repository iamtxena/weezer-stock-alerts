"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useCreateAlert, ConditionType, TriggerMode } from "@/hooks/use-alerts";

type Tab = "settings" | "message" | "notifications";

export default function NewAlertPage() {
  const router = useRouter();
  const { user } = useUser();
  const createAlertMutation = useCreateAlert();

  const [activeTab, setActiveTab] = useState<Tab>("settings");

  // Form state
  const [ticker, setTicker] = useState("");
  const [conditionType, setConditionType] = useState<ConditionType>("greater_than");
  const [threshold, setThreshold] = useState("");
  const [upperBound, setUpperBound] = useState("");
  const [lowerBound, setLowerBound] = useState("");
  const [triggerMode, setTriggerMode] = useState<TriggerMode>("once");
  const [expiresAt, setExpiresAt] = useState("");

  const [alertName, setAlertName] = useState("");
  const [message, setMessage] = useState("");

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState("");

  // Validation and submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const requiresChannel = [
    "entering_channel",
    "exiting_channel",
    "inside_channel",
    "outside_channel",
  ].includes(conditionType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!ticker.trim()) {
      setError("Ticker is required");
      setActiveTab("settings");
      return;
    }

    if (!threshold.trim() && !requiresChannel) {
      setError("Threshold is required");
      setActiveTab("settings");
      return;
    }

    if (requiresChannel && (!upperBound.trim() || !lowerBound.trim())) {
      setError("Both upper and lower bounds are required for channel conditions");
      setActiveTab("settings");
      return;
    }

    setIsSubmitting(true);

    try {
      const alertData: any = {
        ticker: ticker.trim().toUpperCase(),
        threshold: requiresChannel ? lowerBound : threshold,
        type: "buy", // Default type, will be determined by condition_type
      };

      // Add optional fields
      if (message.trim()) alertData.message = message.trim();
      if (alertName.trim()) alertData.name = alertName.trim();
      if (conditionType) alertData.condition_type = conditionType;
      if (triggerMode) alertData.trigger_mode = triggerMode;
      if (expiresAt) alertData.expires_at = expiresAt;
      if (requiresChannel && upperBound) alertData.upper_bound = upperBound;
      if (requiresChannel && lowerBound) alertData.lower_bound = lowerBound;

      await createAlertMutation.mutateAsync(alertData);

      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create alert");
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/");
  };

  const conditionOptions: { value: ConditionType; label: string }[] = [
    { value: "crossing", label: "Crossing" },
    { value: "crossing_up", label: "Crossing Up" },
    { value: "crossing_down", label: "Crossing Down" },
    { value: "greater_than", label: "Greater Than" },
    { value: "less_than", label: "Less Than" },
    { value: "entering_channel", label: "Entering Channel" },
    { value: "exiting_channel", label: "Exiting Channel" },
    { value: "inside_channel", label: "Inside Channel" },
    { value: "outside_channel", label: "Outside Channel" },
    { value: "moving_up", label: "Moving Up" },
    { value: "moving_down", label: "Moving Down" },
    { value: "moving_up_pct", label: "Moving Up %" },
    { value: "moving_down_pct", label: "Moving Down %" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create New Alert
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Set up a price alert with advanced conditions
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("settings")}
                className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-colors ${
                  activeTab === "settings"
                    ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                Settings
              </button>
              <button
                onClick={() => setActiveTab("message")}
                className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-colors ${
                  activeTab === "message"
                    ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                Message
              </button>
              <button
                onClick={() => setActiveTab("notifications")}
                className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-colors ${
                  activeTab === "notifications"
                    ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                Notifications
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Symbol
                  </label>
                  <input
                    type="text"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    placeholder="e.g., AAPL, BTC-USD"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Condition
                  </label>
                  <select
                    value={conditionType}
                    onChange={(e) => setConditionType(e.target.value as ConditionType)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    {conditionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {requiresChannel ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Lower Bound
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={lowerBound}
                        onChange={(e) => setLowerBound(e.target.value)}
                        placeholder="e.g., 100"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Upper Bound
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={upperBound}
                        onChange={(e) => setUpperBound(e.target.value)}
                        placeholder="e.g., 150"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Threshold
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={threshold}
                      onChange={(e) => setThreshold(e.target.value)}
                      placeholder="e.g., 150.00"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required={!requiresChannel}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Trigger
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="once"
                        checked={triggerMode === "once"}
                        onChange={(e) => setTriggerMode(e.target.value as TriggerMode)}
                        className="mr-2"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Only once</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="every_time"
                        checked={triggerMode === "every_time"}
                        onChange={(e) => setTriggerMode(e.target.value as TriggerMode)}
                        className="mr-2"
                      />
                      <span className="text-gray-700 dark:text-gray-300">Every time</span>
                    </label>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {triggerMode === "once"
                      ? "Alert will be disabled after triggering"
                      : "Alert will remain active and trigger repeatedly (with 15-min cooldown)"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Expiration (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Leave empty for no expiration
                  </p>
                </div>
              </div>
            )}

            {/* Message Tab */}
            {activeTab === "message" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Alert Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={alertName}
                    onChange={(e) => setAlertName(e.target.value)}
                    placeholder="e.g., AAPL Price Alert"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message (Optional)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g., Add $100 to investment account"
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                  />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Available placeholders:
                    <span className="block mt-1 font-mono text-xs">
                      {"{{ticker}}"} {"{{price}}"} {"{{threshold}}"} {"{{date}}"} {"{{time}}"}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email Notifications
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Send to {user?.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Webhook URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://your-webhook-endpoint.com"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Receive a POST request when this alert triggers
                  </p>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="mt-8 flex gap-4">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSubmitting ? "Creating..." : "Create Alert"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
