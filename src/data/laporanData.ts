import type { LaporanPeriode, ModeLaporan } from "@/types";
import { getRingkasanPeriode } from "./ringkasanData";

const FAKE_API_DELAY = 500;

// Helper functions
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function formatDateYYYYMM(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function getLaporanPeriode(
  mode: ModeLaporan,
  periode: string,
): Promise<LaporanPeriode> {
  await new Promise((resolve) => setTimeout(resolve, FAKE_API_DELAY));

  const data: {
    tanggal?: Date;
    bulan?: number;
    omzet: number;
    jumlahTransaksi: number;
    rataRataNilai: number;
  }[] = [];

  const agregat = {
    totalOmzet: 0,
    totalTransaksi: 0,
    rataRataOmzet: 0,
    hariAktif: 0,
    hariTidakTransaksi: 0,
  };

  if (mode === "harian") {
    // Daily report for selected month
    const [yearStr, monthStr] = periode.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // 0-indexed

    const daysInMonth = getDaysInMonth(year, month);
    const dailySummaries = await getRingkasanPeriode(365); // get 1 year of data

    for (let day = 1; day <= daysInMonth; day++) {
      const searchDate = new Date(year, month, day);
      const dateStr = formatDateYYYYMM(searchDate);

      const dailySummary = dailySummaries.find(
        (s) => formatDateYYYYMM(s.tanggal) === dateStr,
      );

      if (dailySummary) {
        data.push({
          tanggal: searchDate,
          omzet: dailySummary.totalOmzet,
          jumlahTransaksi: dailySummary.totalTransaksi,
          rataRataNilai: dailySummary.rataRataNilaiTransaksi,
        });

        agregat.totalOmzet += dailySummary.totalOmzet;
        agregat.totalTransaksi += dailySummary.totalTransaksi;
        if (dailySummary.totalTransaksi > 0) {
          agregat.hariAktif++;
        } else {
          agregat.hariTidakTransaksi++;
        }
      } else {
        // No data for this day
        data.push({
          tanggal: searchDate,
          omzet: 0,
          jumlahTransaksi: 0,
          rataRataNilai: 0,
        });
        agregat.hariTidakTransaksi++;
      }
    }
  } else if (mode === "bulanan") {
    // Monthly report for selected year
    const year = parseInt(periode, 10);
    const monthlyData = await getRingkasanPeriode(730); // get 2 years

    for (let month = 0; month < 12; month++) {
      const monthSummaries = monthlyData.filter(
        (s) =>
          s.tanggal.getMonth() === month && s.tanggal.getFullYear() === year,
      );

      const totalOmzet = monthSummaries.reduce(
        (sum, s) => sum + s.totalOmzet,
        0,
      );
      const totalTransaksi = monthSummaries.reduce(
        (sum, s) => sum + s.totalTransaksi,
        0,
      );
      const hariAktif = monthSummaries.filter(
        (s) => s.totalTransaksi > 0,
      ).length;

      data.push({
        bulan: month + 1,
        omzet: totalOmzet,
        jumlahTransaksi: totalTransaksi,
        rataRataNilai: hariAktif > 0 ? Math.round(totalOmzet / hariAktif) : 0,
      });

      agregat.totalOmzet += totalOmzet;
      agregat.totalTransaksi += totalTransaksi;
      if (totalTransaksi > 0) agregat.hariAktif++;
    }
  } else if (mode === "tahunan") {
    // Yearly report
    const yearlyData = await getRingkasanPeriode(1825); // get 5 years

    const years = new Set(yearlyData.map((s) => s.tanggal.getFullYear()));
    const startYear = Math.min(...Array.from(years));
    const endYear = Math.max(...Array.from(years));

    for (let year = startYear; year <= endYear; year++) {
      const yearSummaries = yearlyData.filter(
        (s) => s.tanggal.getFullYear() === year,
      );
      const totalOmzet = yearSummaries.reduce(
        (sum, s) => sum + s.totalOmzet,
        0,
      );
      const totalTransaksi = yearSummaries.reduce(
        (sum, s) => sum + s.totalTransaksi,
        0,
      );

      data.push({
        tanggal: new Date(year, 0, 1),
        omzet: totalOmzet,
        jumlahTransaksi: totalTransaksi,
        rataRataNilai:
          yearSummaries.length > 0
            ? Math.round(totalOmzet / yearSummaries.length)
            : 0,
      });

      agregat.totalOmzet += totalOmzet;
      agregat.totalTransaksi += totalTransaksi;
    }
  }

  // Calculate rata-rata
  agregat.rataRataOmzet =
    data.length > 0 ? Math.round(agregat.totalOmzet / data.length) : 0;

  return {
    mode,
    periode,
    data,
    agregat,
  };
}
