export const CHART_COLORS = ['#0085ff', '#7b61ff', '#06b6d4', '#f59e0b', '#8b5cf6', '#3b82f6'];

const WORD_CLOUD_PALETTE_LIGHT = [
  '#0085ff',
  '#7b61ff',
  '#6d3fd4',
  '#0ea5e9',
  '#6366f1',
  '#9568f5',
  '#0070d6',
];

const WORD_CLOUD_PALETTE_DARK = [
  '#7dd3fc',
  '#c4b5fd',
  '#a78bfa',
  '#67e8f9',
  '#818cf8',
  '#e879f9',
  '#93c5fd',
];

export type WordCloudItem = { name: string; value: number };

type WordCloudDatum = WordCloudItem & {
  textStyle: {
    fontFamily: string;
    fontWeight: number;
    color: string;
    shadowBlur?: number;
    shadowColor?: string;
  };
};

const WORD_CLOUD_FALLBACK: WordCloudItem[] = [
  { name: 'Machine Learning', value: 1000 },
  { name: 'Transformers', value: 920 },
  { name: 'Neural Networks', value: 800 },
  { name: 'LLM', value: 760 },
  { name: 'Deep Learning', value: 680 },
  { name: 'Computer Vision', value: 540 },
  { name: 'Diffusion', value: 480 },
  { name: 'Reinforcement Learning', value: 420 },
  { name: 'Graph Neural Net', value: 360 },
  { name: 'Multimodal', value: 300 },
  { name: 'Fine-tuning', value: 260 },
  { name: 'Embeddings', value: 220 },
];

const TOPIC_RACE_FALLBACK = {
  labels: ['cs.AI', 'cs.LG', 'cs.CV', 'cs.CL'],
  values: [120, 200, 150, 80],
};

function toNumber(value: unknown, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function extractArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== 'object') return [];

  const obj = raw as Record<string, unknown>;
  return (
    (Array.isArray(obj.data) && obj.data) ||
    (Array.isArray(obj.keywords) && obj.keywords) ||
    (Array.isArray(obj.items) && obj.items) ||
    (Array.isArray(obj.topics) && obj.topics) ||
    (Array.isArray(obj.results) && obj.results) ||
    []
  );
}

export function normalizeWordCloudData(raw: unknown): WordCloudItem[] {
  const items = extractArray(raw);

  const normalized = items
    .map((item) => {
      if (typeof item === 'string') {
        return { name: item, value: 1 };
      }
      if (!item || typeof item !== 'object') return null;

      const entry = item as Record<string, unknown>;
      const name = String(
        entry.name ?? entry.text ?? entry.keyword ?? entry.label ?? entry.term ?? ''
      ).trim();
      const value = toNumber(
        entry.value ?? entry.weight ?? entry.count ?? entry.frequency ?? entry.score,
        1
      );

      if (!name) return null;
      return { name, value: Math.max(value, 1) };
    })
    .filter((item): item is WordCloudItem => item !== null);

  return normalized.length > 0 ? normalized : WORD_CLOUD_FALLBACK;
}

function enrichWordCloudItems(items: WordCloudItem[], isDark: boolean): WordCloudDatum[] {
  if (items.length === 0) return [];

  const values = items.map((item) => item.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const palette = isDark ? WORD_CLOUD_PALETTE_DARK : WORD_CLOUD_PALETTE_LIGHT;

  return [...items]
    .sort((a, b) => b.value - a.value)
    .map((item, index) => {
      const ratio = max === min ? 1 : (item.value - min) / (max - min);
      const color = palette[index % palette.length];

      return {
        name: item.name,
        value: item.value,
        textStyle: {
          fontFamily:
            ratio > 0.55
              ? '"Syne", "Outfit", sans-serif'
              : '"Outfit", "Inter", sans-serif',
          fontWeight: ratio > 0.8 ? 800 : ratio > 0.55 ? 700 : ratio > 0.3 ? 600 : 500,
          color,
          shadowBlur: ratio > 0.65 ? (isDark ? 14 : 10) : 0,
          shadowColor: isDark ? 'rgba(167,139,250,0.5)' : 'rgba(0,133,255,0.28)',
        },
      };
    });
}

export function buildWordCloudChartOption(items: WordCloudItem[], isDark: boolean) {
  const data = enrichWordCloudItems(items, isDark);

  return {
    backgroundColor: 'transparent',
    tooltip: {
      show: true,
      backgroundColor: isDark ? 'rgba(8, 33, 81, 0.94)' : 'rgba(255, 255, 255, 0.96)',
      borderColor: isDark ? 'rgba(149, 104, 245, 0.45)' : 'rgba(0, 133, 255, 0.28)',
      borderWidth: 1,
      padding: [10, 14],
      textStyle: {
        color: isDark ? '#ffffff' : '#000000',
        fontFamily: 'Outfit, Inter, sans-serif',
        fontSize: 13,
      },
      formatter: (params: { name?: string; value?: number }) =>
        `<strong>${params.name ?? ''}</strong><br/>Mentions: <b>${params.value ?? 0}</b>`,
    },
    series: [
      {
        type: 'wordCloud',
        shape: 'circle',
        left: 'center',
        top: 'center',
        width: '98%',
        height: '92%',
        sizeRange: [15, 58],
        rotationRange: [-28, 28],
        rotationStep: 14,
        gridSize: 5,
        drawOutOfBound: false,
        layoutAnimation: true,
        textStyle: {
          fontFamily: '"Outfit", "Inter", sans-serif',
          fontWeight: 500,
        },
        emphasis: {
          focus: 'self',
          textStyle: {
            fontFamily: '"Syne", "Outfit", sans-serif',
            fontWeight: 800,
            shadowBlur: 18,
            shadowColor: isDark ? 'rgba(232, 121, 249, 0.55)' : 'rgba(123, 97, 255, 0.4)',
          },
        },
        data,
      },
    ],
  };
}

export function normalizeTopicRaceData(raw: unknown) {
  if (!raw || typeof raw !== 'object') {
    return TOPIC_RACE_FALLBACK;
  }

  const obj = raw as Record<string, unknown>;

  if (Array.isArray(obj.labels) && Array.isArray(obj.values)) {
    const labels = obj.labels.map(String);
    const values = obj.values.map((value) => toNumber(value));
    if (labels.length > 0 && values.some((value) => value > 0)) {
      return { labels, values };
    }
  }

  const items = extractArray(raw);
  if (items.length > 0) {
    const labels = items.map((item) => {
      if (typeof item === 'string') return item;
      const entry = item as Record<string, unknown>;
      return String(entry.topic ?? entry.code ?? entry.label ?? entry.name ?? '');
    });
    const values = items.map((item) => {
      if (typeof item === 'string') return 0;
      const entry = item as Record<string, unknown>;
      return toNumber(
        entry.value ?? entry.count ?? entry.paperCount ?? entry.total ?? entry.score
      );
    });

    const pairs = labels
      .map((label, index) => ({ label, value: values[index] ?? 0 }))
      .filter((pair) => pair.label);

    if (pairs.length > 0 && pairs.some((pair) => pair.value > 0)) {
      return {
        labels: pairs.map((pair) => pair.label),
        values: pairs.map((pair) => pair.value),
      };
    }
  }

  return TOPIC_RACE_FALLBACK;
}
