import { Event } from "./VueScheduler";

interface Shift {
    id: number,
    name: string;
    start: Date;
    end: Date;
    color: string;
}

/**
 * @prop start - Start time of the event
 * @prop end - End time of the event
 */
interface ShiftEvent extends Event {
    labortime: number;
}

export type { Shift, ShiftEvent };