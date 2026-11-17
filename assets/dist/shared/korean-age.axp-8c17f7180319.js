const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function getKstCalendarParts(now = new Date()) {
  const kst = new Date(now.getTime() + KST_OFFSET_MS);
  return {
    year: kst.getUTCFullYear(),
    month: kst.getUTCMonth() + 1,
    day: kst.getUTCDate(),
  };
}

export function computeInternationalAge(birthIso, now = new Date()) {
  const match = ISO_DATE.exec(String(birthIso || '').trim());
  if (!match) return null;
  const birthYear = Number(match[1]);
  const birthMonth = Number(match[2]);
  const birthDay = Number(match[3]);
  const { year, month, day } = getKstCalendarParts(now);
  let age = year - birthYear;
  if (month < birthMonth || (month === birthMonth && day < birthDay)) {
    age -= 1;
  }
  return age >= 0 && age < 130 ? age : null;
}

export function syncKoreanAgeElements(root = document, now = new Date()) {
  for (const el of root.querySelectorAll('[data-birthdate]')) {
    const age = computeInternationalAge(el.getAttribute('data-birthdate'), now);
    if (age !== null) {
      el.textContent = `만 ${age}세`;
    }
  }
}
