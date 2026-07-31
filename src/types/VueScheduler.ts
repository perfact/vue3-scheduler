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
}

interface Options {
  cellWidth: number;
  rowHeight: number;
  scale?: number;
  timeFormat: string;
  dateFormat: string;
  resizeResolution?: number;
  identifier_column_width?: number;
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

export type { Event, Options, TimeSpan, IdentifierObject };
