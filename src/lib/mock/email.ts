/**
 * Mock email service.
 * Per spec Section 8: email notifications are mocked.
 * This function logs the email instead of actually sending it.
 */

interface EmailParams {
  to: string;
  subject: string;
  body: string;
}

export async function sendEmail(params: EmailParams): Promise<void> {
  console.log("📧 [MOCK EMAIL]");
  console.log(`  To: ${params.to}`);
  console.log(`  Subject: ${params.subject}`);
  console.log(`  Body: ${params.body}`);
  console.log("  (Email not actually sent — mocked per spec)");
}
