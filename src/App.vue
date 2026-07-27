<template>
  <div>
    <div class="demo-controls">
      <div class="demo-field">
        <label
          for="cellWidth"
          class="demo-label"
        >cellWidth</label>
        <input
          id="cellWidth"
          v-model="options.cellWidth"
          class="demo-input"
          type="number"
          name="width"
        >
        <label
          for="scale"
          class="demo-label"
        >Scale</label>
        <input
          id="scale"
          v-model="options.scale"
          class="demo-input"
          type="number"
          name="scale"
          min="1"
          step="1"
        >
        <label
          for="show_shifts"
          class="demo-label"
        >Show Shifts</label>
        <input
          id="show_shifts"
          v-model="show_shifts"
          type="checkbox"
          name="show_shifts"
        >
      </div>
    </div>
    <div class="scheduler-demo">
      <VueScheduler
        v-if="!show_shifts"
        :end="end"
        :events="data"
        :headers="timelineHeaders"
        :identifiers="timelineItems"
        :options="options"
        :start="start"
        :spans="timespans"
        @event-activate="handle_event_activate"
      >
        <template #event="{ event }">
          <div class="event-body">
            <div class="event-label">
              <div class="event-title">
                {{ event.meta?.title }}
              </div>
              <div class="event-desc">
                {{ event.meta?.description }}
              </div>
              <div class="event-time">
                {{ event.start.toLocaleString() }}
              </div>
              <div class="event-time">
                {{ event.end.toLocaleString() }}
              </div>
            </div>
          </div>
        </template>
      </VueScheduler>
      <template v-else>
        <VueShiftScheduler
          :end="end"
          :events="data"
          :headers="timelineHeaders"
          :identifiers="timelineItems"
          :options="options"
          :start="start"
          :spans="timespans"
          :shifts="shifts"
          @event-activate="handle_event_activate"
        >
          <template #event="{ event }">
            <div class="event-body">
              <div class="event-title">
                {{ event.meta?.title }}
              </div>
              <div class="event-desc">
                {{ event.meta?.description }}
              </div>
              <div class="event-time">
                {{ event.start.toLocaleString() }}
              </div>
              <div class="event-time">
                {{ event.end.toLocaleString() }}
              </div>
            </div>
          </template>
        </VueShiftScheduler>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import VueScheduler from "./components/VueScheduler.vue";
import { Options, TimeSpan } from "./types/VueScheduler";
import { Shift, ProductionEvent  } from "./types/VueShiftScheduler";
import VueShiftScheduler from "./components/VueShiftScheduler.vue";

export default defineComponent({
  name: "App",
  components: {
    VueScheduler,
    VueShiftScheduler,
  },
  setup() {
    const timelineHeaders = ref(["Route", "Start time"]);

    const timelineItems = [
      ["BMON-A", "08:00am"],
      ["BMON-B", "08:00am"],
      ["BMON-C", "08:00am"],
      ["BMON-D", "08:00am"],
      ["BMON-E", "08:00am"],
      ["BMON-F", "08:00am"],
      ["BMON-G", "08:00am"],
    ];

    const start = new Date(2024, 1, 1, 6, 0);
    const end = new Date(2024, 1, 30, 23, 0);

    const options = ref<Options>({
      cellWidth: 150,
      rowHeight: 81,
      scale: 8,
      timeFormat: "HH:mm",
      dateFormat: "yyyy-MM-dd",
    });

    const show_shifts = ref(false);

    const data = ref<ProductionEvent[]>([
      {
        identiferIdx: 0,
        start: new Date(2024, 1, 1, 6, 0),
        end: new Date(2024, 1, 1, 14, 0),
        meta: {
          title: "Event 1",
          description: "Event 1 description",
          class: "event-emerald",
        },
        labortime: 8
      },
      {
        identiferIdx: 1,
        start: new Date(2024, 1, 1, 10, 0),
        end: new Date(2024, 1, 1, 18, 0),
        meta: {
          title: "Event 2",
          description: "Event 2 description",
          class: "event-orange",
        },
        labortime: 16
      },
    ]);

    const timespans = ref<TimeSpan[]>([
      {
        start: new Date(2024, 1, 2, 0, 28),
        end: new Date(2024, 1, 3, 1, 8),
        color: "span-red",
      },
      {
        start: new Date(2024, 1, 1, 1, 28),
        end: new Date(2024, 1, 2, 4, 0),
        color: "span-green",
        timelines: [0, 2],
      },
    ]);

    const shifts = ref<Shift[]>([
      // 1st february
      {
        id: 1,
        name: "Frühschicht",
        start: new Date(2024, 1, 1, 6, 0),
        end: new Date(2024, 1, 1, 14, 0),
        color: "#3b82f6",
        num_employees: 2,
      },
      {
        id: 2,
        name: "Spätschicht",
        start: new Date(2024, 1, 1, 14, 0),
        end: new Date(2024, 1, 1, 22, 0),
        color: "#f59e0b",
        num_employees: 2,
      },
      {
        id: 3,
        name: "Nachtschicht",
        start: new Date(2024, 1, 1, 22, 0),
        end: new Date(2024, 1, 2, 6, 0),
        color: "#6366f1",
        num_employees: 1,
      },

      // 2nd february
      {
        id: 4,
        name: "Frühschicht",
        start: new Date(2024, 1, 2, 6, 0),
        end: new Date(2024, 1, 2, 14, 0),
        color: "#3b82f6",
        num_employees: 4,
      },
      {
        id: 5,
        name: "Spätschicht",
        start: new Date(2024, 1, 2, 14, 0),
        end: new Date(2024, 1, 2, 22, 0),
        color: "#f59e0b",
        num_employees: 1,
      },

      // 3rd february
      {
        id: 6,
        name: "Wochenenddienst",
        start: new Date(2024, 1, 3, 8, 0),
        end: new Date(2024, 1, 3, 18, 0),
        color: "#10b981",
        num_employees: 2,
      },

      // 5th february
      {
        id: 7,
        name: "Frühschicht",
        start: new Date(2024, 1, 5, 6, 0),
        end: new Date(2024, 1, 5, 14, 0),
        color: "#3b82f6",
        num_employees: 2,
      },
      {
        id: 8,
        name: "Spätschicht",
        start: new Date(2024, 1, 5, 14, 0),
        end: new Date(2024, 1, 5, 22, 0),
        color: "#f59e0b",
        num_employees: 2,
      },

      // 10th february
      {
        id: 9,
        name: "Sonderschicht",
        start: new Date(2024, 1, 10, 10, 0),
        end: new Date(2024, 1, 10, 16, 0),
        color: "#ef4444",
        num_employees: 1,
      },

      // 15th february
      {
        id: 10,
        name: "Inventur",
        start: new Date(2024, 1, 15, 7, 0),
        end: new Date(2024, 1, 15, 19, 0),
        color: "#8b5cf6",
        num_employees: 4,
      },
    ]);

    function handle_event_activate(event: Event) {
      alert('Event "event-activate" emitted: ' + JSON.stringify(event));
    }

    return {
      timelineHeaders,
      timelineItems,
      start,
      end,
      options,
      data,
      timespans,
      shifts,
      show_shifts,
      handle_event_activate,
    };
  },
});
</script>

<style scoped>
.demo-controls {
  width: 100%;
  margin-bottom: 1rem;
}

.demo-field {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 2rem;
  margin-bottom: 1.25rem;
}

.demo-label {
  display: inline;
  margin-bottom: 0;
  font-size: 0.875rem;
  font-weight: 500;
}

.demo-input {
  display: inline-block;
  width: 6rem;
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: #f9fafb;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  margin-bottom: 0;
}

.demo-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
}

.event-body {
  width: 100%;
  height: 100%;
  overflow: clip;
}

/* Sticky label stays visible at the left when a wide block is scrolled. */
.event-label {
  position: sticky;
  left: 0;
  width: max-content;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0.5rem;
  font-size: 0.75rem;
  color: #ffffff;
}

.event-title {
  font-weight: 700;
}

.event-desc {
  color: #e2e8f0;
}

.event-time {
  color: #cbd5e1;
}
</style>

<!-- Non-scoped: demo page reset + classes applied inside child components -->
<style>
*, *::before, *::after {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  line-height: 1.5;
}

.event-emerald {
  background-color: #10b981;
  border-radius: 0.375rem;
}

.event-orange {
  background-color: #f97316;
  border-radius: 0.375rem;
}

.span-red {
  background-color: #f87171;
}

.span-green {
  background-color: #065f46;
}

.scheduler-demo {
  max-height: 90vh;
  overflow-y: scroll;
}
</style>
