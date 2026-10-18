/**
 * Tyrella JS Animations Plugin v1.1 (WAAPI-based)
 * High-performance jQuery-like animations using the Web Animations API (WAAPI)
 * with automatic style commitment and memory cleanup upon completion.
 */
(function (win) {
'use strict';
// Ensure Tyrella is available
const Tyrella = win.Tyrella;
if (!Tyrella) {
  console.error('Tyrella JS must be loaded before the animations plugin.');
  return;
}

const fn = Tyrella.prototype;
const isString = (v) => typeof v === 'string';
const isNumber = (v) => typeof v === 'number';
const isFunction = (v) => typeof v === 'function';
const isObject = (v) => v && typeof v === 'object';
const isElement = (v) => v && v.nodeType === 1;

const { isArray } = win.Array;
const { create, assign, keys, freeze } = win.Object;
const { isFinite } = win.Number;

const delProto = (obj) => assign(create(null), obj);
// Helper to parse duration and easing / callbacks
function ArgsParser(duration, easing, callback) {
  this.fill = 'both'; this.duration = 400; this.easing = 'swing'; this.queue = true;
  if (isObject(duration)) {
    assign(this, duration);
  } else {
    if (isFunction(duration)) {
      this.finish = duration;
    } else {
      this.duration = duration;
      if (isFunction(easing)) {
        this.finish = easing;
      } else {
        this.easing = easing;
      }
      if (isFunction(callback)) {
        this.finish = callback;
      }
    }
  }
  this.duration = resolveDuration(this.duration);
  this.easing = resolveEasing(this.easing);
}
ArgsParser.prototype = null;
const SPEED = freeze(delProto({ fast: 200, slow: 600, normal: 400 }));
const toFiniteNumber = (value, fallback) => {
  if (isNumber(value) && isFinite(value)) {
    return value;
  }
  if (isString(value)) {
    const number = win.Number(value);
    if (isFinite(number)) return number;
  }
  return fallback;
};
const resolveDuration = (d) => {
  if (isNumber(d) && isFinite(d)) return d < 0 ? 0 : d;
  if (SPEED[d]) return SPEED[d];
  return toFiniteNumber(d, SPEED.normal);
};
const easingMap = freeze(delProto({
  swing: 'cubic-bezier(0.445, 0.05, 0.55, 0.95)',
  easeInQuad: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
  easeOutQuad: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  easeInOutQuad: 'cubic-bezier(0.455, 0.03, 0.515, 0.95)',
  easeInCubic: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
  easeOutCubic: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
  easeInOutCubic: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
  //Add new here
}));
const resolveEasing = (e) => {
  if (!e) return easingMap.swing;
  return easingMap[e] || e; // 'linear', 'ease-in-out', 'cubic-bezier(...)', 'steps(...)'
};
const fx = new WeakMap();
const getFxState = (el) => {
  let s = fx.get(el);
  if (!s) fx.set(el, s = new QueueHandler());
  return s;
};
const createKeyFrame = (properties) => {
  if (isArray(properties)) return properties;
  return [properties];
};
class QueueHandler {
  queue = [];
  active = null;
  enqueue(task) {
    this.queue.push(task);
    this.dequeue();
  }
  dequeue() {
    if (this.active || !this.queue.length) return;
    const task = this.queue.shift();
    const active = { task, anim: null, timer: 0 };
    this.active = active;

    const done = () => {
      if (this.active !== active) return;
      this.active = null;
      this.dequeue();
    };

    if (task.type === 'delay') {
      const ms = Math.max(0, toFiniteNumber(task.ms, 1));
      active.timer = win.setTimeout(done, ms);
      return;
    }
    if (task.type === 'anim') {
      active.anim = runAnimation(task.el, createKeyFrame(task.properties), task.opts, done);
    }
  }
  stop(clearQueue = false, jumpToEnd = false) {
    if (clearQueue) {
      this.queue.length = 0;
    }
    const active = this.active;
    if (!active) return;
    this.active = null;

    if (active.timer) {
      win.clearTimeout(active.timer);
      active.timer = 0;
    }

    if (active.anim) {
      if (jumpToEnd) {
        active.anim.finish();
      } else {
        active.anim.commitStyles();
        active.anim.cancel();
      }
    }

    if (!clearQueue) this.dequeue();
  }
  finish() {
    const active = this.active;
    if (!active) return;
    this.active = null;
    const pending = this.queue.splice(0);

    if (active.timer) {
      win.clearTimeout(active.timer);
      active.timer = 0;
    }

    if (active.anim) {
      active.anim.finish();
    }

    for (let i = 0; i < pending.length; i++) {
      const task = pending[i];
      if (task.type !== 'anim') continue;
      applyStyles(task.el.style, createKeyFrame(task.properties));
      if (frames === fadeOutFrame) hideElement(task.el);
      if (isFunction(task.opts.finish)) task.opts.finish.call(task.el);
    }
    return this;
  }

  clearQueue() {
    this.queue.length = 0;
    return this;
  }
}
const applyStyles = (style, keyframes) => {
  if (!keyframes.length) return;
  const finalFrame = keyframes[keyframes.length - 1];
  for (const prop in finalFrame) {
    if (prop.startsWith("-")) style.setProperty(prop, finalFrame[prop]);
    else style[prop] = finalFrame[prop];
  }
};
const runAnimation = (el, frames, opts, onComplete = null) => {
  const anim = el.animate(frames, opts);

  let done = false;
  anim.onfinish = anim.oncancel = (e) => {
    if (done) return;
    done = true;
    const type = e.type;
    if (type === 'finish') {
      anim.commitStyles();
      anim.cancel();
      // Bad sample
      if (frames === fadeOutFrame) hideElement(el);
    }
    const callback = opts[type];
    if (isFunction(callback)) callback.call(el, e);
    if (onComplete) onComplete();
  };

  return anim;
};
// Core animate method using WAAPI
fn.animate = function (properties, duration = 400, easing = 'swing', callback = null) {
  const len = this.length;
  if (!len || !properties || (isArray(properties) && !properties.length)) return this;
  const opts = new ArgsParser(duration, easing, callback);
  const useQueue = opts.queue !== false;
  for (let i = 0; i < len; i++) {
    const el = this[i];
    if (!isElement(el)) continue;
    if (useQueue) getFxState(el).enqueue({ type: "anim", el, properties, opts });
    else runAnimation(el, createKeyFrame(properties), opts);
  }
  return this;
};
fn.stop = function (clearQueue = false, jumpToEnd = false) {
  const len = this.length;
  for (let i = 0; i < len; i++) {
    const s = fx.get(this[i]);
    if (!s) continue;
    s.stop(clearQueue, jumpToEnd);
  }
  return this;
};
fn.finish = function () {
  const len = this.length;
  for (let i = 0; i < len; i++) {
    const s = fx.get(this[i]);
    if (!s) continue;
    s.finish();
  }
  return this;
};
fn.delay = function(ms = 1) {
  const len = this.length;
  for (let i = 0; i < len; i++) {
    const el = this[i];
    if (!isElement(el)) continue;
    getFxState(el).enqueue({ type: "delay", ms });
  }
  return this;
};
const displayCache = new WeakMap();
const hideElement = (el) => {
  if (el.style.display === 'none') return;
  let d = el.style.display;
  if (!d) d = win.getComputedStyle(el).display;
  if (d && d !== 'none') displayCache.set(el, d);
  el.style.display = 'none';
};
fn.hide = function () {
  const len = this.length;
  for (let i = 0; i < len; i++) {
    const el = this[i];
    if (!isElement(el)) continue;
    hideElement(el);
    const s = fx.get(el);
    if (s) s.stop(true, false);
  }
  return this;
};
fn.show = function () {
  const len = this.length;
  for (let i = 0; i < len; i++) {
    const el = this[i];
    if (!isElement(el)) continue;
    const cached = displayCache.get(el);
    if (cached) {
      el.style.display = cached;
    } else if (el.style.display === 'none') {
      el.style.display = '';
    }
  }
  return this;
};
const fadeInFrame = [{ opacity: 0 }, { opacity: 1 }], fadeOutFrame = [{ opacity: 1 }, { opacity: 0 }];
fn.fadeIn = function (duration = 400, easing = 'swing', callback = null) {
  return this.show().animate(fadeInFrame, duration, easing, callback);
};
fn.fadeOut = function (duration = 400, easing = 'swing', callback = null) {
  return this.animate(fadeOutFrame, duration, easing, callback);
};
fn.fadeTo = function (opacity = 1, duration = 400, easing = 'swing', callback = null) {
  return this.animate([{ opacity }], duration, easing, callback);
};
})(typeof window !== 'undefined' ? window : globalThis);
