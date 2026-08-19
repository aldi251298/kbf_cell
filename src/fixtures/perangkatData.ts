import type { Perangkat, RiwayatStatusPerangkat, StatusOnline } from "@/types";

// Helper to create dates in the past
function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function hoursAgo(hours: number): Date {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d;
}

function minutesAgo(minutes: number): Date {
  const d = new Date();
  d.setMinutes(d.getMinutes() - minutes);
  return d;
}

// Current device statuses - make it interesting: 2 online, 1 recently offline
export const PERANGKAT_LIST: Perangkat[] = [
  {
    id: "DEV-001",
    nama: "Maju Jaya - Jakarta",
    konterId: "KONTER-001",
    status: "online" as StatusOnline,
    lastHeartbeat: minutesAgo(2),
    ip: "103.45.12.100",
    userAgent: "Mozilla/5.0 (Android 13; Mobile)",
    lokasi: "Jakarta Selatan",
  },
  {
    id: "DEV-002",
    nama: "Berkah Mandiri - Tangerang",
    konterId: "KONTER-002",
    status: "online" as StatusOnline,
    lastHeartbeat: minutesAgo(5),
    ip: "103.45.12.101",
    userAgent: "Mozilla/5.0 (Android 12; Mobile)",
    lokasi: "Tangerang",
  },
  {
    id: "DEV-003",
    nama: "Sumber Rejeki - Bekasi",
    konterId: "KONTER-003",
    status: "menyiram" as StatusOnline,
    lastHeartbeat: hoursAgo(3),
    ip: "103.45.12.102",
    userAgent: "Mozilla/5.0 (Android 11; Mobile)",
    lokasi: "Bekasi",
  },
];

// Device status history for the last 7 days
export function getRiwayatStatusPerangkat(
  konterId: string,
): RiwayatStatusPerangkat {
  const now = new Date();

  if (konterId === "KONTER-001") {
    // Device 1: Mostly online, brief offline period 2 days ago
    return {
      konterId,
      catatan: [
        {
          waktu: daysAgo(7),
          status: "online" as StatusOnline,
          durasiMenit: 10080,
        }, // 7 days straight
        {
          waktu: daysAgo(7),
          status: "online" as StatusOnline,
          durasiMenit: 1440,
        },
        {
          waktu: daysAgo(6),
          status: "offline" as StatusOnline,
          durasiMenit: 45,
        }, // brief offline
        {
          waktu: daysAgo(6),
          status: "online" as StatusOnline,
          durasiMenit: 1395,
        },
        {
          waktu: daysAgo(2),
          status: "offline" as StatusOnline,
          durasiMenit: 30,
        }, // brief offline 2 days ago
        {
          waktu: daysAgo(2),
          status: "online" as StatusOnline,
          durasiMenit: 2850,
        },
        { waktu: now, status: "online" as StatusOnline, durasiMenit: 2 }, // current
      ],
    };
  }

  if (konterId === "KONTER-002") {
    // Device 2: Mostly online, brief offline 1 day ago
    return {
      konterId,
      catatan: [
        {
          waktu: daysAgo(6),
          status: "online" as StatusOnline,
          durasiMenit: 8640,
        },
        {
          waktu: daysAgo(6),
          status: "offline" as StatusOnline,
          durasiMenit: 20,
        },
        {
          waktu: daysAgo(6),
          status: "online" as StatusOnline,
          durasiMenit: 1420,
        },
        { waktu: now, status: "online" as StatusOnline, durasiMenit: 5 },
      ],
    };
  }

  // Device 3: Offline for 3 hours (menyiram status)
  return {
    konterId,
    catatan: [
      {
        waktu: daysAgo(5),
        status: "online" as StatusOnline,
        durasiMenit: 7200,
      },
      { waktu: daysAgo(5), status: "offline" as StatusOnline, durasiMenit: 60 },
      {
        waktu: daysAgo(5),
        status: "online" as StatusOnline,
        durasiMenit: 4320,
      },
      { waktu: daysAgo(2), status: "offline" as StatusOnline, durasiMenit: 90 },
      {
        waktu: daysAgo(2),
        status: "online" as StatusOnline,
        durasiMenit: 4230,
      },
      {
        waktu: hoursAgo(3),
        status: "offline" as StatusOnline,
        durasiMenit: 180,
      }, // offline 3 hours ago
      {
        waktu: hoursAgo(3),
        status: "menyiram" as StatusOnline,
        durasiMenit: 180,
      }, // current menyiram
    ],
  };
}
