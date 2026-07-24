<template>
  <div class="card p-4 lg:p-6">
    <h3 class="text-sm font-semibold text-foreground dark:text-foreground-dark mb-4">
      Cumulative Profit
    </h3>
    <div class="h-64">
      <Line
        v-if="(chartData.labels?.length ?? 0) > 0"
        :data="chartData"
        :options="chartOptions"
      />
      <div v-else class="h-full flex items-center justify-center text-foreground-muted dark:text-foreground-dark-muted text-sm">
        No results yet
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChartData, ChartOptions } from 'chart.js';
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { Line } from 'vue-chartjs';
import { COMMUNITY_COMBINED_COLOR, COMMUNITY_MEMBER_COLORS } from '~/types/community';
import { formatCurrency } from '~/utils/formatters';

const props = defineProps<{
  communityId: string;
}>();

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const communitiesStore = useCommunitiesStore();
const themeStore = useThemeStore();

const chartData = computed<ChartData<'line'>>(() => {
  // Get per-member cumulative data (all members aligned on same dates)
  const perMemberData = communitiesStore.getPerMemberCumulativeProfitData(props.communityId);

  // All members share the same date axis, so the first member defines the labels.
  const axis = perMemberData[0];
  if (!axis || axis.data.length === 0) {
    return { labels: [], datasets: [] };
  }

  const labels = axis.data.map(d =>
    new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  );

  const datasets: ChartData<'line'>['datasets'] = [];

  // Calculate combined line by summing all members at each date point
  const combinedData = axis.data.map((_, dateIndex) => {
    return perMemberData.reduce((sum, member) => {
      return sum + (member.data[dateIndex]?.profit || 0);
    }, 0);
  });

  // Add combined line
  datasets.push({
    label: 'Combined',
    data: combinedData,
    borderColor: COMMUNITY_COMBINED_COLOR,
    backgroundColor: `${COMMUNITY_COMBINED_COLOR.replace('rgb', 'rgba').replace(')', ', 0.1)')}`,
    borderWidth: 3,
    fill: true,
    tension: 0.4,
    pointRadius: 0,
    pointHoverRadius: 6,
  });

  // Add individual member lines (max 8 for readability)
  const displayMembers = perMemberData.slice(0, 8);
  displayMembers.forEach((memberInfo, index) => {
    if (memberInfo.data.length > 0) {
      const color = COMMUNITY_MEMBER_COLORS[index % COMMUNITY_MEMBER_COLORS.length];

      datasets.push({
        label: memberInfo.displayName,
        data: memberInfo.data.map(d => d.profit),
        borderColor: color,
        backgroundColor: 'transparent',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
      });
    }
  });

  return { labels, datasets };
});

const chartOptions = computed<ChartOptions<'line'>>(() => {
  const isDark = themeStore.isDark;

  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          color: isDark ? '#cbd5e1' : '#475569',
          boxWidth: 12,
          boxHeight: 12,
          padding: 12,
          font: {
            size: 11,
          },
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDark ? '#f8fafc' : '#0f172a',
        bodyColor: isDark ? '#cbd5e1' : '#475569',
        borderColor: isDark ? 'rgba(248, 250, 252, 0.1)' : 'rgba(15, 23, 42, 0.1)',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y ?? 0;
            return `${context.dataset.label}: ${formatCurrency(value)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: isDark ? '#64748b' : '#94a3b8',
          font: {
            size: 11,
          },
          maxRotation: 0,
        },
        border: {
          display: false,
        },
      },
      y: {
        grid: {
          color: isDark ? 'rgba(248, 250, 252, 0.05)' : 'rgba(15, 23, 42, 0.05)',
        },
        ticks: {
          color: isDark ? '#64748b' : '#94a3b8',
          font: {
            size: 11,
          },
          callback: (value) => {
            if (typeof value === 'number') {
              return formatCurrency(value);
            }
            return value;
          },
        },
        border: {
          display: false,
        },
      },
    },
  };
});
</script>
