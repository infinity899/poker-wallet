import type { ChartOptions } from 'chart.js';

/**
 * Display-currency-aware Chart.js option factories for analytics/dashboard charts.
 *
 * Options are returned as `computed` so axis ticks and tooltips re-render whenever
 * the user changes their display currency. Chart data stays in stored USD — only the
 * tick/tooltip labels are converted via `formatAmount`.
 *
 * Colors come from the Luminance token layer via `useThemeTokens()`, so the same
 * computed also re-runs on a light/dark flip. (These used to be hardcoded slate
 * literals, which meant chart chrome stayed dark-mode-colored in light mode.)
 */
export function useCurrencyChartOptions() {
  const { formatAmount, displayCurrency } = useCurrency();
  const { tokens } = useThemeTokens();

  const tooltipStyle = computed(() => ({
    ...tokens.value.tooltip,
    borderWidth: 1,
    padding: 12,
    cornerRadius: 8,
    titleFont: { size: 12, weight: 600 as const },
    bodyFont: { size: 11 },
  }));

  const lineChartOptions = computed<ChartOptions<'line'>>(() => {
    void displayCurrency.value; // establish reactive dep so ticks refresh on currency change
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltipStyle.value,
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
          ticks: { callback: value => formatAmount(value as number), color: tokens.value.tick, font: { size: 10 } },
          grid: { color: tokens.value.grid },
          border: { display: false },
        },
        x: {
          ticks: { color: tokens.value.tick, font: { size: 10 }, maxRotation: 45, minRotation: 45 },
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
          ...tooltipStyle.value,
          callbacks: {
            label: context => formatAmount(context.raw as number),
          },
        },
      },
      scales: {
        y: {
          ticks: { callback: value => formatAmount(value as number), color: tokens.value.tick, font: { size: 10 } },
          grid: { color: tokens.value.grid },
          border: { display: false },
        },
        x: {
          ticks: { color: tokens.value.tick, font: { size: 10 }, maxRotation: 45, minRotation: 45 },
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
        ...tooltipStyle.value,
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
        ticks: { callback: value => `${Number(value).toFixed(0)}%`, color: tokens.value.tick, font: { size: 10 } },
        grid: { color: tokens.value.grid },
        border: { display: false },
      },
      x: {
        ticks: { color: tokens.value.tick, font: { size: 10 }, maxRotation: 45, minRotation: 45 },
        grid: { display: false },
        border: { display: false },
      },
    },
    elements: {
      point: { radius: 0, hoverRadius: 5, hoverBorderWidth: 2 },
      line: { borderWidth: 2 },
    },
  }));

  /**
   * Minimal inline chart (sparkline): no axes, grid or legend — just the shape,
   * with a currency-aware tooltip on hover.
   */
  const sparklineChartOptions = computed<ChartOptions<'line'>>(() => {
    void displayCurrency.value;
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltipStyle.value,
          displayColors: false,
          callbacks: {
            label: (context) => {
              const value = context.raw as number;
              if (value === null || value === undefined) {
                return '';
              }
              return formatAmount(value);
            },
          },
        },
      },
      scales: {
        x: { display: false },
        y: { display: false },
      },
      elements: {
        point: { radius: 0, hoverRadius: 4, hoverBorderWidth: 2 },
        line: { borderWidth: 2 },
      },
    };
  });

  const pieChartOptions = computed<ChartOptions<'pie'>>(() => {
    void displayCurrency.value; // refresh tooltip amounts when display currency changes
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            color: tokens.value.tick,
            font: { size: 11 },
            padding: 12,
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 8,
            boxHeight: 8,
          },
        },
        tooltip: {
          ...tooltipStyle.value,
          callbacks: {
            label: (context) => {
              const value = context.parsed as number;
              const data = context.dataset.data as number[];
              const total = data.reduce((sum, v) => sum + (v ?? 0), 0);
              const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
              return `${context.label}: ${formatAmount(value)} (${pct}%)`;
            },
          },
        },
      },
    };
  });

  return {
    lineChartOptions,
    barChartOptions,
    percentLineChartOptions,
    sparklineChartOptions,
    pieChartOptions,
  };
}
