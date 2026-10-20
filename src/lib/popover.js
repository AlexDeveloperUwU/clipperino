const GAP = 12;

/**
 * Pixel `top`/`left`/`width` placing a popover beside a highlighted box, centred when there is no box.
 * Always the same properties, so moving between targets can be transitioned.
 * @param {{ top: number, left: number, bottom: number, right: number, width: number, height: number } | null} box
 * @param {{ width: number, height: number }} viewport
 * @param {{ width: number, height: number }} size Popover size.
 */
export function placePopover(box, viewport, size) {
  const at = (left, top) => ({
    width: `${size.width}px`,
    left: `${Math.round(left)}px`,
    top: `${Math.round(top)}px`,
  });
  if (!box) return at((viewport.width - size.width) / 2, (viewport.height - size.height) / 2);
  const left = Math.min(Math.max(GAP, box.left), viewport.width - size.width - GAP);
  if (box.bottom + GAP + size.height < viewport.height) return at(left, box.bottom + GAP);
  if (box.top > size.height + GAP) return at(left, box.top - size.height - GAP);
  const top = Math.min(Math.max(GAP, box.top), viewport.height - size.height - GAP);
  if (box.right + GAP + size.width < viewport.width) return at(box.right + GAP, top);
  if (box.left - GAP - size.width > 0) return at(box.left - GAP - size.width, top);
  return at(box.left + GAP, box.top + GAP);
}
