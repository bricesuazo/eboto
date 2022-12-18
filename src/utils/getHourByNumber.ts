export const getHourByNumber = (hour: number) => {
  return `${hour == 0 ? 12 : hour > 12 ? hour - 12 : hour}${
    hour < 12 ? "AM" : "PM"
  }`;
};
