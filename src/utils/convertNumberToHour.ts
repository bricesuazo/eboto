export const convertNumberToHour = (hour: number): string => {
  return hour === 0
    ? "12AM"
    : hour < 12
    ? `${hour}AM`
    : hour === 12
    ? "12PM"
    : `${hour - 12}PM`;
};
