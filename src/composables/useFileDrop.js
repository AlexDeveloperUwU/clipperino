import { computed, ref } from "vue";

/**
 * Drag-and-drop state for a drop zone: bind `handlers` to the element and show an overlay while `dragging`.
 * @param {(dataTransfer: DataTransfer) => void} onDrop Called with the drop's data; runs synchronously inside the event.
 */
export function useFileDrop(onDrop) {
  const depth = ref(0);

  const handlers = {
    onDragenter(event) {
      event.preventDefault();
      depth.value++;
    },
    onDragover(event) {
      event.preventDefault();
    },
    onDragleave(event) {
      event.preventDefault();
      depth.value = Math.max(0, depth.value - 1);
    },
    onDrop(event) {
      event.preventDefault();
      depth.value = 0;
      onDrop(event.dataTransfer);
    },
  };

  return { dragging: computed(() => depth.value > 0), handlers };
}
