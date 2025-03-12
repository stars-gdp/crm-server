import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import advancedFormat from "dayjs/plugin/advancedFormat";

// Extend dayjs with required plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);

class BookUtils {
  private readonly IST_TIMEZONE = "Asia/Kolkata";

  /**
   * Find the next available BOM meeting dates
   * Returns ["Today, DATE", "Tomorrow, DATE"] if current time < 11:00 IST
   * Returns ["Tomorrow, DATE", "Day after tomorrow, DATE"] if 11:00 IST <= current time < 16:00 IST
   * Returns ["Day after tomorrow, DATE", "DATE"] if current time >= 16:00 IST (with no prefix for the second date)
   *
   * BOM meetings: Monday-Saturday at 16:30 IST, Sunday at 15:30 IST
   */
  getNextBomDates(): string[] {
    // Convert current time to IST for cutoff check
    const istNow = dayjs().tz(this.IST_TIMEZONE);

    // Check time against cutoffs
    const isBeforeFirstCutoff = istNow.hour() < 11;
    const isBeforeSecondCutoff = istNow.hour() < 16;

    if (isBeforeFirstCutoff) {
      // Before 11:00 IST
      return [
        this.formatBomDate(istNow, 0, "Today"),
        this.formatBomDate(istNow, 1, "Tomorrow"),
      ];
    } else if (isBeforeSecondCutoff) {
      // Between 11:00 IST and 16:00 IST
      return [
        this.formatBomDate(istNow, 1, "Tomorrow"),
        this.formatBomDate(istNow, 2, "Day after tomorrow"),
      ];
    } else {
      // After 16:00 IST
      return [
        this.formatBomDate(istNow, 2, "Day after tomorrow"),
        this.formatBomDate(istNow, 3, ""), // No prefix for day after day after tomorrow
      ];
    }
  }

  /**
   * Format BOM date with the correct time (16:30 IST normally, 15:30 IST on Sundays)
   */
  private formatBomDate(
    baseDate: dayjs.Dayjs,
    daysToAdd: number,
    prefix: string,
  ): string {
    const date = baseDate.add(daysToAdd, "day");
    const isSunday = date.day() === 0; // 0 is Sunday in dayjs

    // Set appropriate time based on day (Sunday 15:30, other days 16:30)
    const meetingTime = date
      .hour(isSunday ? 15 : 16)
      .minute(30)
      .second(0);

    // Keep in IST timezone for display
    return `${!!prefix ? prefix + ", " : ""}${meetingTime.format("DD.MM.YY, HH:mm")} IST`;
  }

  /**
   * Get next BIT meeting date (Sunday at 17:30 IST)
   */
  getNextBitDate(): string {
    return this.getNextWeekdayDate(0, 17, 30); // Sunday
  }

  /**
   * Get next WG1 meeting date (Monday at 17:30 IST)
   */
  getNextWg1Date(): string {
    return this.getNextWeekdayDate(1, 17, 30); // Monday
  }

  /**
   * Get next PT meeting date (Tuesday at 17:30 IST)
   */
  getNextPtDate(): string {
    return this.getNextWeekdayDate(2, 17, 30); // Tuesday
  }

  /**
   * Get next occurrence of a specific weekday with the given time
   * @param targetDay Day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
   * @param hours Hour in 24-hour format
   * @param minutes Minutes
   * @returns Formatted date string in UTC
   */
  private getNextWeekdayDate(
    targetDay: number,
    hours: number,
    minutes: number,
  ): string {
    const istNow = dayjs().tz(this.IST_TIMEZONE);
    const currentDay = istNow.day();

    // Calculate days until next occurrence
    let daysToAdd = targetDay - currentDay;
    if (daysToAdd <= 0) {
      daysToAdd += 7; // Next week if today or already passed this week
    }

    // Create the date with specified time
    const nextDate = istNow
      .add(daysToAdd, "day")
      .hour(hours)
      .minute(minutes)
      .second(0);

    // Keep in IST timezone for display
    return `${nextDate.format("dddd")}, ${nextDate.format("DD.MM.YY, HH:mm")} IST`;
  }
}

export default new BookUtils();
