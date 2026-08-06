/**
 * Event interface. Used to display events on the timeline that can be dragged
 * and resized.
 *
 * @interface Event
 * @typedef {Event}
 * 
 * @prop {number} identiferIdx - Index of the event
 * @prop {Date} start - Start time of the event
 * @prop {Date} end - End time of the event
 * @prop {Object} [meta] - Meta information of the event
 * @prop {string} [meta.class] - Class of the event
 * @prop {string} [meta.description] - Description of the event
 * @prop {string} [meta.title] - Title of the event
 * @prop {boolean} [may_move_time] - Whether start and end may be shifted in
 *   time. Omitted means allowed.
 * @prop {boolean} [may_move_row] - Whether the event may be dragged onto
 *   another identifier row. Omitted means allowed.
 * @prop {boolean} [may_resize] - Whether the duration may be changed.
 *   Omitted means allowed.
 */
interface Event {
  identiferIdx: number;
  start: Date;
  end: Date;
  meta?: {
    class?: string;
    description?: string;
    title?: string;
  };
  // Interaction permissions. All three default to allowed when omitted, so
  // callers that do not care about permissions keep the previous behaviour.
  may_move_time?: boolean;
  may_move_row?: boolean;
  may_resize?: boolean;
  // used in the layout calculation for overlapping events
  preferredLane?: number;
  // Counter indicating when the prefferedLane was set. If this value is bigger
  // than the value of another event, than this event will win.
  preferredLaneAt?: number;
}

interface Options {
  cellWidth: number;
  rowHeight: number;
  scale?: number;
  timeFormat: string;
  dateFormat: string;
  resizeResolution?: number;
  identifier_column_width?: number;
  dragResolutionMinutes?: number;
}

interface TimeSpan {
  start: Date;
  end: Date;
  color: string;
  timelines?: Array<number>;
}


/**
 * Identifier object which can be passed to the Scheduler components.
 *
 * @interface IdentifierObject
 * @typedef {IdentifierObject}
 * 
 * @prop {string} id - ID of the identifier object
 * @prop {string} name - Name of the identifier which will be displayed
 */
interface IdentifierObject {
  id: string;
  name: string;
  header_name: string,
}

/**
 * EventLayout interface. Only holds the lane for the moment. Could be extended
 * with cascading layout in the future.
 * 
 * @prop {number} lane - Lane of the event in a row. Controls where to put an
 *  event in a row when there are multiple overlaping events.
 */
interface EventLayout {
  lane: number;
}

export type { Event, Options, TimeSpan, IdentifierObject, EventLayout };
