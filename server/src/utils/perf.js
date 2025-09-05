'use strict';
function start() { return process.hrtime.bigint(); }
function end(t0) {
  const diffNs = Number(process.hrtime.bigint() - t0);
  return Math.round(diffNs / 1e6); // ms
}
module.exports = { start, end };
