"use client";

import { useState, useEffect, useCallback } from "react";
import { getPerangkat, getPerangkatHistory } from "@/services";
import type { Perangkat, RiwayatStatusPerangkat } from "@/types";
import { waktuLalu, formatDurasi } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Button } from "@/components/ui/button";
import { CardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Monitor,
  Wifi,
  WifiOff,
  Clock,
  AlertTriangle,
  RefreshCw,
  Activity,
  MapPin,
  Cpu,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

export default function PerangkatPage() {
  const [devices, setDevices] = useState<Perangkat[]>([]);
  const [historyMap, setHistoryMap] = useState<
    Record<string, RiwayatStatusPerangkat>
  >({});
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Refetch function for manual refresh
  const refetchDevices = useCallback(async () => {
    setRefreshing(true);
    setLoading(true);
    try {
      const devicesData = await getPerangkat();
      const historyPromises = devicesData.map((device) =>
        getPerangkatHistory(device.konterId),
      );
      const historyData = await Promise.all(historyPromises);

      setDevices(devicesData);

      const historyResult: Record<string, RiwayatStatusPerangkat> = {};
      historyData.forEach((h) => {
        historyResult[h.konterId] = h;
      });
      setHistoryMap(historyResult);
    } catch (error) {
      console.error("Error fetching device data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial data fetch on mount is a valid pattern
    refetchDevices();
  }, [refetchDevices]);

  const getUptimeChartData = (
    history: RiwayatStatusPerangkat | undefined,
  ): { waktu: string; status: number }[] => {
    if (!history?.catatan || history.catatan.length === 0) return [];

    return history.catatan.map((catatan) => ({
      waktu: waktuLalu(catatan.waktu),
      status:
        catatan.status === "online"
          ? 100
          : catatan.status === "menyiram"
            ? 50
            : 0,
    }));
  };

  const getLastStatusDuration = (device: Perangkat): string => {
    const history = historyMap[device.konterId];
    if (!history?.catatan || history.catatan.length === 0) return "N/A";

    const lastCatatan = history.catatan[history.catatan.length - 1];
    // eslint-disable-next-line react-hooks/purity -- Need current time for duration display
    return formatDurasi(Date.now() - new Date(lastCatatan.waktu).getTime());
  };

  const hasDeviceProblem = (device: Perangkat): boolean => {
    if (device.status === "offline") {
      const diffHours =
        // eslint-disable-next-line react-hooks/purity -- Need current time for offline detection
        (Date.now() - new Date(device.lastHeartbeat).getTime()) /
        (1000 * 60 * 60);
      return diffHours > 1;
    }
    if (device.status === "menyiram") {
      return true;
    }
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary tracking-tight">
            Perangkat
          </h1>
          <p className="text-text-secondary mt-1 text-sm">
            Monitoring status perangkat konter pulsa
          </p>
        </div>

        <Button
          variant="outline"
          onClick={refetchDevices}
          isLoading={refreshing}
          icon={<RefreshCw className="h-4 w-4" />}
        >
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center mx-auto mb-3">
                <Wifi className="h-5 w-5 text-success" />
              </div>
              <p className="text-2xl font-display font-bold text-text-primary tracking-tight">
                {devices.filter((d) => d.status === "online").length}
              </p>
              <p className="text-xs text-text-tertiary mt-1">Online</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <p className="text-2xl font-display font-bold text-text-primary tracking-tight">
                {devices.filter((d) => d.status === "menyiram").length}
              </p>
              <p className="text-xs text-text-tertiary mt-1">
                Terakhir Terlihat
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="h-10 w-10 rounded-xl bg-offline/10 flex items-center justify-center mx-auto mb-3">
                <WifiOff className="h-5 w-5 text-offline" />
              </div>
              <p className="text-2xl font-display font-bold text-text-primary tracking-tight">
                {devices.filter((d) => d.status === "offline").length}
              </p>
              <p className="text-xs text-text-tertiary mt-1">Offline</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Device Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <>
            <Card />
            <Card />
            <Card />
          </>
        ) : devices.length > 0 ? (
          devices.map((device) => {
            const problem = hasDeviceProblem(device);
            const duration = getLastStatusDuration(device);

            return (
              <Card
                key={device.id}
                variant={problem ? "status" : "default"}
                status={
                  device.status === "online"
                    ? "success"
                    : device.status === "menyiram"
                      ? "warning"
                      : "offline"
                }
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base font-display font-semibold">
                        {device.nama}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {device.lokasi || "Lokasi tidak tersedia"}
                      </CardDescription>
                    </div>
                    <StatusIndicator status={device.status} size="lg" />
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Problem Warning */}
                  {problem && (
                    <div className="mb-4 p-3 rounded-xl bg-warning/10 border border-warning/20">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                        <p className="text-xs text-warning font-medium">
                          {device.status === "menyiram"
                            ? "Perangkat tidak mengirim heartbeat dalam waktu lama"
                            : "Perangkat offline dalam waktu lama"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Device Info */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-text-secondary">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs">Heartbeat terakhir</span>
                      </div>
                      <span className="text-xs font-medium text-text-primary">
                        {waktuLalu(device.lastHeartbeat)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-text-secondary">
                        <Activity className="h-4 w-4" />
                        <span className="text-xs">Durasi status</span>
                      </div>
                      <span className="text-xs font-medium text-text-primary">
                        {duration}
                      </span>
                    </div>

                    {device.ip && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-text-secondary">
                          <Cpu className="h-4 w-4" />
                          <span className="text-xs">IP Address</span>
                        </div>
                        <span className="text-xs font-mono text-text-primary">
                          {device.ip}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Expand History Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() =>
                      setSelectedDevice(
                        selectedDevice === device.id ? null : device.id,
                      )
                    }
                  >
                    {selectedDevice === device.id
                      ? "Sembunyikan Riwayat"
                      : "Lihat Riwayat Status"}
                  </Button>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="col-span-full">
            <CardContent className="py-8">
              <EmptyState
                icon={<Monitor className="h-6 w-6 text-text-tertiary" />}
                title="Tidak ada perangkat"
                description="Belum ada perangkat yang terdaftar"
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Device History Charts */}
      {selectedDevice && historyMap[selectedDevice] && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display font-semibold">
              Riwayat Status -{" "}
              {devices.find((d) => d.id === selectedDevice)?.nama}
            </CardTitle>
            <CardDescription>
              Grafik uptime perangkat dalam 7 hari terakhir
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const history = historyMap[selectedDevice];
              const chartData = getUptimeChartData(history);

              return chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border-subtle)"
                    />
                    <XAxis
                      dataKey="waktu"
                      stroke="var(--text-tertiary)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="var(--text-tertiary)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 100]}
                      ticks={[0, 50, 100]}
                      tickFormatter={(value) =>
                        value === 0
                          ? "Offline"
                          : value === 50
                            ? "Menyiram"
                            : "Online"
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--card-border)",
                        borderRadius: "var(--radius-lg)",
                        boxShadow: "var(--shadow-dropdown-md)",
                      }}
                      labelStyle={{
                        color: "var(--text-primary)",
                        fontWeight: 600,
                      }}
                      formatter={
                        ((value: number) => [
                          value === 100
                            ? "Online"
                            : value === 50
                              ? "Menyiram"
                              : "Offline",
                          "Status",
                        ]) as any // eslint-disable-line @typescript-eslint/no-explicit-any -- Recharts Tooltip formatter type mismatch
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="status"
                      stroke="var(--success)"
                      fill="var(--success)"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState
                  title="Tidak ada riwayat"
                  description="Belum ada riwayat status untuk perangkat ini"
                />
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* All Device Histories */}
      {devices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display font-semibold">
              Semua Riwayat Perangkat
            </CardTitle>
            <CardDescription>
              Status semua perangkat dalam 7 hari terakhir
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {devices.map((device) => {
                const history = historyMap[device.konterId];
                const chartData = getUptimeChartData(history);

                return (
                  <div key={device.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StatusIndicator
                          status={device.status}
                          size="sm"
                          showLabel={false}
                        />
                        <span className="text-sm font-medium text-text-primary">
                          {device.nama}
                        </span>
                      </div>
                      <span className="text-xs text-text-tertiary">
                        {history?.catatan?.length || 0} catatan
                      </span>
                    </div>
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={60}>
                        <LineChart data={chartData}>
                          <Line
                            type="monotone"
                            dataKey="status"
                            stroke={
                              device.status === "online"
                                ? "var(--success)"
                                : device.status === "menyiram"
                                  ? "var(--warning)"
                                  : "var(--offline)"
                            }
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-10 rounded-lg bg-surface-secondary/50 flex items-center justify-center">
                        <span className="text-xs text-text-tertiary">
                          Tidak ada data riwayat
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
