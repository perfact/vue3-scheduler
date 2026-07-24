<template>
  Max laborttime in timeslot: {{ max_labortime_in_timeslot }}
  <VueScheduler
    :end="end"
    :events="events"
    :headers="headers"
    :identifiers="identifiers"
    :options="options"
    :start="start"
    :spans="spans"
    :style="{
      '--available-worktime-color': availableWorktimeHoursColor,
      '--required-worktime-color': requiredWorktimeHoursColor,
    }"
    @event-activate="(event) => emit('event-activate', event)"
  >
    <!-- Header row above the identifiers -->
    <template #header-column-identifier>
      <div class="vs-shift-left-cell">
        <slot name="shift-header-label">
          Schicht:
        </slot>
      </div>
    </template>
    <!-- Addtional staff planning row below the identifieres -->
    <template #additional-rows="{row_height}">
      <div
        class="vs-staff-label-cell"
        :style="{
          'min-height': `${3 * row_height}px`,
          'max-height': `${3 * row_height}px`,
        }"
      >
        <div class="vs-staff-label-content">
          <slot name="staff-planning-label">
            Personal-Planung
          </slot>

          <slot name="staff-legend">
            <div class="vs-staff-legend">
              <div class="vs-staff-legend-item">
                <span class="vs-staff-legend-bar" />
                <slot name="staff-legend-required-worktime-label">
                  <span>Benötigte Arbeitsstunden</span>
                </slot>
              </div>

              <div class="vs-staff-legend-item">
                <span class="vs-staff-legend-line" />
                <slot name="staff-legend-available-worktime-label">
                  <span>Verfügbare Arbeitsstunden</span>
                </slot>
              </div>
            </div>
          </slot>
        </div>
        <!-- Legend with hours -->
        <div class="vs-staff-axis">
          <div
            v-for="tick in staffAxis"
            :key="tick.value"
            class="vs-staff-axis-label"
            :style="{
              bottom: `${tick.percent}%`
            }"
          >
            {{ tick.value }}
          </div>
        </div>
      </div>
    </template>

    <!-- Actual shifts above the timeline -->
    <template #header-column-timeline="{ get_elem_left, get_elem_width, start, cell_width, scale}">
      <div class="vs-shift-track">
        <slot
          name="shift-cells"
          :get_elem_left="get_elem_left"
          :get_elem_width="get_elem_width"
          :start
          :cell_width
          :scale
        >
          <div
            v-for="shift in shifts"
            :key="shift.name + shift.start"
            class="vs-shift"
            :style="{
              '--shift-left': `${get_elem_left(start, shift.start, cell_width, scale)}px`,
              '--shift-width': `${get_elem_width(shift.start, shift.end, cell_width, scale)}px`,
              '--shift-color': shift.color,
            }"
          >
            <slot :name="'shift-cell-content-' + shift.id">
              {{ shift.name }}
            </slot>
          </div>
        </slot>
      </div>
    </template>

    <!-- Visual lines for start/end of shifts in header column -->
    <template #timeline-header="{ get_elem_left, get_elem_width, start, cell_width, scale}">
      <div class="vs-shift-lines-header">
        <slot
          name="shift-header-border-lines"
          :get_elem_left="get_elem_left"
          :get_elem_width="get_elem_width"
          :start
          :cell_width
          :scale
        >
          <div
            v-for="(shift, index) in shifts"
            :key="index"
            class="vs-shift-line"
            :style="{
              '--shift-left': `${get_elem_left(start, shift.start, cell_width, scale)}px`,
              '--shift-color': shift.color,
            }"
          />

          <div
            v-for="(shift, index) in shifts"
            :key="`end-${index}`"
            class="vs-shift-line"
            :style="{
              '--shift-left': `${get_elem_left(start, shift.end, cell_width, scale)}px`,
              '--shift-color': shift.color,
            }"
          />
        </slot>
      </div>
    </template>

    <!-- Visual lines for start/end of shifts in event columns-->
    <template #timeline-body="{ get_elem_left, get_elem_width, start, cell_width, scale}">
      <div class="vs-shift-lines">
        <slot
          name="shift-event-border-lines"
          :get_elem_left="get_elem_left"
          :get_elem_width="get_elem_width"
          :start
          :cell_width
          :scale
        >
          <div
            v-for="(shift, index) in shifts"
            :key="index"
            class="vs-shift-line"
            :style="{
              '--shift-left': `${get_elem_left(start, shift.start, cell_width, scale)}px`,
              '--shift-color': shift.color,
            }"
          />

          <div
            v-for="(shift, index) in shifts"
            :key="`end-${index}`"
            class="vs-shift-line"
            :style="{
              '--shift-left': `${get_elem_left(start, shift.end, cell_width, scale)}px`,
              '--shift-color': shift.color,
            }"
          />
        </slot>
      </div>
    </template>
    <!-- Pass other slots to child comp -->
    <template
      v-for="(_, name) in slots"
      #[name]="slotProps"
    >
      <slot
        :name="name"
        v-bind="slotProps"
      />
    </template>

    <!-- Staff planning cells in timeline -->
    <template
      #timeline-body-end="{ get_elem_left, get_elem_width, start, cell_width, row_height, scale, timeline}"
    >
      <slot
        name="staff-planning"
        :get_elem_left="get_elem_left"
        :get_elem_width="get_elem_width"
        :start
        :cell_width
        :scale
        :timeline
      >
        <!-- Timeslot lines -->
        <div class="vs-staff-grid">
          <div
            v-for="(_, index) in timeline"
            :key="index"
            class="vs-staff-grid-line"
            :style="{
              left: `${(index as number) * cell_width}px`
            }"
          />
        </div>
        
        <div
          class="vs-staff-planning-track"
          :style="{
            height: `${3 * row_height}px`
          }"
        >
          <!-- Lines for the hours on the y-axis -->
          <div
            v-for="tick in staffAxis"
            :key="tick.value"
            class="vs-staff-grid-horizontal"
            :style="{
              bottom: `${tick.percent}%`
            }"
          />
          <!-- Required worktime blocks -->
          <div
            v-for="(block, index) in requiredStaffTimeline"
            :key="index"
            class="vs-staff-planning-block"
            :style="{
              left: `${get_elem_left(start, block.start, cell_width, scale)}px`,
              width: `${get_elem_width(block.start, block.end, cell_width, scale)}px`
            }"
          >
            <slot
              name="required-worktime-block"
              :block
              :max-axis-value
            >
              <div
                class="vs-staff-planning-fill"
                :style="{
                  height: `${(block.value / maxAxisValue) * 100}%`
                }"
              >
                <span class="vs-staff-planning-label">
                  {{ block.value.toFixed(2) }}
                </span>
              </div>            
            </slot>
          </div>

          <!-- Available staff lines -->
         
          <div
            v-for="block in availableStaffTimeline"
            :key="block.start.toISOString() + block.end.toISOString()"
            class="vs-available-staff-line"
            :style="{
              left: `${get_elem_left(start, block.start, cell_width, scale)}px`,
              width: `${get_elem_width(block.start, block.end, cell_width, scale)}px`,
              bottom: `${block.value / maxAxisValue * 100}%`
            }"
          >
            <slot
              name="available-worktime-block"
              :block
              :max-axis-value
            >
              <span class="vs-staff-planning-label">
                Employee hours: {{ block.value }}
              </span>
            </slot>
          </div>
        </div>
      </slot>
    </template>
  </VueScheduler>
</template>

<script lang="ts">
import { defineComponent, PropType, useSlots, computed } from "vue";
import { Options, TimeSpan } from "../types/VueScheduler";
import { Shift, ShiftEvent, TimeInterval, TimelineBlock } from "../types/VueShiftScheduler";
import VueScheduler from "./VueScheduler.vue";

const DEFAULT_OPTIONS: Options = {
  cellWidth: 100,
  rowHeight: 50,
  timeFormat: "HH:mm",
  dateFormat: "yyyy-MM-dd",
};

export default defineComponent({
    name: "VueShiftScheduler",
    components: { VueScheduler },
    props: {
        end: {
          type: Date,
          required: true,
        },
        events: {
          type: Array as PropType<ShiftEvent[]>,
          required: true,
        },
        headers: {
          type: Array,
          required: true,
        },
        identifiers: {
          type: Array,
          required: true,
        },
        options: {
          type: Object as PropType<Options>,
          required: false,
          default: DEFAULT_OPTIONS,
        },
        start: {
          type: Date,
          required: true,
        },
        spans: {
          type: Array<TimeSpan>,
          required: false,
          default: [],
        },
        shifts: {
          type: Array as PropType<Shift[]>,
          default: () => [],
        },
        availableWorktimeHoursColor: {
          type: String,
          required: false,
          default: '#16a34a',
        },
        requiredWorktimeHoursColor: {
          type: String,
          required: false,
          default: '#3b82f6',
        }
    },
    emits: ["event-activate"],
    setup(props, { emit }) {
        const slots = useSlots();
        const scale = props.options.scale ?? 1;

        const requiredStaffTimeline = computed(() =>
          buildTimeline(
              props.events,
              event => calc_required_time_for_event_per_timeslot(event)
          )
        );

        const availableStaffTimeline = computed(() =>
          buildTimeline(
              props.shifts,
              shift => shift.num_employees * scale
          )
        );

        /**
         * Compute the max laborttime / available time (employees).
         */
        const max_labortime_in_timeslot = computed(() => {
          let max_time = 0;
          // Get max labortime
          const max_required_time = Math.max(
            ...requiredStaffTimeline.value.map(
              (timeline_slot) => timeline_slot.value)
          )
          if (max_time < max_required_time) {
            max_time = max_required_time;
          }
          // Get max empoloyee time
          const max_available_time = Math.max(
            ...availableStaffTimeline.value.map(
              (timeline_slot) => timeline_slot.value)
          )
          if (max_time < max_available_time) {
            max_time = max_available_time;
          }
          return max_time + 0.1;
        });

        /**
         * Get the duration of an event in hours
         * @param event - Shift event
         * @returns - Returns the duration of a shift event in hours
         */
        function get_duration_of_event(event: ShiftEvent) {
          const diffTime = Math.abs(event.end.getTime() - event.start.getTime());
          const diffHours = diffTime / (1000 * 60 * 60 );
          return diffHours
        }

        /**
         * Calculate the required worktime for an event per timeslot.
         * Calculation has the following logic:
         * Lets say one timeslot is 1 hour. If the event has a duration of 2
         * hours with 4h labortime, then the required worktime per slot would
         * be 2 hours.
         * 
         * @param event - Shift event
         * @returns - Returns the required worktime for a shift event
         */
        function calc_required_time_for_event_per_timeslot(event: ShiftEvent) {
          const event_duration = get_duration_of_event(event);
          const required_time_per_hour = event.labortime / event_duration;
          const scale = props.options.scale ?? 1;
          return required_time_per_hour * scale;
        }

        /**
         * Build timeline blocks for a list of time intervals.
         * 
         * @param timeIntervalItems - List of time intervals
         * @param valueGetter - Function that returns the amount hours for
         *  one time interval item. Used to calculate the value of a timeblock
         * 
         * @returns - Returns a list of TimelineBlocks for the given time
         *  intervals
         */
        function buildTimeline<T extends TimeInterval>(
          timeIntervalItems: T[],
          valueGetter: (item: T) => number,
        ): TimelineBlock[] {

          const timestamps = new Set<number>();

          // Collect all start / stop times
          for (const item of timeIntervalItems) {
              timestamps.add(item.start.getTime());
              timestamps.add(item.end.getTime());
          }

          // Sort the timestamps
          const sortedTimestamps = [...timestamps].sort((a, b) => a - b);

          const blocks: TimelineBlock[] = [];

          for (let i = 0; i < sortedTimestamps.length - 1; i++) {
              const start = sortedTimestamps[i];
              const end = sortedTimestamps[i + 1];
              let value = 0;
              // Sum the values of each time interval item that matches start
              // end time of the current time block.
              for (const item of timeIntervalItems) {
                  if (item.start.getTime() <= start && item.end.getTime() >= end) {
                    value += valueGetter(item);
                  }
              }

              // If the time value is 0, just irgnore it
              if (value === 0) {
                  continue;
              }

              // Check if we can merge with previous block
              const previous = blocks[blocks.length - 1];
              // We may merge with prev block if value is the same and end time
              // of prev block is start time of the current block
              const may_merge_with_prev_block = (
                previous &&
                previous.value === value &&
                previous.end.getTime() === start
              );
              if (may_merge_with_prev_block) {
                previous.end = new Date(end);
              } else {
                blocks.push({
                  start: new Date(start),
                  end: new Date(end),
                  value
                });
              }
          }

          return blocks;
        }

        /**
         * Get a nice step size for the hours on the y-axis.
         * 
         * @param max - Max hours that have to be displayed
         * @param [numSteps=6] - Number of steps that should be shown. Defaults
         *  to 6.
         * @returns - Returns the step size
         */
        function getNiceStep(max: number, numSteps: number = 6) {
          const rawStep = max / numSteps;
          // Greatest power of ten that is less or equal to rawstep
          // Example rawStep = 12:
          // log10(12) = 1.07... -> floor(1.07) = 1 -> 10¹ = 10
          const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
          // Normalize the rawStep so it will always be between 0 - 10
          const normalized = rawStep / magnitude;

          if (normalized <= 1)
            return magnitude;

          if (normalized <= 2)
            return 2 * magnitude;

          if (normalized <= 5)
            return 5 * magnitude;
          return 10 * magnitude;
        }

        /**
         * Get values for the staff axis (in hours)
         */
        const staffAxis = computed(() => {
          const step = getNiceStep(max_labortime_in_timeslot.value);
          const max = Math.ceil(max_labortime_in_timeslot.value / step) * step;
          const values = [];

          for (let v = 0; v <= max; v += step) {
            values.push({
              value: v,
              percent: (v / max) * 100
            });
          }

          return values.reverse();
        });

        /**
         * Get the max axis value (in hours)
         */
        const maxAxisValue = computed(() => {
          return Math.max(
            ...staffAxis.value.map(
              (axis_value) => axis_value.value)
          )
        });

        return {
          slots,
          emit,
          max_labortime_in_timeslot,
          requiredStaffTimeline,
          availableStaffTimeline,
          staffAxis,
          maxAxisValue,
        };
    }
})
</script>

<style scoped>

/* Styling for shifts */
.vs-shift-header-left {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background: #64748b;
  color: white;
  font-weight: 600;
  border-bottom: 1px solid #e5e7eb;
}

.vs-shift-header-right {
  position: relative;
  overflow: hidden;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.vs-shift-track {
  position: relative;
  height: 42px;
}

.vs-shift {
  position: absolute;
  top: 6px;
  height: 30px;
  border-radius: 6px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  background-color: var(--shift-color);
  left: var(--shift-left);
  width: var(--shift-width);
}

.vs-shift-left-cell {
  display: flex;
  align-items: center;
  padding: 0.625rem;
}

/* Styling for shift lines */
.vs-shift-lines {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
}

.vs-shift-lines-header {
  /*Position is relative, because otherwise the lines would cover the tasks.
  This is because the class vs-events has "contain: paint;" set, which creates
  a new stacking context.
  */
  position: relative;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
}

.vs-shift-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: var(--shift-color);
  left: var(--shift-left);
  opacity: 1;
  pointer-events: none;
}

/* Staff planning */
/* Label for staff row */
.vs-staff-label-cell {
  justify-content: space-between;
  align-items: stretch;
  display: flex;
  position: relative;
  padding: 0.625rem;
  background-color: #ffffff;
  color: #9ca3af;
  box-shadow: inset 0 -1px 0 0 #e5e7eb;
  grid-column: span 2;
  border-top: solid 2px;
  border-top-color: #000000;
}

.vs-staff-label-content {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 8px;
  flex: 1;
}

/* Legend container */
.vs-staff-legend {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

.vs-staff-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.vs-staff-legend-bar {
  width: 16px;
  height: 10px;
  background: var(--required-worktime-color);
  opacity: .4;
  border: 1px solid var(--required-worktime-color);
}

.vs-staff-legend-line {
  width: 16px;
  border-top: 2px solid var(--available-worktime-color);
}

/* Staff blocks */
.vs-staff-planning-track {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-top: solid 2px;
  border-top-color: #000000;
}

.vs-staff-planning-block {
  position: absolute;
  top: 0;
  bottom: 0;
  box-sizing: border-box;
  overflow: hidden;
}

.vs-staff-planning-fill {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--required-worktime-color);
  opacity: .35;
  transition: height .2s;
}

.vs-staff-planning-label {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
  font-weight: 600;
}

/* Timeslot lines for staff grid */
.vs-staff-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.vs-staff-grid-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: #e5e7eb;
}

/*  Lines for available staff */
.vs-available-staff-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background:  var(--available-worktime-color);
  z-index: 5;
}


/* Legend with hours */
.vs-staff-axis {
  position: relative;
  width: 45px;
  height: 100%;
}

.vs-staff-axis-label {
  position: absolute;
  right: 0px;
  transform: translateY(50%);
  font-size: 11px;
  color: #666;
}

/* Lines for hours of legend in timeline */
.vs-staff-grid-horizontal {
  position: absolute;
  left: 0;
  right: 0;
  border-top: 1px dashed #ddd;
}
</style>