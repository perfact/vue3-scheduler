import { Event } from "./VueScheduler";

interface Shift {
    id: number,
    name: string;
    start: Date;
    end: Date;
    color: string;
    num_employees: number;
}

/**
 * @prop start - Start time of the event
 * @prop end - End time of the event
 */
interface ShiftEvent extends Event {
    labortime: number;
}

interface TimeInterval {
    start: Date;
    end: Date;
}

interface TimelineBlock {
    start: Date;
    end: Date;
    value: number;
}

export type { Shift, ShiftEvent, TimeInterval, TimelineBlock };