const BASE_URL = "http://localhost:3000";
const MOCK_USER = "user_3GM79cfWQK57yjbtQoitBHwjJdH";
const MOCK_PATH = "ed45edb5-77d7-45df-89ac-fa89c50c4dd4";

async function measureSolveDoubt() {
  const latencies = [];
  const ttfbs = [];
  console.log("\n--- Benchmarking /api/solve-doubt (3 runs) ---");

  for (let i = 1; i <= 3; i++) {
    const start = Date.now();
    let ttfb = null;
    
    try {
      const res = await fetch(`${BASE_URL}/api/solve-doubt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-mock-user-id": MOCK_USER,
        },
        body: JSON.stringify({
          message: "What is Newton's second law of motion?",
          learningPathId: MOCK_PATH,
          effort: "low",
        }),
      });

      if (!res.ok) {
        throw new Error(`Status ${res.status}: ${await res.text()}`);
      }

      const reader = res.body.getReader();
      while (true) {
        const { done } = await reader.read();
        if (ttfb === null) {
          ttfb = Date.now() - start;
          ttfbs.push(ttfb);
        }
        if (done) break;
      }

      const total = Date.now() - start;
      latencies.push(total);
      console.log(`Run ${i}: TTFB = ${ttfb}ms, Total = ${total}ms`);
    } catch (err) {
      console.error(`Run ${i} failed:`, err.message);
    }
  }

  if (latencies.length > 0) {
    const sortedTotal = [...latencies].sort((a, b) => a - b);
    const sortedTtfb = [...ttfbs].sort((a, b) => a - b);
    console.log(`Solve Doubt Total: p50 = ${getP50(sortedTotal)}ms, p95 = ${getP95(sortedTotal)}ms`);
    console.log(`Solve Doubt TTFB: p50 = ${getP50(sortedTtfb)}ms, p95 = ${getP95(sortedTtfb)}ms`);
  }
}

async function measureGenerateQuiz() {
  const latencies = [];
  console.log("\n--- Benchmarking /api/generate-quiz (3 runs) ---");

  for (let i = 1; i <= 3; i++) {
    const start = Date.now();
    try {
      const res = await fetch(`${BASE_URL}/api/generate-quiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-mock-user-id": MOCK_USER,
        },
        body: JSON.stringify({
          learningPathId: MOCK_PATH,
        }),
      });

      const data = await res.json();
      const total = Date.now() - start;
      latencies.push(total);
      console.log(`Run ${i}: Total = ${total}ms (Cached: ${!!data.cached})`);
    } catch (err) {
      console.error(`Run ${i} failed:`, err.message);
    }
  }

  if (latencies.length > 0) {
    const sorted = [...latencies].sort((a, b) => a - b);
    console.log(`Generate Quiz: p50 = ${getP50(sorted)}ms, p95 = ${getP95(sorted)}ms`);
  }
}

async function measureGeneratePath() {
  const latencies = [];
  console.log("\n--- Benchmarking /api/generate-path (3 runs) ---");

  for (let i = 1; i <= 3; i++) {
    const start = Date.now();
    try {
      const res = await fetch(`${BASE_URL}/api/generate-path`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-mock-user-id": MOCK_USER,
        },
        body: JSON.stringify({
          learningPathId: MOCK_PATH,
        }),
      });

      const data = await res.json();
      const total = Date.now() - start;
      latencies.push(total);
      console.log(`Run ${i}: Total = ${total}ms (Status: ${data.status || "done"}, Cached: ${!!data.cached})`);
    } catch (err) {
      console.error(`Run ${i} failed:`, err.message);
    }
  }

  if (latencies.length > 0) {
    const sorted = [...latencies].sort((a, b) => a - b);
    console.log(`Generate Path: p50 = ${getP50(sorted)}ms, p95 = ${getP95(sorted)}ms`);
  }
}

function getP50(sorted) {
  const index = Math.floor(sorted.length * 0.5);
  return sorted[index];
}

function getP95(sorted) {
  const index = Math.ceil(sorted.length * 0.95) - 1;
  return sorted[Math.max(0, index)];
}

async function run() {
  await measureSolveDoubt();
  await measureGenerateQuiz();
  await measureGeneratePath();
}

run();
