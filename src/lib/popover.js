const GAP = 12;

/**
 * Inline style placing a popover beside a highlighted box, centred when there is no box.
 * @param {{ top: number, left: number, bottom: number, right: number, width: number, height: number } | null} box
 * @param {{ width: number, height: number }} viewport
 * @param {{ width: number, height: number }} size Popover size.
 */
export function placePopover(box, viewport, size) {
  const base = { width: `${size.width}px` };
  if (!box) return { ...base, top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  const left = `${Math.min(Math.max(GAP, box.left), viewport.width - size.width - GAP)}px`;
  if (box.bottom + GAP + size.height < viewport.height) {
    return { ...base, left, top: `${box.bottom + GAP}px` };
  }
  if (box.top > size.height + GAP) {
    return { ...base, left, bottom: `${viewport.height - box.top + GAP}px` };
  }
  return { ...base, left: `${box.left + GAP}px`, top: `${box.top + GAP}px` };
}
