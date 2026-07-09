export const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

export const parseBillingDate = (value: string): Date => {
  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date');
  }

  return date;
};

export const addMonths = (date: Date, months: number): Date => {
  const copy = new Date(date);
  copy.setUTCMonth(copy.getUTCMonth() + months);
  return copy;
};

export const getMonthKey = (isoDate: string): string => isoDate.slice(0, 7);
