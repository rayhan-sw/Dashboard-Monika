/**
 * Validasi username & password (tanpa mengubah database)
 * Ketentuan Username: identitas unik, 3-20 karakter, huruf/angka/underscore/titik.
 * Ketentuan Password: minimal 8 karakter, kombinasi huruf besar/kecil/angka. Simbol (!@#$% dll.) disarankan, tidak wajib.
 */

// Username: 3-20 karakter, hanya huruf (A-Za-z), angka (0-9), underscore (_), titik (.)
const USERNAME_REGEX = /^[a-zA-Z0-9._]+$/;
const USERNAME_MIN = 3;
const USERNAME_MAX = 20;

// Password: minimal 8 karakter
const PASSWORD_MIN = 8;

export const validationRules = {
  username: {
    min: USERNAME_MIN,
    max: USERNAME_MAX,
    pattern: USERNAME_REGEX,
    patternDesc: 'Huruf, angka, underscore (_), atau titik (.) saja. Tanpa spasi atau simbol (@, #, $).',
  },
  password: {
    min: PASSWORD_MIN,
    requireUppercase: /[A-Z]/,
    requireLowercase: /[a-z]/,
    requireDigit: /[0-9]/,
    requireSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
  },
} as const;

export function validateUsername(username: string): { valid: boolean; message?: string } {
  const t = username.trim();
  if (t.length === 0) return { valid: false, message: 'Username wajib diisi' };
  if (t.length < USERNAME_MIN) return { valid: false, message: `Username minimal ${USERNAME_MIN} karakter` };
  if (t.length > USERNAME_MAX) return { valid: false, message: `Username maksimal ${USERNAME_MAX} karakter` };
  if (!USERNAME_REGEX.test(t)) return { valid: false, message: validationRules.username.patternDesc };
  return { valid: true };
}

export function validatePassword(
  password: string,
  username: string,
  email: string
): { valid: boolean; message?: string } {
  if (password.length === 0) return { valid: false, message: 'Kata sandi wajib diisi' };
  if (password.length < PASSWORD_MIN) return { valid: false, message: `Kata sandi minimal ${PASSWORD_MIN} karakter` };
  if (!validationRules.password.requireUppercase.test(password))
    return { valid: false, message: 'Kata sandi harus mengandung minimal satu huruf besar (A-Z)' };
  if (!validationRules.password.requireLowercase.test(password))
    return { valid: false, message: 'Kata sandi harus mengandung minimal satu huruf kecil (a-z)' };
  if (!validationRules.password.requireDigit.test(password))
    return { valid: false, message: 'Kata sandi harus mengandung minimal satu angka (0-9)' };
  // Simbol/karakter khusus tidak wajib, hanya disarankan (tetap mempengaruhi strength meter)

  return { valid: true };
}

/**
 * Kekuatan password 0-5 untuk strength meter:
 * 0-2 = sangat lemah/lemah/cukup, 3 = cukup, 4 = Kuat (min 8 + besar + kecil + angka), 5 = Sangat kuat (+ simbol).
 */
export function getPasswordStrength(password: string): number {
  if (!password.length) return 0;
  let score = 0;
  if (password.length >= PASSWORD_MIN) score++;
  if (validationRules.password.requireUppercase.test(password)) score++;
  if (validationRules.password.requireLowercase.test(password)) score++;
  if (validationRules.password.requireDigit.test(password)) score++;
  if (validationRules.password.requireSpecial.test(password)) score++;
  return score; // 0-5: 4 = kuat, 5 = sangat kuat (dengan simbol)
}
