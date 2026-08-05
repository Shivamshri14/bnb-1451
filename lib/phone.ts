/** Indian mobile: always store as +91XXXXXXXXXX (10 digits, first digit 6–9). */

export function normalizeIndianPhone(input: string): string | null {
  if (!input) return null;
  const digits = input.replace(/\D/g, "");
  let ten = digits;
  if (digits.startsWith("91") && digits.length === 12) {
    ten = digits.slice(2);
  } else if (digits.length === 10) {
    ten = digits;
  } else if (digits.length === 11 && digits.startsWith("0")) {
    ten = digits.slice(1);
  } else {
    return null;
  }
  if (!/^[6-9]\d{9}$/.test(ten)) return null;
  return `+91${ten}`;
}

export function isValidIndianPhone(input: string): boolean {
  return normalizeIndianPhone(input) !== null;
}

export const indianPhoneMessage =
  "Enter a valid Indian mobile: +91 and 10 digits starting with 6–9";
