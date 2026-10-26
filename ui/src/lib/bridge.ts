// Python -> UI events. public/bridge.js exposes fixed function names to eel and
// forwards each call to the dispatcher registered here, which fans out to every
// mounted React listener.
import { useEffect, useRef } from "react"

type Listener = (...args: never[]) => unknown

function bridge() {
  window.__robinBridge ??= { handlers: {}, recording: {} }
  return window.__robinBridge
}

export type PythonEvent =
  | "log"
  | "loadTasks"
  | "loadInputs"
  | "toggleStartStop"
  | "updateMacroMode"
  | "refreshCurrentTabContent"
  | "updateProgress"
  | "updateButtonReset"

const listeners = new Map<PythonEvent, Set<Listener>>()

function listenersFor(name: PythonEvent) {
  let set = listeners.get(name)
  if (!set) {
    set = new Set()
    listeners.set(name, set)
    // Python may await a return value (e.g. toggleStartStop), so hand back the first result.
    bridge().handlers[name] = ((...args: never[]) => {
      let result: unknown = null
      for (const fn of set!) {
        const value = fn(...args)
        if (result === null) result = value
      }
      return result
    }) as Listener
  }
  return set
}

/** Listen for a call Python makes into the UI, for the lifetime of the component. */
export function usePythonEvent<F extends Listener>(name: PythonEvent, handler: F) {
  const ref = useRef(handler)
  ref.current = handler
  useEffect(() => {
    const forward = ((...args: never[]) => ref.current(...args)) as Listener
    const set = listenersFor(name)
    set.add(forward)
    return () => {
      set.delete(forward)
    }
  }, [name])
}

/** Tell the macro a keybind field is capturing keys, so it ignores its own hotkeys meanwhile. */
export function setKeybindRecording(id: string, recording: boolean) {
  bridge().recording[id] = recording
}
