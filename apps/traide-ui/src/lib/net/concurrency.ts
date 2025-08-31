export function createLimiter(max = 6) {
  let running = 0
  const queue: Array<() => void> = []
  const runNext = () => {
    if (running >= max) return
    const job = queue.shift()
    if (!job) return
    running++
    job()
  }
  const schedule = <T>(fn: () => Promise<T>) =>
    new Promise<T>((resolve, reject) => {
      const task = () => {
        fn().then(resolve, reject).finally(() => { running--; runNext() })
      }
      queue.push(task)
      runNext()
    })
  return { schedule }
}

