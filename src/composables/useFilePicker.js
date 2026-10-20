import { ref } from "vue";

/**
 * Hidden `<input type="file">` plumbing: bind `input` as the ref and `onChange` as the handler.
 * The value is reset after each pick so the same file can be chosen twice.
 * @param {(file: File) => void} handler
 */
export function useFilePicker(handler) {
  const input = ref(null);

  function open() {
    input.value.click();
  }

  function onChange(event) {
    const file = event.target.files[0];
    event.target.value = "";
    if (file) handler(file);
  }

  return { input, open, onChange };
}
