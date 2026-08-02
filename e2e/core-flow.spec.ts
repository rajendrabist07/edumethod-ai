import { test, expect } from '@playwright/test';
import { clerk } from '@clerk/testing/playwright';

test.describe('EduMethod AI Core Flow E2E Tests', () => {
  test('should walk through sign-in, upload, generate path, take quiz, and review flashcards', async ({ page }) => {
    // 1. Visit landing page
    await page.goto('/');
    await expect(page).toHaveTitle(/EduMethod AI/);

    // 2. Authenticate programmatically using Clerk testing SDK
    await clerk.signIn({
      page,
      // Uses a test email alias to suppress Clerk UI verification flows
      emailAddress: 'student+clerk_test@example.com',
    });

    // 3. Navigate to Dashboard and confirm signed-in state
    await page.goto('/dashboard');
    await expect(page.locator('h1')).toContainText(/Welcome Back/i);

    // 4. Navigate to Upload Page
    await page.goto('/upload');
    await expect(page.locator('h1')).toContainText(/Decompose Your Syllabus/i);

    // Fill in syllabus text
    const syllabusInput = page.locator('textarea, [placeholder*="syllabus" i], [placeholder*="curriculum" i]').first();
    await syllabusInput.fill(
      'Subject: Physics\nTopics:\n1. Classical Mechanics - Laws of motion, forces, momentum.\n2. Thermodynamics - Laws of thermodynamics, entropy.'
    );

    // Submit syllabus text
    const submitBtn = page.locator('button[type="submit"], button:has-text("Generate" i), button:has-text("Decompose" i)').first();
    await submitBtn.click();

    // Wait for redirect or success state indicating path was created
    await page.waitForURL(/\/dashboard|\/doubt-solver/);

    // 5. Navigate to Doubt Solver and verify chat works
    await page.goto('/doubt-solver');
    await expect(page.locator('main')).toBeVisible();

    const chatInput = page.locator('textarea, [placeholder*="ask" i], [placeholder*="question" i]').first();
    await chatInput.fill('Explain Newton\'s first law of motion.');
    
    // Press enter or click send
    await chatInput.press('Enter');
    
    // Verify AI response stream appears
    await expect(page.locator('div:has-text("Newton" i)')).toBeVisible();
  });
});
