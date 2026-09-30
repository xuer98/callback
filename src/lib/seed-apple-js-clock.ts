// Shared by the async drivers in the Apple front-end bank
// (seed-apple-js-b.ts and seed-apple-js-c.ts).

/**
 * A virtual clock for async drivers: setTimeout, clearTimeout and Date.now
 * are replaced by a scheduler, and pending microtasks are drained through a
 * MessageChannel round trip before each timer fires. Start and end times
 * are therefore exact, and a run takes milliseconds of real time.
 */
export const virtualClock = `function __virtualClock() {
  var saved = { setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout, now: Date.now };
  var base = 1000000;
  var now = base;
  var timers = new Map();
  var nextId = 1;
  var seq = 0;
  globalThis.setTimeout = function (fn, delay) {
    var rest = Array.prototype.slice.call(arguments, 2);
    var id = nextId++;
    timers.set(id, { due: now + Math.max(0, Number(delay) || 0), seq: seq++, fn: fn, rest: rest });
    return id;
  };
  globalThis.clearTimeout = function (id) {
    timers.delete(id);
  };
  Date.now = function () {
    return now;
  };
  function flush() {
    return new Promise(function (resolve) {
      var channel = new MessageChannel();
      channel.port1.onmessage = function () {
        channel.port1.close();
        channel.port2.close();
        resolve();
      };
      channel.port2.postMessage(null);
    });
  }
  function fireNext() {
    var bestId = null;
    var best = null;
    timers.forEach(function (t, id) {
      if (best === null || t.due < best.due || (t.due === best.due && t.seq < best.seq)) {
        best = t;
        bestId = id;
      }
    });
    timers.delete(bestId);
    now = best.due;
    best.fn.apply(null, best.rest);
  }
  return {
    time: function () {
      return now - base;
    },
    pending: function () {
      return timers.size;
    },
    run: async function (start) {
      var outcome = null;
      Promise.resolve()
        .then(start)
        .then(
          function (value) {
            outcome = { value: value, at: now - base };
          },
          function (err) {
            outcome = { error: err instanceof Error ? err.message : String(err), at: now - base };
            if (err instanceof Error) outcome.errorType = err.constructor.name;
          },
        );
      for (var guard = 0; guard < 100000; guard++) {
        await flush();
        if (outcome || timers.size === 0) break;
        fireNext();
      }
      return outcome || { error: "never settled", at: now - base };
    },
    drain: async function () {
      for (var guard = 0; guard < 100000; guard++) {
        await flush();
        if (timers.size === 0) break;
        fireNext();
      }
    },
    restore: function () {
      globalThis.setTimeout = saved.setTimeout;
      globalThis.clearTimeout = saved.clearTimeout;
      Date.now = saved.now;
    },
  };
}`;
