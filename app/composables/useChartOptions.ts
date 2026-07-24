import type { ChartOptions } from 'chart.js';

const TICK_COLOR = 'rgb(148, 163, 184)';
const GRID_COLOR = 'rgba(71, 85, 105, 0.15)';

const tooltipStyle = {
  backgroundColor: 'rgba(15, 23, 42, 0.95)',
  titleColor: '#f8fafc',
  bodyColor: '#cbd5e1',
  borderColor: 'rgba(71, 85, 105, 0.3)',
  borderWidth: 1,
  padding: 12,
  cornerRadius: 6,
  titleFont: { size: 12, weight: '600' },
  bodyFont: { size: 11 },
} as const;

/**
 * Display-currency-aware Chart.js option factories for analytics/dashboard charts.
 *
 * Options are returned as `computed` so axis ticks and tooltips re-render whenever
 * the user changes their display currency. Chart data stays in stored USD — only the
 * tick/tooltip labels are converted via `formatAmount`.
 */
export function useCurrencyChartOptions() {
  const { formatAmount, displayCurrency } = useCurrency();

  const lineChartOptions = computed<ChartOptions<'line'>>(() => {
    void displayCurrency.value; // establish reactive dep so ticks refresh on currency change
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltipStyle,
          callbacks: {
            label: (context) => {
              const value = context.raw as number;
              if (value === null || value === undefined) {
                return '';
              }
              return `${context.dataset.label}: ${formatAmount(value)}`;
            },
          },
        },
      },
      scales: {
        y: {
          ticks: { callback: value => formatAmount(value as number), color: TICK_COLOR, font: { size: 10 } },
          grid: { color: GRID_COLOR },
          border: { display: false },
        },
        x: {
          ticks: { color: TICK_COLOR, font: { size: 10 }, maxRotation: 45, minRotation: 45 },
          grid: { display: false },
          border: { display: false },
        },
      },
      elements: {
        point: { radius: 0, hoverRadius: 5, hoverBorderWidth: 2 },
        line: { borderWidth: 2 },
      },
    };
  });

  const barChartOptions = computed<ChartOptions<'bar'>>(() => {
    void displayCurrency.value;
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltipStyle,
          callbacks: {
            label: context => formatAmount(context.raw as number),
          },
        },
      },
      scales: {
        y: {
          ticks: { callback: value => formatAmount(value as number), color: TICK_COLOR, font: { size: 10 } },
          grid: { color: GRID_COLOR },
          border: { display: false },
        },
        x: {
          ticks: { color: TICK_COLOR, font: { size: 10 }, maxRotation: 45, minRotation: 45 },
          grid: { display: false },
          border: { display: false },
        },
      },
    };
  });

  const percentLineChartOptions = computed<ChartOptions<'line'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipStyle,
        callbacks: {
          label: (context) => {
            const value = context.raw as number;
            if (value === null || value === undefined) {
              return '';
            }
            return `${context.dataset.label}: ${value.toFixed(1)}%`;
          },
        },
      },
    },
    scales: {
      y: {
        ticks: { callback: value => `${Number(value).toFixed(0)}%`, color: TICK_COLOR, font: { size: 10 } },
        grid: { color: GRID_COLOR },
        border: { display: false },
      },
      x: {
        ticks: { color: TICK_COLOR, font: { size: 10 }, maxRotation: 45, minRotation: 45 },
        grid: { display: false },
        border: { display: false },
      },
    },
    elements: {
      point: { radius: 0, hoverRadius: 5, hoverBorderWidth: 2 },
      line: { borderWidth: 2 },
    },
  }));

  return { lineChartOptions, barChartOptions, percentLineChartOptions };
}
