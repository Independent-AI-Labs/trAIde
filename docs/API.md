TATS API Overview

This document summarizes the primary exported functions. See source for detailed JSDoc.

- Module `trend`:
  - `smaIndicator`, `emaIndicator`, `macd`, `macdSignal`, `macdDiff`
  - `adx`, `adxPos`, `adxNeg`
  - `trix`, `massIndex`, `ichimoku`, `ichimokuShifted`, `ichimokuDisplay`, `stc`, `dpo`, `kst`, `aroon`
  - `vortexIndicatorPos/Neg/Diff`

- Module `momentum`:
  - `rsi`, `stochastic`
  - `roc`, `kama`, `tsi`, `ultimateOscillator`, `williamsR`
  - `awesomeOscillator`, `ppo`, `ppoSignal`, `ppoHist`, `pvo`, `pvoSignal`, `pvoHist`
  - `stochRsi`, `stochRsiK`, `stochRsiD`

- Module `volatility`:
  - `bollingerMavg`, `bollingerHband`, `bollingerLband`, `bollingerWband`, `bollingerPband`
  - `bollingerHbandIndicator`, `bollingerLbandIndicator`
  - `atr`, `keltnerChannel`, `donchianChannel`, `ulcerIndex`

- Module `volume`:
  - `onBalanceVolume`, `accumulationDistributionIndex`, `chaikinMoneyFlow`
  - `forceIndex`, `easeOfMovement`
  - `volumePriceTrend`, `moneyFlowIndex`, `negativeVolumeIndex`, `vwap`
  - `chaikinOscillator`

Usage snippets

- Ichimoku (display-ready):
  const { tenkan, kijun, spanA_fwd, spanB_fwd, chikou } = trend.ichimokuDisplay(high, low, close);

- StochRSI with %K/%D:
  const k = momentum.stochRsiK(close, 14, 3);
  const d = momentum.stochRsiD(close, 14, 3, 3);

- Bollinger indicators (cross up/down):
  const up = volatility.bollingerHbandIndicator(close);
  const down = volatility.bollingerLbandIndicator(close);

- Chaikin Oscillator:
  const osc = volume.chaikinOscillator(high, low, close, volume);

- Returns:
  const r = returns.dailyReturn(close);
  const lr = returns.logReturn(close);
  const cr = returns.cumulativeReturn(close);

- Module `returns`:
  - `dailyReturn`, `logReturn`, `cumulativeReturn`
