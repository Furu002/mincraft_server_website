import { PNG } from "pngjs";

function rgb(hex) {
  const clean = hex.replace("#", "");
  return [
    Number.parseInt(clean.slice(0, 2), 16),
    Number.parseInt(clean.slice(2, 4), 16),
    Number.parseInt(clean.slice(4, 6), 16),
  ];
}

function setPixel(png, x, y, color) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return;
  const index = (png.width * y + x) << 2;
  png.data[index] = color[0];
  png.data[index + 1] = color[1];
  png.data[index + 2] = color[2];
  png.data[index + 3] = 255;
}

function fillRect(png, x, y, width, height, color) {
  const xStart = Math.max(0, Math.floor(x));
  const yStart = Math.max(0, Math.floor(y));
  const xEnd = Math.min(png.width, Math.ceil(x + width));
  const yEnd = Math.min(png.height, Math.ceil(y + height));
  for (let nextY = yStart; nextY < yEnd; nextY += 1) {
    for (let nextX = xStart; nextX < xEnd; nextX += 1) {
      setPixel(png, nextX, nextY, color);
    }
  }
}

function drawLine(png, x0, y0, x1, y1, color, thickness = 2) {
  let startX = Math.round(x0);
  let startY = Math.round(y0);
  const endX = Math.round(x1);
  const endY = Math.round(y1);
  const dx = Math.abs(endX - startX);
  const sx = startX < endX ? 1 : -1;
  const dy = -Math.abs(endY - startY);
  const sy = startY < endY ? 1 : -1;
  let error = dx + dy;

  while (true) {
    fillRect(png, startX - Math.floor(thickness / 2), startY - Math.floor(thickness / 2), thickness, thickness, color);
    if (startX === endX && startY === endY) break;
    const twiceError = 2 * error;
    if (twiceError >= dy) {
      error += dy;
      startX += sx;
    }
    if (twiceError <= dx) {
      error += dx;
      startY += sy;
    }
  }
}

function pointFor(index, total, value, minValue, maxValue, bounds) {
  const x = bounds.left + (index / Math.max(1, total - 1)) * bounds.width;
  const ratio = (value - minValue) / Math.max(1, maxValue - minValue);
  const y = bounds.top + (1 - ratio) * bounds.height;
  return { x, y };
}

export function createStockChart(stock) {
  const width = 760;
  const height = 300;
  const png = new PNG({ width, height });
  const background = rgb("#fbfbfb");
  const grid = rgb("#e9edf2");
  const axis = rgb("#b7bec8");
  const red = rgb("#ff5a66");
  const blue = rgb("#5b9cff");
  const volume = rgb("#8c6cf0");
  const neutral = rgb("#9098a3");

  fillRect(png, 0, 0, width, height, background);

  const history = Array.isArray(stock?.history) && stock.history.length
    ? stock.history
    : [{ close: Number(stock?.price) || 0, open: Number(stock?.open24h) || Number(stock?.price) || 0, volume: 0 }];
  const closes = history.map((item) => Number(item.close ?? item.price ?? 0)).filter(Number.isFinite);
  const open24h = Number(stock?.open24h ?? history[0]?.open ?? closes[0] ?? 0);
  const maxValue = Math.max(...closes, open24h);
  const minValue = Math.min(...closes, open24h);
  const bounds = { left: 34, top: 18, width: width - 64, height: 205 };
  const volumeBounds = { left: bounds.left, top: 238, width: bounds.width, height: 42 };

  for (let i = 0; i <= 4; i += 1) {
    const y = bounds.top + (bounds.height / 4) * i;
    fillRect(png, bounds.left, y, bounds.width, 1, grid);
  }
  for (let i = 0; i <= 5; i += 1) {
    const x = bounds.left + (bounds.width / 5) * i;
    fillRect(png, x, bounds.top, 1, volumeBounds.top + volumeBounds.height - bounds.top, grid);
  }

  const openPoint = pointFor(0, 1, open24h, minValue, maxValue, bounds);
  fillRect(png, bounds.left, openPoint.y, bounds.width, 1, axis);

  const maxVolume = Math.max(1, ...history.map((item) => Number(item.volume) || 0));
  history.forEach((item, index) => {
    const barWidth = Math.max(2, Math.floor(volumeBounds.width / Math.max(24, history.length)) - 1);
    const x = volumeBounds.left + (index / Math.max(1, history.length - 1)) * volumeBounds.width;
    const barHeight = Math.max(1, ((Number(item.volume) || 0) / maxVolume) * volumeBounds.height);
    fillRect(png, x, volumeBounds.top + volumeBounds.height - barHeight, barWidth, barHeight, volume);
  });

  for (let index = 1; index < history.length; index += 1) {
    const previousValue = Number(history[index - 1].close ?? history[index - 1].price ?? 0);
    const value = Number(history[index].close ?? history[index].price ?? 0);
    const previous = pointFor(index - 1, history.length, previousValue, minValue, maxValue, bounds);
    const current = pointFor(index, history.length, value, minValue, maxValue, bounds);
    const color = value >= open24h ? red : blue;
    drawLine(png, previous.x, previous.y, current.x, current.y, color, 3);
  }

  if (history.length === 1) {
    const point = pointFor(0, 1, closes[0] || open24h, minValue, maxValue, bounds);
    fillRect(png, point.x - 2, point.y - 2, 5, 5, closes[0] >= open24h ? red : blue);
  }

  fillRect(png, bounds.left, bounds.top + bounds.height, bounds.width, 1, neutral);
  return PNG.sync.write(png);
}
