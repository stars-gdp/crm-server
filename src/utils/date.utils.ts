import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import customParseFormat from "dayjs/plugin/customParseFormat";

class DateUtils {
  constructor() {
    dayjs.extend(utc);
    dayjs.extend(customParseFormat);
  }

  dateToUtc(date: Date) {
    return dayjs.utc(date).toDate();
  }

  format(date: Date) {
    const d = dayjs(date);
    return d.format("DD.MM.YYYY HH:mm");
  }

  formatBomIST(date: Date) {
    const d = dayjs(date);
    const isSunday = d.day() === 0;

    return d.format(`DD.MM.YYYY ${isSunday ? "15:30" : "16:30"}`);
  }

  dateStringToDate(date: string) {
    // Extract just the date portion
    // @ts-ignore
    const datePart = date.match(/\d{2}\.\d{2}\.\d{2}/)[0];

    // Parse using dayjs with a custom format
    const parsed = dayjs(datePart, "DD.MM.YY");

    // Remove time by resetting it to start of the day
    const dateOnly = parsed.startOf("day");

    // If you need a native Date object
    return dateOnly.format("YYYY-MM-DD");
  }
}

export default new DateUtils();
