const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const pad2 = (value) => String(value).padStart(2, '0');

export const getTodayIsoDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = pad2(now.getMonth() + 1);
  const day = pad2(now.getDate());
  return `${year}-${month}-${day}`;
};

export const isValidIsoDate = (value) => {
  if (!ISO_DATE_REGEX.test(String(value || ''))) return false;

  const [year, month, day] = String(value).split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));

  return (
    utcDate.getUTCFullYear() === year &&
    utcDate.getUTCMonth() === month - 1 &&
    utcDate.getUTCDate() === day
  );
};

export const compareIsoDates = (a, b) => {
  if (!isValidIsoDate(a) || !isValidIsoDate(b)) return NaN;
  if (a === b) return 0;
  return a < b ? -1 : 1;
};

export const isFutureIsoDate = (value, today = getTodayIsoDate()) => {
  return compareIsoDates(value, today) === 1;
};

export const isPastIsoDate = (value, today = getTodayIsoDate()) => {
  return compareIsoDates(value, today) === -1;
};

export const shiftIsoDate = (isoDate, days) => {
  if (!isValidIsoDate(isoDate) || !Number.isInteger(days)) return '';

  const [year, month, day] = isoDate.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  utcDate.setUTCDate(utcDate.getUTCDate() + days);

  const nextYear = utcDate.getUTCFullYear();
  const nextMonth = pad2(utcDate.getUTCMonth() + 1);
  const nextDay = pad2(utcDate.getUTCDate());
  return `${nextYear}-${nextMonth}-${nextDay}`;
};

export const calculateAgeFromIsoDate = (birthDate, today = getTodayIsoDate()) => {
  if (!isValidIsoDate(birthDate) || !isValidIsoDate(today)) return NaN;

  const [birthYear, birthMonth, birthDay] = birthDate.split('-').map(Number);
  const [todayYear, todayMonth, todayDay] = today.split('-').map(Number);

  let age = todayYear - birthYear;
  if (todayMonth < birthMonth || (todayMonth === birthMonth && todayDay < birthDay)) {
    age -= 1;
  }

  return age;
};