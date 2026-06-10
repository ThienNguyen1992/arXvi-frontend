/** Single text color — readable on soft gradient backgrounds below */
export const CATEGORY_TAG_TEXT_COLOR = "#F5F8FC"

const CATEGORY_TAG_GRADIENTS = [
  { from: "#4325C8", to: "#9D70F8" },
  { from: "#9E15D9", to: "#E05CF8" },
  { from: "#1D49E6", to: "#68A6FC" },
  { from: "#0F7A3D", to: "#39E58C" },
  { from: "#864129", to: "#FFAA55" },
  { from: "#8505C4", to: "#CE3DF3" },
  { from: "#009FB3", to: "#45E5ED" },
  { from: "#3B1EBA", to: "#5F37E9" },
  { from: "#C72017", to: "#FC4079" },
  { from: "#2556ED", to: "#0DCfdc" },
  { from: "#EA2654", to: "#FF7A2B" },
  { from: "#0ABD42", to: "#92F21D" },
] as const

export interface CategoryTagStyle {
  background: string
  borderColor: string
}

export interface CategoryTag {
  label: string
  background: string
  borderColor: string
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "")
  const r = parseInt(normalized.slice(0, 2), 16)
  const g = parseInt(normalized.slice(2, 4), 16)
  const b = parseInt(normalized.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function gradientStyleFromIndex(index: number): CategoryTagStyle {
  const pair = CATEGORY_TAG_GRADIENTS[index % CATEGORY_TAG_GRADIENTS.length]
  const variant = Math.floor(index / CATEGORY_TAG_GRADIENTS.length)
  const fromAlpha = Math.max(0.32, 0.55 - variant * 0.06)
  const toAlpha = Math.min(0.45, 0.28 + variant * 0.05)

  return {
    background: `linear-gradient(135deg, ${hexToRgba(pair.from, fromAlpha)} 0%, ${hexToRgba(pair.to, toAlpha)} 100%)`,
    borderColor: hexToRgba(pair.from, Math.max(0.28, 0.4 - variant * 0.05)),
  }
}

/** Assign a unique gradient per topic code (stable across reloads). */
export function buildTopicTagStyleMap(topicCodes: string[]) {
  const uniqueCodes = [...new Set(topicCodes)].sort((a, b) => a.localeCompare(b))
  const styleByTopicCode = new Map<string, CategoryTagStyle>()

  uniqueCodes.forEach((code, index) => {
    styleByTopicCode.set(code, gradientStyleFromIndex(index))
  })

  return styleByTopicCode
}

/** Pick the next style not already used on the current card. */
export function pickUniqueTagStyle(
  preferred: CategoryTagStyle | undefined,
  usedBackgrounds: Set<string>,
  startIndex: number
): CategoryTagStyle {
  if (preferred && !usedBackgrounds.has(preferred.background)) {
    return preferred
  }

  for (let i = startIndex; i < startIndex + CATEGORY_TAG_GRADIENTS.length * 4; i++) {
    const candidate = gradientStyleFromIndex(i)
    if (!usedBackgrounds.has(candidate.background)) {
      return candidate
    }
  }

  return gradientStyleFromIndex(startIndex)
}
