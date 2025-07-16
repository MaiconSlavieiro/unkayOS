// eventBus.js - Simple Pub/Sub for unkayOS

const listeners = {};

export function on(event, cb) {
  (listeners[event] ||= []).push(cb);
}

export function off(event, cb) {
  if (!listeners[event]) return;
  listeners[event] = listeners[event].filter(fn => fn !== cb);
}

export function emit(event, data) {
  (listeners[event] || []).forEach(cb => cb(data));
}

export default { on, off, emit };
