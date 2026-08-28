"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";

interface SelectOption {
  value: string;
  label: string;
}
import {
  generateNotification,
  PRESETS,
  VALID_TRANSACTION_TYPES,
  TRANSACTION_TYPE_LABELS,
  PRODUCT_OPTIONS,
  generateRandomTransaction,
  type GeneratorConfig,
  type GeneratedNotification,
  type Provider,
  type TransactionType,
} from "@/lib/notificationGenerator";
import { Copy, Send, History, RotateCcw, Zap, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type TimestampOption = "current" | "custom" | "random";

interface HistoryEntry {
  id: string;
  time: string;
  provider: Provider;
  transactionType: TransactionType;
  status: number | "error";
  duration: string;
  result: "success" | "error" | "pending";
  request: GeneratedNotification["payload"];
  response: unknown;
}

export default function TransactionSimulator() {
  // Configuration state
  const [provider, setProvider] = useState<Provider>("alpines");
  const [transactionType, setTransactionType] =
    useState<TransactionType>("ewallet");
  const [product, setProduct] = useState<string>("");
  const [nominal, setNominal] = useState<number>(200000);
  const [customerNumber, setCustomerNumber] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [timestampOption, setTimestampOption] =
    useState<TimestampOption>("current");
  const [customTimestamp, setCustomTimestamp] = useState<string>("");

  // Generated notification state
  const [generatedNotification, setGeneratedNotification] =
    useState<GeneratedNotification | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // API state
  const [isSending, setIsSending] = useState(false);
  const [apiResponse, setApiResponse] = useState<{
    status: number;
    data: unknown;
    duration: number;
  } | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // History state
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selectedHistoryEntry, setSelectedHistoryEntry] =
    useState<HistoryEntry | null>(null);
  const [showHistoryDetail, setShowHistoryDetail] = useState(false);

  // Handler wrappers for Select components
  const handleProviderChange = (value: string) =>
    setProvider(value as Provider);
  const handleTransactionTypeChange = (value: string) =>
    setTransactionType(value as TransactionType);
  const handleProductChange = (value: string) => setProduct(value);
  const handleTimestampOptionChange = (value: string) =>
    setTimestampOption(value as TimestampOption);

  // Valid transaction types for current provider
  const validTypes = VALID_TRANSACTION_TYPES[provider];
  const productOptions = productOptionsForCurrentType();

  // Reset transaction type when provider changes - use derived state approach
  // If the current transactionType is not valid for the new provider, reset to first valid type
  const effectiveTransactionType = validTypes.includes(transactionType)
    ? transactionType
    : validTypes[0];

  // Reset product when provider or transaction type changes
  // Using a key-based approach to reset the product selection
  const productResetKey = `${provider}-${effectiveTransactionType}`;

  function productOptionsForCurrentType(): SelectOption[] {
    const options = PRODUCT_OPTIONS[provider]?.[transactionType] || [];
    return options.map((p) => ({ value: p, label: p }));
  }

  function transactionTypeOptions(): SelectOption[] {
    return validTypes.map((t) => ({
      value: t,
      label: TRANSACTION_TYPE_LABELS[t],
    }));
  }

  function providerOptions(): SelectOption[] {
    return [
      { value: "alpines", label: "ALPINES" },
      { value: "digipos", label: "DIGIPOS" },
    ];
  }

  function timestampOptions(): SelectOption[] {
    return [
      { value: "current", label: "Current Time" },
      { value: "custom", label: "Custom Time" },
      { value: "random", label: "Random Time (Last 24h)" },
    ];
  }

  function handleGenerate() {
    setIsGenerating(true);
    setApiResponse(null);
    setApiError(null);

    // Small delay to show loading state
    setTimeout(() => {
      let timestamp: Date;

      switch (timestampOption) {
        case "custom":
          timestamp = customTimestamp ? new Date(customTimestamp) : new Date();
          break;
        case "random":
          const now = Date.now();
          const dayAgo = now - 24 * 60 * 60 * 1000;
          timestamp = new Date(dayAgo + Math.random() * (now - dayAgo));
          break;
        default:
          timestamp = new Date();
      }

      const config: GeneratorConfig = {
        provider,
        transactionType,
        product: product || undefined,
        nominal: nominal || undefined,
        customerNumber: customerNumber || undefined,
        customerName: customerName || undefined,
        timestamp,
      };

      const result = generateNotification(config);
      setGeneratedNotification(result);
      setIsGenerating(false);
    }, 100);
  }

  function handlePresetClick(presetName: string) {
    const preset = PRESETS[presetName];
    if (!preset) return;

    setProvider(preset.provider);
    setTransactionType(preset.transactionType);
    setProduct(preset.product || "");
    setNominal(preset.nominal || 0);
    setCustomerNumber(preset.customerNumber || "");
    setCustomerName(preset.customerName || "");
    setTimestampOption("current");
    setCustomTimestamp("");
    setGeneratedNotification(null);
    setApiResponse(null);
    setApiError(null);
  }

  function handleRandomClick() {
    const random = generateRandomTransaction();
    setProvider(random.provider);
    setTransactionType(random.transactionType);
    setProduct(random.product || "");
    setNominal(random.nominal ?? 20000);
    setCustomerNumber(random.customerNumber ?? "");
    setCustomerName(random.customerName ?? "");
    setTimestampOption("current");
    setCustomTimestamp("");
    setGeneratedNotification(null);
    setApiResponse(null);
    setApiError(null);
  }

  async function handleSend() {
    if (!generatedNotification) return;

    setIsSending(true);
    setApiError(null);
    const startTimeRef = { current: 0 };
    // eslint-disable-next-line react-hooks/purity
    startTimeRef.current = Date.now();

    try {
      const response = await fetch("/api/ingest/transaksi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(generatedNotification.payload),
      });

      // eslint-disable-next-line react-hooks/purity
      const duration = Date.now() - startTimeRef.current;
      const data = await response.json();

      setApiResponse({
        status: response.status,
        data,
        duration: Math.round(duration),
      });

      // Add to history
      const historyEntry: HistoryEntry = {
        id: generateId(),
        time: new Date().toLocaleTimeString("id-ID", { hour12: false }),
        provider: generatedNotification.metadata.provider,
        transactionType: generatedNotification.metadata.transactionType,
        status: response.status,
        duration: `${Math.round(duration)}ms`,
        result: response.ok ? "success" : "error",
        request: generatedNotification.payload,
        response: data,
      };

      setHistory((prev) => [historyEntry, ...prev].slice(0, 50));
    } catch (error) {
      // eslint-disable-next-line react-hooks/purity
      const duration = Date.now() - startTimeRef.current;
      const errorMessage =
        error instanceof Error ? error.message : "Network error";
      setApiError(errorMessage);
      setApiResponse({
        status: 0,
        data: { error: errorMessage },
        duration: Math.round(duration),
      });

      const historyEntry: HistoryEntry = {
        id: generateId(),
        time: new Date().toLocaleTimeString("id-ID", { hour12: false }),
        provider: generatedNotification.metadata.provider,
        transactionType: generatedNotification.metadata.transactionType,
        status: "error",
        duration: `${Math.round(duration)}ms`,
        result: "error",
        request: generatedNotification.payload,
        response: { error: errorMessage },
      };

      setHistory((prev) => [historyEntry, ...prev].slice(0, 50));
    } finally {
      setIsSending(false);
    }
  }

  function handleCopyNotification() {
    if (generatedNotification) {
      navigator.clipboard.writeText(generatedNotification.rawText);
    }
  }

  function handleCopyPayload() {
    if (generatedNotification) {
      navigator.clipboard.writeText(
        JSON.stringify(generatedNotification.payload, null, 2),
      );
    }
  }

  function handleCopyResponse() {
    if (apiResponse) {
      navigator.clipboard.writeText(JSON.stringify(apiResponse.data, null, 2));
    }
  }

  function handleHistoryClick(entry: HistoryEntry) {
    setSelectedHistoryEntry(entry);
    setShowHistoryDetail(true);
  }

  function handleClearHistory() {
    setHistory([]);
  }

  function generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  function formatJson(obj: unknown): string {
    return JSON.stringify(obj, null, 2);
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Transaction Simulator
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Generate realistic notifications and test them against the existing
            ingestion API
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={handleRandomClick}
            icon={<RotateCcw className="h-4 w-4" />}
          >
            Random Transaction
          </Button>
          <Button
            variant="outline"
            onClick={handleClearHistory}
            icon={<History className="h-4 w-4" />}
            disabled={history.length === 0}
          >
            Clear History
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Configuration & Generator */}
        <div className="lg:col-span-2 space-y-6">
          {/* Transaction Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Transaction Configuration
              </CardTitle>
              <CardDescription>
                Configure the transaction parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Provider */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provider
                </label>
                <Select
                  options={providerOptions()}
                  value={provider}
                  onChange={handleProviderChange}
                  placeholder="Select provider"
                />
              </div>

              {/* Transaction Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction Type
                </label>
                <Select
                  options={transactionTypeOptions()}
                  value={effectiveTransactionType}
                  onChange={handleTransactionTypeChange}
                  placeholder="Select transaction type"
                />
              </div>

              {/* Product */}
              {productOptions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product
                  </label>
                  <Select
                    key={productResetKey}
                    options={productOptions}
                    value={product}
                    onChange={handleProductChange}
                    placeholder="Select product (optional)"
                  />
                </div>
              )}

              {/* Nominal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nominal (Rp)
                </label>
                <Input
                  type="number"
                  value={nominal}
                  onChange={(e) => setNominal(parseInt(e.target.value) || 0)}
                  placeholder="Enter nominal amount"
                  className="text-right"
                  min={0}
                  step={1000}
                />
              </div>

              {/* Customer Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Number
                </label>
                <Input
                  type="text"
                  value={customerNumber}
                  onChange={(e) => setCustomerNumber(e.target.value)}
                  placeholder="e.g., 6285126236562"
                />
              </div>

              {/* Customer Name (for e-wallet/PLN) */}
              {(transactionType === "ewallet" ||
                transactionType === "pln" ||
                transactionType === "tagihan") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name
                  </label>
                  <Input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g., BUDI SANTOSO"
                  />
                </div>
              )}

              {/* Timestamp */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timestamp
                </label>
                <Select
                  options={timestampOptions()}
                  value={timestampOption}
                  onChange={handleTimestampOptionChange}
                  placeholder="Select timestamp option"
                />
                {timestampOption === "custom" && (
                  <Input
                    type="datetime-local"
                    value={customTimestamp}
                    onChange={(e) => setCustomTimestamp(e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  onClick={handleGenerate}
                  isLoading={isGenerating}
                  icon={<Zap className="h-4 w-4" />}
                  className="flex-1 sm:flex-none"
                >
                  Generate Notification
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRandomClick}
                  icon={<RotateCcw className="h-4 w-4" />}
                >
                  Random
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Presets */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Presets</CardTitle>
              <CardDescription>
                Quick-fill with real-world transaction examples
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.keys(PRESETS).map((presetName) => (
                  <Button
                    key={presetName}
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePresetClick(presetName)}
                    className="text-xs h-8 px-3"
                  >
                    {presetName}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Generated Notification */}
          {generatedNotification && (
            <Card variant="highlight">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    Generated Notification
                  </CardTitle>
                  <CardDescription>
                    Raw notification text that will be sent to the API
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyNotification}
                  icon={<Copy className="h-4 w-4" />}
                >
                  Copy
                </Button>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 text-green-300 p-4 rounded-lg font-mono text-sm overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap">
                  {generatedNotification.rawText}
                </div>
              </CardContent>
            </Card>
          )}

          {/* API Payload Preview */}
          {generatedNotification && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    API Payload Preview
                  </CardTitle>
                  <CardDescription>
                    Exact payload that will be sent to POST
                    /api/ingest/transaksi
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyPayload}
                  icon={<Copy className="h-4 w-4" />}
                >
                  Copy
                </Button>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap">
                  {formatJson(generatedNotification.payload)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Send to Backend */}
          {generatedNotification && (
            <Card variant="highlight">
              <CardHeader>
                <CardTitle className="text-base">Send to Backend</CardTitle>
                <CardDescription>
                  Submit the notification to the existing ingestion API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleSend}
                  isLoading={isSending}
                  icon={<Send className="h-4 w-4" />}
                  variant="success"
                  className="w-full sm:w-auto"
                  disabled={isSending}
                >
                  {isSending ? "Sending..." : "Send to Backend"}
                </Button>

                {apiResponse && (
                  <div
                    className={cn(
                      "p-4 rounded-lg font-mono text-sm overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap",
                      apiResponse.status >= 200 && apiResponse.status < 300
                        ? "bg-green-50 text-green-900 border border-green-200"
                        : "bg-red-50 text-red-900 border border-red-200",
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">
                        HTTP {apiResponse.status}{" "}
                        {apiResponse.status === 0 ? "(Network Error)" : ""}
                      </span>
                      <span className="text-xs text-gray-500">
                        {apiResponse.duration}ms
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <pre>{formatJson(apiResponse.data)}</pre>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyResponse}
                        icon={<Copy className="h-4 w-4" />}
                        className="h-8"
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                )}

                {apiError && !apiResponse && (
                  <div className="p-4 rounded-lg bg-red-50 text-red-900 border border-red-200 font-mono text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <XCircle className="h-4 w-4" />
                      <span className="font-medium">Request Failed</span>
                    </div>
                    <pre>{apiError}</pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - History */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Request History</CardTitle>
                <CardDescription>{history.length} requests</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearHistory}
                disabled={history.length === 0}
                icon={<RotateCcw className="h-4 w-4" />}
              >
                Clear
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {history.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  <History className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>No requests yet</p>
                  <p className="text-xs">
                    Generate and send a notification to see history
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                  {history.map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => handleHistoryClick(entry)}
                      className="w-full p-3 text-left hover:bg-gray-50 transition-colors flex items-start gap-3"
                    >
                      <div
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                        style={{
                          backgroundColor:
                            entry.result === "success" ? "#dcfce7" : "#fee2e2",
                          color:
                            entry.result === "success" ? "#166534" : "#991b1b",
                        }}
                      >
                        {entry.result === "success"
                          ? "✓"
                          : entry.result === "error"
                            ? "✕"
                            : "⏳"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-medium text-gray-900">
                            {entry.time}
                          </span>
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                            style={{
                              backgroundColor:
                                entry.provider === "alpines"
                                  ? "#dbeafe"
                                  : "#fef3c7",
                              color:
                                entry.provider === "alpines"
                                  ? "#1e40af"
                                  : "#92400e",
                            }}
                          >
                            {entry.provider.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {TRANSACTION_TYPE_LABELS[entry.transactionType]}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
                          <span>
                            {entry.status === "error"
                              ? "Error"
                              : `HTTP ${entry.status}`}
                          </span>
                          <span>·</span>
                          <span>{entry.duration}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* History Detail Modal */}
      {showHistoryDetail && selectedHistoryEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowHistoryDetail(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Request Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistoryDetail(false)}
              >
                Close
              </Button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[70vh] space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  Request Payload
                </h4>
                <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs overflow-x-auto max-h-64 whitespace-pre-wrap">
                  {formatJson(selectedHistoryEntry.request)}
                </pre>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  Response
                </h4>
                <pre
                  className={cn(
                    "p-3 rounded-lg text-xs overflow-x-auto max-h-64 whitespace-pre-wrap",
                    selectedHistoryEntry.result === "success"
                      ? "bg-green-50 text-green-900"
                      : "bg-red-50 text-red-900",
                  )}
                >
                  {formatJson(selectedHistoryEntry.response)}
                </pre>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Provider:</span>
                  <span className="ml-2 font-medium">
                    {selectedHistoryEntry.provider.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Type:</span>
                  <span className="ml-2 font-medium">
                    {
                      TRANSACTION_TYPE_LABELS[
                        selectedHistoryEntry.transactionType
                      ]
                    }
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className="ml-2 font-medium">
                    {selectedHistoryEntry.status === "error"
                      ? "Error"
                      : `HTTP ${selectedHistoryEntry.status}`}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Duration:</span>
                  <span className="ml-2 font-medium">
                    {selectedHistoryEntry.duration}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Time:</span>
                  <span className="ml-2 font-medium">
                    {selectedHistoryEntry.time}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Result:</span>
                  <span
                    className="ml-2 font-medium"
                    style={{
                      color:
                        selectedHistoryEntry.result === "success"
                          ? "#16a34a"
                          : "#dc2626",
                    }}
                  >
                    {selectedHistoryEntry.result.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
