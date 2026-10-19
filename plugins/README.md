# Tyrella JS Animations Plugin

> High-performance jQuery-like animations using the Web Animations API (WAAPI) with automatic style commitment, memory cleanup, and built-in queuing.

---

## 🚀 Features

* **WAAPI Power:** Runs on the native browser animation engine (compositor thread) for maximum performance and smooth 60+ FPS.
* **Smart Queue System:** Automatically queues consecutive animations per element, just like jQuery (`.animate()`, `.delay()`).
* **Memory Safe:** Uses `WeakMap` under the hood, ensuring zero memory leaks when DOM elements are removed from the page.
* **Style Commitment:** Automatically calls `commitStyles()` and `cancel()` on completion to prevent elements from "snapping back" to their original states.
* **Full Control:** Supports advanced stopping (`.stop(clearQueue, jumpToEnd)`) and instant completion (`.finish()`).

---

## 📦 Installation

Make sure **[Tyrella JS](https://github.com/BlakeBlame/tyrella)** is loaded before including this animation plugin.

---

## 💡 Usage & Examples

### 1. Basic Animation & Chaining

You can chain animations together — they will automatically queue up one after another.

```javascript
$('.box')
  .fadeIn(600)
  .animate({ transform: 'translateX(200px)', opacity: 1 }, 1000, 'easeOutCubic')
  .delay(300)
  .animate({ transform: 'translate(200px, 200px)', rotate: '90deg' }, 800)
  .fadeOut(500);

```

### 2. Passing Options via Object (Native WAAPI Integration)

If you pass parameters as an object in the second argument, **all supported native WAAPI options** (such as `iterations`, `direction`, `easing`, `delay`, etc.) are passed directly to the browser's `el.animate()` method.

```javascript
$('.box').animate({
  transform: 'scale(1.5)',
  backgroundColor: '#ff5722'
}, {
  duration: 1200,
  easing: 'ease-in-out',
  iterations: 3,         // Repeats 3 times
  direction: 'alternate' // Plays forwards then backwards
});

```

### 3. Queue Control (`.stop()` & `.finish()`)

Manage active animations and the queue just like you would in jQuery:

```javascript
// Stop the current animation, but keep executing the rest of the queue
$('.box').stop(false, false);

// Instantly jump the current animation to the end and CLEAR the rest of the queue
$('.box').stop(true, true);

// Instantly finish the current animation and apply final styles for all pending tasks in the queue
$('.box').finish();

```

### 4. `queue: false` — Parallel Animations

With `queue: false` the animation runs immediately, in parallel with the active queue, and is tracked separately:

```javascript
$('.box')
  .animate({ width: '200px' }, 500)
  .animate({ height: '200px' }, 500, { queue: false }); // runs in parallel
```

Unlike jQuery, `.stop()` and `.finish()` also stop these parallel animations. Note that `.stop()`, `.finish()` and `.hide()` invoke the affected animations' `finish` / `cancel` callbacks — an intentional difference from jQuery, which never fires callbacks on `.stop()`.

### 5. Fading & Display Helpers

```javascript
$('.box').fadeIn(300);   // restores previous display, animates opacity 0 → 1
$('.box').fadeOut(300);  // animates opacity 1 → 0, then sets display: none
$('.box').fadeTo(0.5);   // animates to the given opacity, display untouched
$('.box').hide();        // instant: remembers display, then display: none
$('.box').show();        // instant: restores the remembered display
```

`hide()` / `fadeOut()` remember the element's previous `display` value and `show()` / `fadeIn()` restore it. When nothing was remembered, `show()` clears an inline `display: none`.

### 6. Argument Forms

`animate(properties, duration, easing, callback)` accepts:
- `animate(properties)` — defaults: 400 ms, `swing` easing
- `animate(properties, 1000)` / `animate(properties, 'fast')`
- `animate(properties, 1000, 'easeOutCubic')`
- `animate(properties, callback)` / `animate(properties, 1000, callback)`
- `animate(properties, {...})` — object form; all native WAAPI options pass through (`duration`, `easing`, `delay`, `endDelay`, `iterations`, `direction`, `fill`, …) plus Tyrella extras `queue`, `finish`, `cancel`
- `animate('show', …)` / `animate('hide', …)` — named fade keyframes (used internally by `fadeIn` / `fadeOut`)

Duration words: `fast` (200), `slow` (600), `normal` (400). Negative durations clamp to `0`; non-finite or unrecognized values fall back to `400`. Empty keyframe lists and unknown frame names are ignored (no-op). All animations use `fill: 'both'` by default and commit their final styles on completion (`commitStyles()`), so values never "snap back".

---

## ⚙️ Callbacks Note

> **Important:** Since this is a lightweight WAAPI-based plugin rather than a heavy full jQuery library, it only supports native animation events/callbacks: **`finish`**, **`cancel`**.
>
> Inside callbacks, `this` is the animated element. `finish` fires on natural completion and when an animation is jumped to the end (`.stop(..., true)`, `.finish()`); `cancel` fires when an animation is stopped midway (`.stop()`, `.hide()`).

```javascript
$('.box').animate(
  { opacity: 0.5 }, 
  {
    duration: 800,
    finish: function() {
      console.log('Animation completed for:', this);
    },
    cancel: function() {
      console.log('Animation was cancelled');
    }
  }
);

```

---

## 📄 License
MIT
