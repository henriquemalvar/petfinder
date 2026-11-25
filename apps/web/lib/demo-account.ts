export type DemoCredentials = { email: string; password: string };

export function demoCredentials(
  email = process.env.NEXT_PUBLIC_DEMO_EMAIL,
  password = process.env.NEXT_PUBLIC_DEMO_PASSWORD,
): DemoCredentials | null {
  const trimmedEmail = email?.trim();
  if (!trimmedEmail || !password) return null;
  return { email: trimmedEmail, password };
}
