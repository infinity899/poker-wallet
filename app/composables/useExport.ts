import type { CashSession, Tournament } from '~/types';

export function useExport() {
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const convertSessionsToCSV = (sessions: CashSession[]): string => {
    const headers = [
      'Date',
      'Type',
      'Game',
      'Stakes',
      'Currency',
      'Result',
      'Duration (min)',
      'Hourly Rate',
      'Location/Site',
      'Notes',
      'Tags',
    ];

    const rows = sessions.map(s => [
      s.date,
      s.type,
      s.game,
      s.stake,
      s.currency,
      s.result.toString(),
      s.duration.toString(),
      s.duration > 0 ? ((s.result / s.duration) * 60).toFixed(2) : '0',
      s.type === 'live' ? s.location || '' : s.site || '',
      s.notes || '',
      s.tags.join('; '),
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');
  };

  const convertTournamentsToCSV = (tournaments: Tournament[]): string => {
    const headers = [
      'Date',
      'Name',
      'Type',
      'Currency',
      'Buy-in',
      'Fee',
      'Entries',
      'Winnings',
      'Profit',
      'ROI %',
      'Field Size',
      'Finish',
      'Location/Site',
      'Notes',
      'Tags',
    ];

    const rows = tournaments.map((t) => {
      const totalCost = (t.buyIn + t.fee) * (t.entries + 1);
      const profit = t.winnings - totalCost;
      const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;

      return [
        t.date,
        t.name,
        t.type,
        t.currency,
        t.buyIn.toString(),
        t.fee.toString(),
        t.entries.toString(),
        t.winnings.toString(),
        profit.toString(),
        roi.toFixed(2),
        t.fieldSize?.toString() || '',
        t.finishPosition?.toString() || '',
        t.type === 'live' ? t.venue || '' : t.site || '',
        t.notes || '',
        t.tags.join('; '),
      ];
    });

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');
  };

  const exportSessionsToCSV = (sessions: CashSession[], filename: string = 'sessions') => {
    const csv = convertSessionsToCSV(sessions);
    const date = new Date().toISOString().split('T')[0];
    downloadFile(csv, `${filename}-${date}.csv`, 'text/csv');
  };

  const exportTournamentsToCSV = (tournaments: Tournament[], filename: string = 'tournaments') => {
    const csv = convertTournamentsToCSV(tournaments);
    const date = new Date().toISOString().split('T')[0];
    downloadFile(csv, `${filename}-${date}.csv`, 'text/csv');
  };

  const exportToJSON = <T>(data: T, filename: string) => {
    const json = JSON.stringify(data, null, 2);
    const date = new Date().toISOString().split('T')[0];
    downloadFile(json, `${filename}-${date}.json`, 'application/json');
  };

  const importFromJSON = <T>(file: File): Promise<T> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          resolve(data as T);
        }
        catch {
          reject(new Error('Invalid JSON file'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  };

  return {
    exportSessionsToCSV,
    exportTournamentsToCSV,
    exportToJSON,
    importFromJSON,
  };
}
