const NEED_COLOR_SCALE = ["#ffe3c2", "#ffbb73", "#ff8a3d", "#e8590c", "#a12a1e"];
const NO_DATA_COLOR = "#e9e6e0";

export function needColor(needIndex) {
  if (!needIndex) return NO_DATA_COLOR;
  const step = Math.min(Math.max(Math.round(needIndex), 1), 5) - 1;
  return NEED_COLOR_SCALE[step];
}
