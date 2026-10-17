# Tyrella JS

<p align="center">
  <b>A lightweight, high-performance DOM wrapper library optimized for modern browsers.</b>
</p>

---

## 🚀 About

Tyrella JS started its journey inspired by and evolved from the clean, lightweight architecture of **Umbrella JS**. Built with ES6+ standards, zero unsafe global buffers, and a strong focus on minimal memory allocation, Tyrella provides a familiar, blazing-fast API for DOM manipulation, traversal, and event handling without the bloat of heavier libraries.

---

## 📦 Installation & Setup

Include `tyrella.js` in your project as a module or global script. It supports CommonJS, global `$` assignment, and modern module environments.

```javascript
// Global usage
const boxes = $('.box');
```

---

## 🛠 Core Features & Highlights

### 1. The Magic of `each()` (No Manual Wrappers)
Unlike other libraries where you have to manually wrap elements inside a loop, Tyrella's `.each()` automatically manages a single-element wrapper instance available directly via `this`:

```javascript
$('.item').each(function(el, index) {
  // `this` is a Tyrella collection containing the current element `el`
  this.css('color', index % 2 === 0 ? 'red' : 'blue');
});
```

### 2. Flexible Search with `find(selector, all = true)`
The `.find()` method lets you search within the current collection. By default, `all = true` matches **all** descendant elements across the collection (like traditional `.find()`). If you pass `false`, it behaves like `querySelector`, returning only the first match per context:

```javascript
// Find all items (default)
const allItems = $('.container').find('.item');

// Find only the first matching item inside each context
const firstItem = $('.container').find('.item', false);
```

### 3. Native Event Handling & `one()` Caveat
Tyrella provides robust event management backed by a `WeakMap` registry to prevent memory leaks. 

When using `.one()`, keep in mind that it relies on native event options. Because there is no internal caching layer for one-time listeners, **you must include `{ once: true }`** if the function should only execute once. A regular `.off()` call will not automatically unbind it if it's handled natively:

```javascript
// Executes only once using native once option
$('.btn').one('click', (e) => {
  console.log('Clicked once!');
}, { once: true });
```

---

## 📖 API Examples (inspired by Cash.js)

### Selection & Collection
```javascript
// Select elements
const $elements = $('.my-class');

// Get native DOM element at index
const rawEl = $elements.get(0);

// Get wrapped Tyrella instance at index
const $single = $elements.eq(1);

// First and last
const $first = $elements.first();
const $last = $elements.last();
```

### Traversal
```javascript
// Find descendants
$('.container').find('.child');

// Get direct children
$('.container').children('.active');

// Get parent element
$('.item').parent();

// Get closest matching ancestor
$('.item').closest('.wrapper');

// Get siblings
$('.item').siblings();
```

### DOM Manipulation
```javascript
// Append / Prepend content
$('.container').append('<p>Hello World</p>');
$('.container').prepend('<span>Start</span>');

// Insert before / after
$('.item').after('<div class="sibling">After</div>');
$('.item').before('<div class="sibling">Before</div>');

// Remove elements (automatically cleans up event registries)
$('.obsolete').remove();

// Empty container contents
$('.container').empty();

// Clone elements
const $cloned = $('.box').clone();
```

### Attributes, Classes & Styles
```javascript
// Attributes
$('.image').attr('alt', 'Description');
const altText = $('.image').attr('alt');

// Classes
$('.box').addClass('active loading');
$('.box').removeClass('loading');
$('.box').toggleClass('visible');
const hasIt = $('.box').hasClass('active');

// CSS Styles
$('.box').css('background-color', '#ff0000');
$('.box').css({
  width: '100px',
  height: '100px'
});
const width = $('.box').css('width');

// HTML & Text
$('.content').html('<span>New HTML</span>');
const text = $('.content').text();
```

### Events
```javascript
// Bind events (supports event delegation)
$('.list').on('click', 'li', function(e) {
  $(this).addClass('selected');
});

// Unbind events
$('.list').off('click', 'li');

// Trigger custom events
$('.box').trigger('custom:action', { foo: 'bar' });
```

---

[Plugins Folder](./plugins)

## 📄 License
MIT
