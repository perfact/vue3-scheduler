<template>
  <div
    v-for="event in events"
    :key="event.identiferIdx"
  >
    Event: {{ event.meta?.title }}
    -> Duration: {{ get_duration_of_event(event) }}
    -> Labortime: {{ event.labortime }}
    -> Hours per slot: {{ options.scale }}
    -> Required Time per timeslot: {{ calc_required_time_for_event_in_timeslot(event) }}
  </div>
  Max laborttime in timeslot: {{ max_labortime_in_timeslot }}
  <VueScheduler
    :end="end"
    :events="events"
    :headers="headers"
    :identifiers="identifiers"
    :options="options"
    :start="start"
    :spans="spans"
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
        <slot name="staff-planning-label">
          Personal-Planung
        </slot>
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
        <div class="vs-staff-planning-timeslot-container">
          <div
            v-for="(time_slot, timeIdx) in get_staff_timeline(timeline)"
            :key="timeIdx"
            class="vs-staff-planning-timeslot"
            :style="{
              'min-width': `${cell_width}px`,
              'max-width': `${cell_width}px`,
              'min-height': `${3 * row_height}px`,
              'max-height': `${3 * row_height}px`,
            }"
          >
            <div
              class="vs-staff-planning-bar"
              :style="{
                transform: `scaleY(${get_bar_height(time_slot) / 100})`,
              }"
            />

            <span class="vs-staff-planning-text">
              {{ time_slot.labortime ?? 0 }}
            </span>
          </div>
        </div>
      </slot>
    </template>
  </VueScheduler>
</template>

<script lang="ts">
import { defineComponent, PropType, useSlots, computed, ref } from "vue";
import { Options, TimeSpan } from "../types/VueScheduler";
import { Shift, ShiftEvent } from "../types/VueShiftScheduler";
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
    },
    emits: ["event-activate"],
    setup(_props, { emit }) {
        const slots = useSlots();
        const staff_timeline = ref([]);


        const max_labortime_in_timeslot = computed(() => {
          let max_time = 0;
          for (const timeline_slot of staff_timeline.value) {
            if (timeline_slot.labortime && timeline_slot.labortime > max_time) {
              max_time = timeline_slot.labortime;
            }
          }
          return max_time;
        });

        function get_duration_of_event(event: ShiftEvent) {
          const diffTime = Math.abs(event.end.getTime() - event.start.getTime());
          const diffHours = Math.floor(diffTime / (1000 * 60 * 60 ));
          return diffHours
        }

        function calc_required_time_for_event_in_timeslot(event: ShiftEvent) {
          const event_duration = get_duration_of_event(event);
          const required_time_per_hour = event.labortime / event_duration;
          const scale = props.options.scale ?? 1;
          return required_time_per_hour * scale;
        }

        function get_staff_timeline(timeline: object[]) {
          const timeline_copy = JSON.parse(JSON.stringify(timeline));
          const scale = props.options.scale ?? 1;
          const start = props.start.getTime();
          for (const event of props.events) {
            // Get start index
            const start_diff = Math.abs(event.start.getTime() - start);
            const start_diff_hours = start_diff / (1000 * 60 * 60 );
            const start_index = Math.floor(start_diff_hours / scale);
            // Get end index
            const end_diff = Math.abs(event.end.getTime() - start);
            const end_diff_hours = end_diff / (1000 * 60 * 60 );
            const end_index = Math.ceil(end_diff_hours / scale);

            // Calculate labortime for time slot
            for (let index = start_index; index < end_index; index++) {
              const timeline_obj = timeline_copy[index];
              const time_per_slot = calc_required_time_for_event_in_timeslot(
                event
              );
              timeline_obj.labortime = time_per_slot + (timeline_obj.labortime ?? 0);
            }
          }
          staff_timeline.value = timeline_copy;
          return timeline_copy;
        }

        function get_bar_height(time_slot: object) {
          if (!max_labortime_in_timeslot.value) {
            return 0;
          }

          return (time_slot.labortime ?? 0) / max_labortime_in_timeslot.value * 100;
        }

        return {
            slots,
            emit,
            staff_timeline,
            get_staff_timeline,
            get_duration_of_event,
            calc_required_time_for_event_in_timeslot,
            max_labortime_in_timeslot,
            get_bar_height,
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
.vs-staff-label-cell {
  display: flex;
  align-items: center;
  position: relative;
  padding: 0.625rem;
  background-color: #ffffff;
  color: #9ca3af;
  box-shadow: inset 0 -1px 0 0 #e5e7eb;
  grid-column: span 2;
}

.vs-staff-planning-timeslot-container {
  display: flex;
}

.vs-staff-planning-timeslot {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: hidden;
  border-right: 1px solid #e5e7eb;
}

.vs-staff-planning-bar {
  position: absolute;
  inset: 0;
  background: #3b82f6;
  transform-origin: bottom;
}

.vs-staff-planning-text {
  position: relative;
  z-index: 1;
}
</style>