export const convertNumberToHour = (hour: number): string => {
  return hour === 0
    ? "12 AM"
    : hour < 12
    ? `${hour} AM`
    : hour === 12
    ? "12 PM"
    : `${hour - 12} PM`;
};
