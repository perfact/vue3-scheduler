import { Event } from "./VueScheduler";


/**
 * Shift interface. Used to display shifts in the shift scheduler.
 *
 * @interface Shift
 * @typedef {Shift}
 * 
 * @prop {number} id - ID of the shift
 * @prop {string} name - Name of the shift
 * @prop {Date} start - Start time of the shift
 * @prop {Date} end - End time of the shift
 * @prop {string} color - Color of the shift
 * @prop {number} num_employees - Number of employees planned for this shift
 */
interface Shift {
    id: number,
    name: string;
    start: Date;
    end: Date;
    color: string;
    num_employees: number;
}

/**
 * Production events. Extend the base event with information related to
 * production planning, for example the labor time.
 * 
 * @interface ProductionEvent
 * @typedef {ProductionEvent}
 * 
 * @prop {number} identiferIdx - Index of the event
 * @prop {Date} start - Start time of the event
 * @prop {Date} end - End time of the event
 * @prop {Object} [meta] - Meta information of the event
 * @prop {string} [meta.class] - Class of the event
 * @prop {string} [meta.description] - Description of the event
 * @prop {string} [meta.title] - Title of the event
 */
interface ProductionEvent extends Event {
    labortime: number;
}


/**
 * Block for the staff planning timeline. Holds start/end timestamp and the
 * available and required worktime hours for this interval.
 *
 * @interface StaffTimelineBlock
 * @typedef {StaffTimelineBlock}
 * 
 * @prop {Date} start - Start time of the block
 * @prop {Date} end - End time of the block
 * @prop {number} required - Required worktime for the time interval
 * @prop {number} available - Available worktime for the time interval
 */
interface StaffTimelineBlock {
    start: Date;
    end: Date;
    required: number;
    available: number;
}

export type { Shift, ProductionEvent, StaffTimelineBlock };