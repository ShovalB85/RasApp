import type { Task } from '../types';

// Function to format date for iCalendar
const formatDate = (date: Date, isAllDay: boolean) => {
    if (isAllDay) {
        // Format as YYYYMMDD
        return date.toISOString().slice(0, 10).replace(/-/g, '');
    }
    // Format as YYYYMMDDTHHMMSSZ
    return date.toISOString().replace(/-/g, '').replace(/:/g, '').slice(0, 15) + 'Z';
};

export const generateIcsFile = (task: Task) => {
    const startDate = new Date(task.startDate);
    // For all-day events, end date should be the next day
    const endDate = new Date(startDate);
    if (task.isAllDay) {
        endDate.setDate(startDate.getDate() + 1);
    } else {
        // Assume 1-hour duration for non-all-day tasks
        endDate.setHours(startDate.getHours() + 1);
    }

    const icsString = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//RasApp//Task Management//EN',
        'BEGIN:VEVENT',
        `UID:${task.id}@rasapp.mil`,
        `DTSTAMP:${formatDate(new Date(), false)}`,
        `DTSTART${task.isAllDay ? ';VALUE=DATE' : ''}:${formatDate(startDate, task.isAllDay)}`,
        `DTEND${task.isAllDay ? ';VALUE=DATE' : ''}:${formatDate(endDate, task.isAllDay)}`,
        `SUMMARY:${task.title}`,
        `DESCRIPTION:${task.description}`,
    ];

    if (task.isRecurring && task.recurrence) {
        const recurrenceMap = {
            daily: 'DAILY',
            weekly: 'WEEKLY',
            monthly: 'MONTHLY'
        };
        icsString.push(`RRULE:FREQ=${recurrenceMap[task.recurrence]}`);
    }

    icsString.push('END:VEVENT');
    icsString.push('END:VCALENDAR');

    const file = new Blob([icsString.join('\r\n')], { type: 'text/calendar' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = `${task.title}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};
