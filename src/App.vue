<template>
  <div>
    <div class="max-w-sm mx-auto">
      <div class="mb-5">
        <label
          for="cellWidth"
          class="block mb-2.5 text-sm font-medium text-heading"
        >cellWidth</label>
        <input
          id="cellWidth"
          v-model="options.cellWidth"
          class="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body"
          type="number"
          name="width"
        >
        <label
          for="scale"
          class="block mb-2.5 text-sm font-medium text-heading"
        >Scale</label>
        <input
          id="scale"
          v-model="options.scale"
          class="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body"
          type="number"
          name="scale"
          min="1"
          step="1"
        >
      </div>
    </div>
    <VueScheduler
      :end="end"
      :events="data"
      :headers="timelineHeaders"
      :identifiers="timelineItems"
      :options="options"
      :start="start"
    >
      <template #event="{ event }">
        <div class="flex flex-col truncate p-2 text-xs text-white">
          <div class="font-bold">
            {{ event.meta?.title }}
          </div>
          <div class="text-slate-200">
            {{ event.meta?.description }}
          </div>
          <div class="text-slate-300">
            {{ event.start.toLocaleString() }}
          </div>
          <div class="text-slate-300">
            {{ event.end.toLocaleString() }}
          </div>
        </div>
      </template>
    </VueScheduler>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import VueScheduler from "./components/VueScheduler.vue";
import { Event, Options } from "./types/VueScheduler";

export default defineComponent({
  name: "App",
  components: {
    VueScheduler,
  },
  setup() {
    /**
     * Timeline headers
     */
    const timelineHeaders = ref(["Route", "Start time"]);

    /**
     * Generate row data
     */
    const timelineItems = [
      ["BMON-A", "08:00am"],
      ["BMON-B", "08:00am"],
      ["BMON-C", "08:00am"],
      ["BMON-D", "08:00am"],
      ["BMON-E", "08:00am"],
      ["BMON-F", "08:00am"],
      ["BMON-G", "08:00am"],
    ];

    /**
     * Refactored data
     */

    const start = new Date(2024, 1, 1, 6, 0);
    const end = new Date(2024, 1, 30, 23, 0);

    const options = ref<Options>({
      cellWidth: 150,
      rowHeight: 81,
      scaleUnit: "minutes",
      scale: 8,
      timeFormat: "HH:mm",
      dateFormat: "yyyy-MM-dd",
    });

    const data = ref<Event[]>([
      {
        identiferIdx: 0,
        start: new Date(2024, 1, 1, 6, 0),
        end: new Date(2024, 1, 1, 14, 0),
        meta: {
          title: "Event 1",
          description: "Event 1 description",
          class: "bg-emerald-500 rounded-md",
        },
      },
      {
        identiferIdx: 1,
        start: new Date(2024, 1, 1, 3, 0),
        end: new Date(2024, 1, 1, 5, 0),
        meta: {
          title: "Event 2",
          description: "Event 2 description",
          class: "bg-orange-500 rounded-md",
        },
      },
    ]);

    return {
      timelineHeaders,
      timelineItems,
      start,
      end,
      options,
      data,
    };
  },
});
</script>
