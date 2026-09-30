const PRICE = /^(\d{1,7})(?:\.(\d{1,2}))?$/;

/** Parses a decimal price such as "19.99" into integer cents. */
export function parsePrice(input: string): number {
  const match = PRICE.exec(input.trim());
  if (!match) {
    throw new RangeError(`Invalid price: ${JSON.stringify(input)}`);
  }
  const [, whole, fraction = ""] = match;
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

/** Formats integer cents as a decimal price such as "19.99". */
export function formatPrice(cents: number): string {
  if (!Number.isInteger(cents) || cents < 0) {
    throw new RangeError(`Invalid amount in cents: ${cents}`);
  }
  const whole = Math.floor(cents / 100);
  const fraction = String(cents % 100).padStart(2, "0");
  return `${whole}.${fraction}`;
}
