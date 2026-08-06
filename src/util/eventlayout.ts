import { Event, EventLayout } from "../types/VueScheduler";

let dragSequenceCounter = 0;
export function nextDragSequence(): number {
  return ++dragSequenceCounter;
}

// Remember the assignment of events to lanes
const laneMemory = new WeakMap<Event, number>();

function overlaps(
  eventAStart: number, eventAEnd: number, eventBStart: number, eventBEnd: number
): boolean {
  return eventAStart < eventBEnd && eventBStart < eventAEnd;
}

// Build clusters of events that overlap
function buildOverlappingEventClusters(sorted: Event[]): Event[][] {
  const clusters: Event[][] = [];
  let current: Event[] = [];
  let currentEnd = -Infinity;

  sorted.forEach((event) => {
    const start = event.start.getTime();
    const end = event.end.getTime();
    // If start is smaller than current end, then add to the current cluster
    if (current.length === 0 || start < currentEnd) {
      current.push(event);
      currentEnd = Math.max(currentEnd, end);
    } else {
      // If start is greater than current end, then open a new cluster
      clusters.push(current);
      current = [event];
      currentEnd = end;
    }
  });
  // Add last cluster to the list of clusters
  if (current.length) clusters.push(current);
  return clusters;
}

function buildGreedyEventLaneMapping(cluster: Event[]): Map<Event, number> {
  const sorted = [...cluster].sort((a, b) => a.start.getTime() - b.start.getTime());
  const laneEndTimes: number[] = [];
  const mapping = new Map<Event, number>();

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
    let laneIdx = laneEndTimes.findIndex((end) => end <= start);
    if (laneIdx === -1) laneIdx = laneEndTimes.length;
    laneEndTimes[laneIdx] = event.end.getTime();
    mapping.set(event, laneIdx);
  });

  return mapping;
}

// Remove gaps (empty lanes) without modifying the order of events
function compact(mapping: Map<Event, number>): Map<Event, number> {
  const used = Array.from(new Set(mapping.values())).sort(
    (laneA, laneB) => laneA - laneB
  );
  const remap = new Map<number, number>();
  used.forEach((lane, index) => remap.set(lane, index));
  const result = new Map<Event, number>();
  mapping.forEach((lane, event) => result.set(event, remap.get(lane)!));
  return result;
}

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
      (eventA, eventB) => eventA.start.getTime() - eventB.start.getTime()
    );
    const eventClusters = buildOverlappingEventClusters(sorted);

    const mostRecent = rowEvents.find(
      (event) =>
        event.preferredLaneAt !== undefined &&
        event.preferredLaneAt === dragSequenceCounter,
    );

    eventClusters.forEach((cluster) => {
      const containsMostRecent =
        mostRecent !== undefined && cluster.includes(mostRecent);

      let eventLaneMapping: Map<Event, number>;

      if (!containsMostRecent) {
        // If our current cluster does not contain the most recent change,
        // leave order of the events unchanged.
        // First check if we have a lane memmorized for all events inside the
        // cluster.
        const hasFullMemory = cluster.every((event) => laneMemory.has(event));
        // If we have all events memmorized, use the memmorized event-lane
        // mapping. Otherwise build a new mapping with the greedy algorithm.
        eventLaneMapping = hasFullMemory
          ? new Map(cluster.map((event) => [event, laneMemory.get(event)!]))
          : buildGreedyEventLaneMapping(cluster);
      } else {
        // If our cluster contains the most recent change, then we have to
        // refresh our mapping. We build a new mapping with the greedy algo.
        eventLaneMapping = buildGreedyEventLaneMapping(cluster);
        const laneCount = new Set(eventLaneMapping.values()).size;
        const currentLane = eventLaneMapping.get(mostRecent!)!;
        const desiredLane = Math.min(
          mostRecent!.preferredLane ?? currentLane,
          laneCount - 1,
        );
        // If our mostRecent change does not have the desired lane, try to
        // assign the desired lane to our most recent change
        if (desiredLane !== currentLane) {
          const mostRecentStart = mostRecent!.start.getTime();
          const mostRecentEnd = mostRecent!.end.getTime();
          // Get all events that overlap with the mostRecent event, because
          // we have to adjust their lanes
          const displaced: Event[] = [];
          eventLaneMapping.forEach((lane, event) => {
            if (event === mostRecent || lane !== desiredLane) return;
            const event_overlaps = overlaps(
              mostRecentStart,
              mostRecentEnd,
              event.start.getTime(),
              event.end.getTime(),
            );
            if (event_overlaps) {
              displaced.push(event);
            }
          });
          // We know mostRecent is not undefined/null, that why we use mostRecent!
          eventLaneMapping.set(mostRecent!, desiredLane);
          // Assign a new lane index for all displaced events
          displaced.forEach((event) => {
            const eventStart = event.start.getTime();
            const eventEnd = event.end.getTime();
            let laneIdx = 0;
            // Calculate new lane index which does not have a conflict with
            // other events
            while (true) {
              const conflict = Array.from(eventLaneMapping.entries()).some(
                ([otherEvent, otherLane]) =>
                  otherEvent !== event &&
                  otherLane === laneIdx &&
                  overlaps(
                    eventStart,
                    eventEnd,
                    otherEvent.start.getTime(),
                    otherEvent.end.getTime()
                  ),
              );
              if (!conflict) break;
              laneIdx++;
            }
            eventLaneMapping.set(event, laneIdx);
          });
        }
      }
      // Remove gaps between lanes
      const compacted = compact(eventLaneMapping);
      compacted.forEach((lane, event) => {
        layout.set(event, { lane });
        laneMemory.set(event, lane);
      });
    });
  });

  return layout;
}