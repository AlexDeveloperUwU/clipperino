import { nextTick, ref } from "vue";

const BATCH_SIZE = 50;
const NEAR_EDGE_PX = 300;
const NEAR_TOP_PX = 100;
const SCROLL_DEBOUNCE_MS = 50;

/**
 * Renders a growing window of a long list: extends it near either edge while
 * scrolling and re-centres it on demand, so huge transcripts stay light in the DOM.
 * @param {import("vue").Ref<HTMLElement | null>} container Scrollable element holding the rows.
 * @param {() => number} getTotal Current list length.
 */
export function useRowWindow(container, getTotal) {
  const start = ref(0);
  const end = ref(0);
  let scrollTimer = null;

  /** Returns the window to the top of the list. */
  function reset() {
    start.value = 0;
    end.value = Math.min(getTotal(), BATCH_SIZE * 2);
  }

  /** Row element for `index`, if it is currently rendered. */
  function rowElement(index) {
    return container.value?.querySelector(`tr[data-index="${index}"]`);
  }

  /** Scrolls `index` into view, re-centring the window first when it is not rendered. */
  async function scrollToRow(index) {
    if (index < 0 || getTotal() === 0) return;

    const rendered = rowElement(index);
    if (rendered) {
      rendered.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }

    start.value = Math.max(0, index - BATCH_SIZE);
    end.value = Math.min(getTotal(), index + BATCH_SIZE);
    await nextTick();
    rowElement(index)?.scrollIntoView({ block: "center", behavior: "auto" });
  }

  /** Prepends a batch while keeping the visible rows where they were. */
  async function growUp() {
    const el = container.value;
    const previousHeight = el.scrollHeight;
    const previousTop = el.scrollTop;
    start.value = Math.max(0, start.value - BATCH_SIZE);
    await nextTick();
    el.scrollTop = previousTop + (el.scrollHeight - previousHeight);
  }

  /** Scroll handler: extends the window near the top or bottom edge. */
  function onScroll() {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const el = container.value;
      if (!el) return;
      const nearBottom = el.scrollTop + el.clientHeight > el.scrollHeight - NEAR_EDGE_PX;
      if (nearBottom && end.value < getTotal()) {
        end.value = Math.min(getTotal(), end.value + BATCH_SIZE);
      }
      if (el.scrollTop < NEAR_TOP_PX && start.value > 0) growUp();
    }, SCROLL_DEBOUNCE_MS);
  }

  return { start, end, reset, scrollToRow, onScroll };
}
