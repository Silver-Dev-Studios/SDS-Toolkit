/** Reusable file dropzone / input binding. */

export function bindFileDrop(root, { inputSel, dropSel, onFile }) {
  const input = root.querySelector(inputSel);
  const drop = root.querySelector(dropSel);
  if (!input || !drop) return;

  input.addEventListener("change", () => {
    const f = input.files && input.files[0];
    if (f) onFile(f);
    input.value = "";
  });

  ["dragenter", "dragover"].forEach((ev) =>
    drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("drag"); })
  );
  ["dragleave", "drop"].forEach((ev) =>
    drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("drag"); })
  );
  drop.addEventListener("drop", (e) => {
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) onFile(f);
  });
  drop.addEventListener("click", () => input.click());

  return { input, drop, clearFile: () => { input.value = ""; } };
}