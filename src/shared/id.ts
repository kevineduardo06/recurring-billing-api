let sequence = 1;

export const createId = (prefix: string): string => `${prefix}_${sequence++}`;

export const resetIdsForTests = (): void => {
  sequence = 1;
};
