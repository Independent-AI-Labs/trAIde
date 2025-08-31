export function ema(values: number[], period: number) {
  const k = 2 / (period + 1)
  let emaPrev = 0
  const out: number[] = []
  for (let i = 0; i < values.length; i++) {
    const v = values[i]
    if (i === 0) emaPrev = v
    else emaPrev = v * k + emaPrev * (1 - k)
    out.push(emaPrev)
  }
  return out
}

export function rsi(closes: number[], period = 14) {
  let gains = 0
  let losses = 0
  const out: number[] = []
  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1]
    const gain = Math.max(0, change)
    const loss = Math.max(0, -change)
    if (i <= period) {
      gains += gain
      losses += loss
      out.push(NaN)
      continue
    }
    if (i === period + 1) {
      gains = gains / period
      losses = losses / period
    } else {
      gains = (gains * (period - 1) + gain) / period
      losses = (losses * (period - 1) + loss) / period
    }
    const rs = losses === 0 ? 100 : gains / (losses || 1e-12)
    const val = 100 - 100 / (1 + rs)
    out.push(val)
  }
  return out
}

export function ppo(closes: number[], fast = 12, slow = 26, signal = 9) {
  const emaFast = ema(closes, fast)
  const emaSlow = ema(closes, slow)
  const ppoLine = emaFast.map((v, i) => ((v - emaSlow[i]) / (emaSlow[i] || 1e-12)) * 100)
  const signalLine = ema(ppoLine, signal)
  const hist = ppoLine.map((v, i) => v - signalLine[i])
  return { ppo: ppoLine, signal: signalLine, hist }
}

