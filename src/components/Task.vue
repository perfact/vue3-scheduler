<template>
  <div
    ref="elem"
    :class="[
      'event',
      event.meta?.class,
      { 'event--static': !mayDrag },
      { '-no-transition': isDropping },
    ]"
    :style="{
      height: `${rowHeight - 1}px`,
      width: `${getElemWidth(event.start, event.end, cellWidth, scale)}px`,
      left: `${getElemLeft(start, event.start, cellWidth, scale)}px`,
      top: `${top}px`,
    }"
    data-x="0"
    data-y="0"
    class="draggable"
  >
    <div class="event-content">
      <slot
        name="event"
        :event="event"
      />
    </div>
    <!-- resize handle, only shown when the duration may actually be changed -->
    <svg
      v-if="mayResize"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 192 512"
      class="resize-handle"
      :style="{
        top: `${rowHeight / 3}px`,
      }"
    >
      <path
        class="resize-handle-path"
        d="M0 64C0 46.33 14.33 32 32 32C49.67 32 64 46.33 64 64V448C64 465.7 49.67 480 32 480C14.33 480 0 465.7 0 448V64z"
      />
      <path
        class="resize-handle-path"
        d="M128 64C128 46.33 142.3 32 160 32C177.7 32 192 46.33 192 64V448C192 465.7 177.7 480 160 480C142.3 480 128 465.7 128 448V64z"
      />
    </svg>
  </div>
</template>
<script lang="ts">
import { computed, defineComponent, PropType, ref, nextTick } from "vue";
import interact from "interactjs";
import { Target } from "@interactjs/types";
import { watchEffect } from "vue";
import { Event } from "../types/VueScheduler";
import { getElemLeft, getElemWidth } from "../util/position";

export default defineComponent({
  name: "Task",
  props: {
    event: {
      type: Object as PropType<Event>,
      required: true,
    },
    rowHeight: {
      type: Number,
      required: true,
    },
    cellWidth: {
      type: Number,
      required: true,
    },
    scale: {
      type: Number,
      required: true,
    },
    start: {
      type: Date,
      required: true,
    },
    top: {
      type: Number,
      required: true,
    },
  },
  emits: ["resize", "dragged", "activate"],
  setup(props, { emit }) {
    const elem = ref<Target>();
    const position = { x: 0, y: 0 };
    const isDropping = ref(false);

    // Interaction permissions. An omitted flag means allowed, so events
    // without any permission information behave as before.
    const mayResize = computed(() => props.event.may_resize !== false);
    const mayMoveTime = computed(() => props.event.may_move_time !== false);
    const mayMoveRow = computed(() => props.event.may_move_row !== false);
    const mayDrag = computed(() => mayMoveTime.value || mayMoveRow.value);
    // Restrict dragging to the axis the caller allows: horizontally shifts the
    // event in time, vertically moves it onto another identifier row. This is
    // only relevant when dragging is enabled, so at least one movement flag is
    // true; when time movement is disabled, row movement must be enabled.
    const lockAxis = computed<"x" | "y" | "xy">(() => {
      if (mayMoveTime.value && mayMoveRow.value) return "xy";
      return mayMoveTime.value ? "x" : "y";
    });

    watchEffect((onCleanup) => {
      const element = elem.value;
      if (!element) return;

      const rowHeightValue = props.rowHeight || 50;

      function snapYOnly(x: number, y: number) {
        const snappedY = Math.round(y / (rowHeightValue)) * (rowHeightValue);
        return {
          x, // Return x at it was, we dont want x snapping, only y snapping
          y: snappedY,
        };
      }

      interact(element)
        .resizable({
          enabled: mayResize.value,
          // resize from all edges and corners
          edges: { left: false, right: true, bottom: false, top: false },
          listeners: {
            move(event) {
              emit("resize", { event, timelineEvent: props.event });
            },
          },
          modifiers: [
            // keep the edges inside the parent
            interact.modifiers.restrictEdges({
              outer: "parent",
            }),
          ],
          inertia: false,
        })
        .draggable({
          enabled: mayDrag.value,
          lockAxis: lockAxis.value,
          origin: { x: 0, y: 0 },
          listeners: {
            move: function (event) {
              position.x += event.dx;
              position.y += event.dy;

              event.target.style.setProperty(
                "--translate-x",
                `${position.x}px`,
              );
              event.target.style.setProperty(
                "--translate-y",
                `${position.y}px`,
              );
            },
            end: async function (event) {
              // Deactivate transitions for this event
              isDropping.value = true;
              emit("dragged", {
                timelineEvent: props.event,
                x: position.x,
                y: position.y,
              });
              // Wait for vue to calculate the new top value
              await nextTick();
              position.x = 0;
              position.y = 0;
              event.target.style.setProperty(
                "--translate-x",
                `${position.x}px`,
              );
              event.target.style.setProperty(
                "--translate-y",
                `${position.y}px`,
              );
              requestAnimationFrame(() => {
                isDropping.value = false;
              });
            },
          },
          modifiers: [
            interact.modifiers.snap({
              targets: [snapYOnly],
              range: Infinity,
              relativePoints: [{ x: 0, y: 0 }],
              offset: "parent",
              endOnly: true,
            }),
            interact.modifiers.restrict({
              restriction: "parent",
              elementRect: { top: 0, left: 0, bottom: 1, right: 0 },
              endOnly: false,
            }),
          ],
          inertia: true,
          autoScroll: true,
        })
        .on("tap", () => emit("activate", props.event));

        onCleanup(() => {
          interact(element).unset();
        });
      }
    );
    return {
      getElemWidth,
      getElemLeft,
      elem,
      mayResize,
      mayDrag,
      isDropping,
    };
  },
});
</script>
<style scoped>
.event {
  transition: width 0.05s linear, top 0.2s ease, height 0.2s ease;
  z-index: 10;
  position: absolute;
  display: flex;
  transform: translate(var(--translate-x, 0), var(--translate-y, 0));
  background-color: #3b82f6;
  box-shadow:
    1px 0 3px rgba(0, 0, 0, 0.25),
    -1px 0 3px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
}

.event:hover {
  z-index: 20;
  box-shadow: 
    2px 2px 6px rgba(0, 0, 0, 0.3),
    -2px 2px 6px rgba(0, 0, 0, 0.3),
    -2px -2px 6px rgba(0, 0, 0, 0.3),
    2px -2px 6px rgba(0, 0, 0, 0.3);
}

/* Fill the whole block so slot content (background, tooltip activator, hover
   area) covers the entire event, not just the text. The label inside the slot
   can opt into `position: sticky` to stay visible when a wide block is
   scrolled horizontally. */
.event-content {
  width: 100%;
  height: 100%;
}

.event.-no-transition {
  transition: none;
}

.draggable {
  touch-action: none;
  user-select: none;
}

/* Events the caller does not allow to be moved. interact.js only manages the
   cursor while dragging is enabled, so it is set explicitly here. */
.event--static {
  cursor: default;
}

.resize-handle {
  position: absolute;
  right: 0;
  height: 1rem;
  width: 1rem;
}

.resize-handle-path {
  opacity: 0.4;
  fill: white;
}
</style>
