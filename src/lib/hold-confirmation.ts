export function createHoldConfirmation({ complete, milliseconds = 5000, schedule = setTimeout, clear = clearTimeout }: {
  complete: () => void; milliseconds?: number;
  schedule?: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
  clear?: (timer: ReturnType<typeof setTimeout>) => void;
}) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    start() {
      if (timer !== undefined) return false;
      timer = schedule(() => { timer = undefined; complete(); }, milliseconds);
      return true;
    },
    cancel() { if (timer !== undefined) clear(timer); timer = undefined; },
  };
}
