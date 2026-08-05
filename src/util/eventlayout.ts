import { Event, EventLayout } from "../types/VueScheduler";

/**
 * Calculate the event layout for overlapping events. Currently only lane
 * splitting is supported.
 * 
 * Here are the different types of event layouts explained:
 * Lane Splitting: Adjust the height of the row itself and show the event below
 *  each other in different lanes. 
 *  Advantage: Shows the blocks fully.
 *  Disadvantage: Row height might become very big when a lot of events
 *                overlap.
 * Cascade: Display events behind each other like cards in a wallet (not
 *  supported for now).
 *  Advantage: Good for a lot of overlapping events. Rows do not become infitly
 *             big.
 *  Disadvantage: The content of all blocks is not visible at the same time.
 * 
 * @param {Event[]} events - List of events
 * @returns - Returns a mapping of events to event layout
 */
export function calculateEventLayout(events: Event[]): Map<Event, EventLayout> {
  const layout = new Map<Event, EventLayout>();
  const byRow = new Map<number, Event[]>();

  // Collect events for each row
  events.forEach((event) => {
    const rowEvents = byRow.get(event.identiferIdx) ?? [];
    rowEvents.push(event);
    byRow.set(event.identiferIdx, rowEvents);
  });

  // Calculate lanes for each row
  byRow.forEach((rowEvents) => {
    // First get a sorted list of all events
    const sorted = [...rowEvents].sort(
      (a, b) => a.start.getTime() - b.start.getTime(),
    );
    const laneEnds: number[] = [];

    sorted.forEach((event) => {
      const start = event.start.getTime();
      // Find the correct lane index. Check if we can find an endtime that
      // is smaller or equal to our start time. If we found an index, use this
      // index as lane. If we dont find an index, then we start a new lane
      // Look at this example for a better understanding:
      // Event 1: Start 06:00, End 14:00 -> Lane Index: 0, laneEnds: [14:00]
      // Event 2: Start 06:00, End 08:00 -> Lane Index: 1, laneEnds: [14:00, 08:00]
      // Event 3: Start 08:00, End 10:00 -> Lane Index: 1, laneEnds: [14:00, 08:00, 10:00]
      // Event 4: Start 14:00, End 22:00 -> Lane Index: 0, laneEnds: [14:00, 08:00, 10:00]
      let laneIdx = laneEnds.findIndex((end) => end <= start);
      if (laneIdx === -1) laneIdx = laneEnds.length;

      laneEnds[laneIdx] = event.end.getTime();
      layout.set(event, { lane: laneIdx });
    });
  });

  return layout;
}