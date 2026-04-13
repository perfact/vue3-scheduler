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
  scaleUnit: string;
  scale?: number;
  timeFormat: string;
  dateFormat: string;
}

export type { Event, Options };
