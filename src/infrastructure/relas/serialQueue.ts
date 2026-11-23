/**
 * Cola en serie para los guardados del expediente compartido.
 *
 * Cada guardado en Firebase parte de la revisión que el navegador conoce. Si
 * dos guardados corren a la vez (el autoguardado posterior a la recuperación y
 * un guardado pedido por la persona), los dos parten de la misma revisión y el
 * segundo choca con el primero: «Firebase contiene una revisión diferente».
 * Con la cola, cada guardado empieza cuando termina el anterior y lee la
 * revisión que ese dejó confirmada. El fallo de uno no bloquea los siguientes.
 */
export function createSerialQueue() {
  let tail: Promise<unknown> = Promise.resolve();
  return function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = tail.then(task, task);
    tail = run.catch(() => undefined);
    return run;
  };
}
