let counter = 0;

export function uniqueName(testName: string, label: string): string {
  const timestamp = Date.now();
  counter++;
  return `[E2E-${testName}] ${label}-${timestamp}-${counter}`;
}
