import { calculateSM2, mapRatingToQuality } from "../lib/spaced-repetition";

function runTests() {
  console.log("🧪 Running SM-2 Spaced Repetition Algorithm Tests...\n");

  // Test Case 1: First time learning a card and selecting "Good"
  console.log("Test Case 1: Initial review with 'Good'");
  let state = calculateSM2(mapRatingToQuality("good"), 0, 1, 2.5);
  console.log(`- Repetitions: ${state.repetitions} (Expected: 1)`);
  console.log(`- Interval: ${state.interval} (Expected: 1)`);
  console.log(`- Ease Factor: ${state.easeFactor.toFixed(2)} (Expected: 2.50)`);
  console.log(`- Next Review: ${state.nextReviewDate.toLocaleDateString()}\n`);

  if (state.repetitions !== 1 || state.interval !== 1) {
    throw new Error("Test Case 1 Failed!");
  }

  // Test Case 2: Second review with "Good" (should jump to interval 6)
  console.log("Test Case 2: Second review with 'Good'");
  state = calculateSM2(mapRatingToQuality("good"), state.repetitions, state.interval, state.easeFactor);
  console.log(`- Repetitions: ${state.repetitions} (Expected: 2)`);
  console.log(`- Interval: ${state.interval} (Expected: 6)`);
  console.log(`- Ease Factor: ${state.easeFactor.toFixed(2)} (Expected: 2.50)`);
  console.log(`- Next Review: ${state.nextReviewDate.toLocaleDateString()}\n`);

  if (state.repetitions !== 2 || state.interval !== 6) {
    throw new Error("Test Case 2 Failed!");
  }

  // Test Case 3: Third review with "Easy" (ease factor should increase, interval should scale by ease factor)
  console.log("Test Case 3: Third review with 'Easy'");
  const oldEF = state.easeFactor;
  state = calculateSM2(mapRatingToQuality("easy"), state.repetitions, state.interval, state.easeFactor);
  const expectedInterval = Math.round(6 * oldEF);
  console.log(`- Repetitions: ${state.repetitions} (Expected: 3)`);
  console.log(`- Interval: ${state.interval} (Expected: ${expectedInterval})`);
  console.log(`- Ease Factor: ${state.easeFactor.toFixed(2)} (Expected: > ${oldEF.toFixed(2)})`);
  console.log(`- Next Review: ${state.nextReviewDate.toLocaleDateString()}\n`);

  if (state.repetitions !== 3 || state.interval !== expectedInterval || state.easeFactor <= oldEF) {
    throw new Error("Test Case 3 Failed!");
  }

  // Test Case 4: Fourth review with "Again" (incorrect response, resets repetition count, sets interval to 1 day)
  console.log("Test Case 4: Review with 'Again' (Fail)");
  state = calculateSM2(mapRatingToQuality("again"), state.repetitions, state.interval, state.easeFactor);
  console.log(`- Repetitions: ${state.repetitions} (Expected: 0)`);
  console.log(`- Interval: ${state.interval} (Expected: 1)`);
  console.log(`- Ease Factor: ${state.easeFactor.toFixed(2)}`);
  console.log(`- Next Review: ${state.nextReviewDate.toLocaleDateString()}\n`);

  if (state.repetitions !== 0 || state.interval !== 1) {
    throw new Error("Test Case 4 Failed!");
  }

  console.log("✅ All spaced repetition algorithm tests passed successfully!");
}

try {
  runTests();
} catch (e: any) {
  console.error("❌ Test run error:", e.message);
  process.exit(1);
}
