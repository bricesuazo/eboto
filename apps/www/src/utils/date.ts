import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isBetween from 'dayjs/plugin/isBetween';

// Configure dayjs plugins
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);

/**
 * Enhanced dayjs instance with all necessary plugins
 * Use this instead of moment.js throughout the application
 */
export const date = dayjs;

/**
 * Common date formatting functions to replace moment usage
 */
export const DateUtils = {
  // Replace moment().format("MMMM DD, YYYY")
  formatDate: (date: string | Date) => dayjs(date).format("MMMM DD, YYYY"),
  
  // Replace moment().format("MMM DD, YYYY")  
  formatDateShort: (date: string | Date) => dayjs(date).format("MMM DD, YYYY"),
  
  // Replace moment().format("MMMM D, YYYY")
  formatDateMedium: (date: string | Date) => dayjs(date).format("MMMM D, YYYY"),
  
  // Replace moment().format("YYYY")
  formatYear: (date: string | Date) => dayjs(date).format("YYYY"),
  
  // Replace moment().format("hh:mm A")
  formatTime: (date: string | Date) => dayjs(date).format("hh:mm A"),
  
  // Replace moment().format("MMMM D, YYYY hh:mm A")
  formatDateTime: (date: string | Date) => dayjs(date).format("MMMM D, YYYY hh:mm A"),
  
  // Replace moment().format("MMMM DD, YYYY hh:mmA")
  formatDateTimeShort: (date: string | Date) => dayjs(date).format("MMMM DD, YYYY hh:mmA"),
  
  // Replace moment().format("MMMM Do YYYY, h:mm:ss A")
  formatDateTimeFull: (date: string | Date) => dayjs(date).format("MMMM Do YYYY, h:mm:ss A"),
  
  // Replace moment().fromNow()
  fromNow: (date: string | Date) => dayjs(date).fromNow(),
  
  // Replace moment().local()
  local: (date: string | Date) => dayjs(date).local(),
  
  // Replace moment().isAfter() - isAfter is built into dayjs core
  isAfter: (date: string | Date, compareDate: string | Date) => dayjs(date).isAfter(compareDate),
  
  // Replace moment().isBefore() - isBefore is built into dayjs core
  isBefore: (date: string | Date, compareDate: string | Date) => dayjs(date).isBefore(compareDate),
  
  // Replace moment().isBetween()
  isBetween: (date: string | Date, from: string | Date, to: string | Date) => 
    dayjs(date).isBetween(from, to),
  
  // Replace moment().add()
  add: (date: string | Date, amount: number, unit: any) => 
    dayjs(date).add(amount, unit),
  
  // Get current date - replaces moment()
  now: () => dayjs(),
  
  // Create date instance - replaces moment(date)
  create: (date?: string | Date) => dayjs(date),
};