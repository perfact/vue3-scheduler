<template>
  <div
    id="vue3-scheduler"
    class="grid h-full rounded-lg overflow-hidden overscroll-none bg-gray-100 p-3"
    style="grid-template-areas: 'grid1 grid2 grid2 grid2 grid2 '"
  >
    <!-- Headers + Identifers (first column) -->
    <div
      id="first-column"
      class="border-r rounded-l-lg bg-gray-300 mr-px overflow-hidden overscroll-noner min-w-fit"
    >
      <!-- Headers -->
      <div
        id="headers"
        class="flex border-b"
      >
        <div
          v-for="(header, index) in headers"
          :key="index"
          class="grid w-full text-left items-center relative p-2.5 mr-px text-xs text-gray-100 bg-slate-500 min-w-fit"
          :style="{
            'min-height': `${rowHeight}px`,
            'max-height': `${rowHeight}px`,
          }"
        >
          {{ header }}
        </div>
      </div>
      <!-- Identifiers -->
      <div
        id="identifiers"
        class="relative"
      >
        <div
          v-for="(identifier, index) in identifiers"
          :key="index"
          class="flex flex-row w-full"
        >
          <div
            v-for="col in identifier"
            :key="col"
            class="grid w-full text-left relative border-b p-2.5 mr-px bg-white text-xs text-gray-400 leading-10 text-medium min-w-fit"
            :style="{
              'min-height': `${rowHeight}px`,
              'max-height': `${rowHeight}px`,
            }"
          >
            {{ col }}
          </div>
        </div>
      </div>
    </div>
    <!-- Timeline + Events (second column) -->
    <div
      id="second-column"
      class="flex flex-col overflow-auto rounded-r-lg"
    >
      <!-- Timeline -->
      <div
        id="timeline"
        class="flex border-b"
      >
        <div
          v-for="time in getTimeline"
          :key="time.id"
          class="overflow-hidden text-center items-center relative p-2.5 border-r bg-slate-500 text-xs text-gray-100"
          :style="{
            'min-width': `${cellWidth}px`,
            'max-width': `${cellWidth}px`,
            'min-height': `${rowHeight}px`,
            'max-height': `${rowHeight}px`,
          }"
        >
          <span>
            {{ time.formattedDate }}
            {{ time.formattedTime }}
          </span>
        </div>
      </div>
      <!-- Events -->
      <div
        id="events"
        class="relative"
      >
        <!-- events -->
        <Task
          v-for="(event, index) in events"
          :key="index"
          :event="event"
          :row-height="rowHeight"
          :cell-width="cellWidth"
          :scale="scale"
          :start="start"
          @resize="eventResized"
          @dragged="eventDragged"
        >
          <template #event="slotData">
            <slot
              name="event"
              v-bind="slotData"
            />
          </template>
        </Task>
        <!-- Empty event grid -->
        <div
          v-for="(_row, index) in identifiers"
          :key="index"
          ref="dropzones"
          class="flex dropzone"
        >
          <!-- Timespans underneath the event grid -->
          <template
            v-for="(span, spanIdx) in spans"
            :key="spanIdx"
          >
            <div
              v-if="!span.timelines || span.timelines.includes(index)"
              :class="['timespan', span.color]"
              :style="{
                height: `${rowHeight}px`,
                width: `${getElemWidth(span.start, span.end, cellWidth, scale)}px`,
                left: `${getElemLeft(start, span.start, cellWidth, scale)}px`,
                top: `${index * rowHeight}px`,
              }"
            />
          </template>
          <div
            v-for="(_time, timeIdx) in getTimeline"
            :key="timeIdx"
            class="timeslot text-center relative p-2.5 border-b border-gray-20 border-r text-xs text-white leading-10 text-medium"
            :style="{
              'min-width': `${cellWidth}px`,
              'max-width': `${cellWidth}px`,
              'min-height': `${rowHeight}px`,
              'max-height': `${rowHeight}px`,
            }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { computed, defineComponent, onMounted, PropType, ref, isRef, watchEffect } from "vue";
import { Target, ResizeEvent } from "@interactjs/types";
import interact from "interactjs";
import { format } from "date-fns";
import Task from "./Task.vue";
import { Options, Event, TimeSpan } from "../types/VueScheduler";
import { getElemLeft, getElemRow, getElemWidth } from "../util/position";

const DEFAULT_OPTIONS: Options = {
  cellWidth: 100,
  rowHeight: 50,
  timeFormat: "HH:mm",
  dateFormat: "yyyy-MM-dd",
};

export default defineComponent({
  name: "VueScheduler",
  components: { Task },
  props: {
    end: {
      type: Date,
      required: true,
    },
    events: {
      type: Array as PropType<Event[]>,
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
  },
  setup(props) {
    const cellWidth = computed(
      () => props.options?.cellWidth || DEFAULT_OPTIONS.cellWidth,
    );
    const rowHeight = computed(
      () => props.options?.rowHeight || DEFAULT_OPTIONS.cellWidth,
    );
    const scale = computed(() => props.options?.scale || 0.5);
    const dropzones = ref<Array<Target>>();

    /**
     * Generate the timeline based on the scale
     * @param scale
     * @returns {Array} Array of strings representing the time slots
     */
    function generateTimeline() {
      const timeSlots = [];
      const start = new Date(props.start);
      const end = new Date(props.end);

      // convert scale from decimal to minutes
      const scaleInMinutes = scale.value * 60;

      for (
        let i = start;
        i < end;
        i.setMinutes(i.getMinutes() + scaleInMinutes)
      ) {
        timeSlots.push({
          id: i.getTime(),
          date: i,
          // formattedTime: i.toLocaleTimeString(),
          // hh:mm am/pm
          formattedDate: format(
            i,
            props.options?.dateFormat || DEFAULT_OPTIONS.dateFormat,
          ),
          formattedTime: format(
            i,
            props.options?.timeFormat || DEFAULT_OPTIONS.timeFormat,
          ),
        });
      }

      return timeSlots;
    }

    /**
     * Get the timeline
     */
    const getTimeline = computed(() => generateTimeline());

    function eventResized({
      event,
      timelineEvent,
    }: {
      event: ResizeEvent;
      timelineEvent: Event;
    }) {
      const resolution = 15.0;
      const width = event.rect.width;
      let minutes = Math.round((width / cellWidth.value) * scale.value * 60.0); // convert width to time based on the scale

      const distance = minutes % resolution;
      if (distance > resolution / 2) {
        minutes += resolution - distance;
      } else {
        minutes -= distance;
      }
      if (minutes < resolution) {
        minutes = resolution;
      }
      // remove decimal from timeLength

      const startDateObject = timelineEvent.start;
      const endDateObject = new Date(
        new Date(startDateObject).setMinutes(
          startDateObject.getMinutes() + minutes,
        ),
      );
      timelineEvent.end = endDateObject;
    }

    function eventDragged({
      x,
      y,
      timelineEvent,
    }: {
      x: number;
      y: number;
      timelineEvent: Event;
    }) {
      const minutes = (x / cellWidth.value) * scale.value * 60.0; // convert width to time based on the scale
      timelineEvent.start = new Date(
        timelineEvent.start.setMinutes(
          timelineEvent.start.getMinutes() + minutes,
        ),
      );
      timelineEvent.end = new Date(
        timelineEvent.end.setMinutes(timelineEvent.end.getMinutes() + minutes),
      );

      const newIx =
        timelineEvent.identiferIdx + Math.floor(y / rowHeight.value);
      timelineEvent.identiferIdx = Math.min(
        Math.max(0, newIx),
        props.identifiers.length,
      );
    }

    watchEffect((onCleanup) => {
      const zones = dropzones.value;
      if (!zones?.length) return;

      zones.forEach((value) =>
        interact(value)
          .dropzone({
            checker: function (
              _dragEvent,
              _event,
              dropped,
              dropzone,
              dropElement,
              draggable,
              draggableElement,
            ) {
              const rect = dropzone.getRect(dropElement);
              const dragRect = draggable.getRect(draggableElement);
              if (dragRect && rect) {
                const cx = dragRect.left + rect.width / 2;
                const cy = dragRect.top + dragRect.height / 2;
                dropped =
                  cx >= rect.left &&
                  cx <= rect.right &&
                  cy >= rect.top &&
                  cy <= rect.bottom;
              }
              return dropped;
            },
            ondrop: function (event) {
              const draggableElement = event.relatedTarget;
              const dropzoneElement = event.target;
              dropzoneElement.classList.remove("drop-target");
              draggableElement?.classList.remove("-drop-possible");
            },
            ondragenter: function (event) {
              const draggableElement = event.relatedTarget;
              const dropzoneElement = event.target;
              dropzoneElement.classList.add("drop-target");
              draggableElement?.classList.add("-drop-possible");
            },
            ondragleave: function (event) {
              const draggableElement = event.relatedTarget;
              const dropzoneElement = event.target;
              dropzoneElement.classList.remove("drop-target");
              draggableElement?.classList.remove("-drop-possible");
            },
          })
          .on("dropactivate", function (event) {
            event.target.classList.add("drop-activated");
          }),
        );

        onCleanup(() => {
          zones.forEach(el => {
            interact(el).unset();
          })
        })
      }
    );

    return {
      cellWidth,
      rowHeight,
      getTimeline,
      getElemWidth,
      getElemLeft,
      getElemRow,
      scale,
      eventResized,
      eventDragged,
      dropzones,
    };
  },
});
</script>
<style scoped>
.dropzone.drop-target {
  background-color: rgb(213, 250, 213);
}

.dropzone.drop-target .timespan {
  filter: saturate(0.75);
}

#events {
  width: fit-content;
  contain: paint;
}

.timespan {
  position: absolute;
}
</style>
