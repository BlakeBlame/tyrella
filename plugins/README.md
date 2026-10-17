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

If you pass parameters as an object in the second argument, **all supported native WAAPI options** (such as `iterations`, `direction`, `easing`, `delay`, etc.) are automatically filtered and passed directly to the browser's `el.animate()` method.

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

---

## ⚙️ Callbacks Note

> **Important:** Since this is a lightweight WAAPI-based plugin rather than a heavy full jQuery library, it only supports native animation events/callbacks: **`finish`**, **`cancel`**.

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
