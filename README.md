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

## 📌 API Notes & Edge Cases

### Selection
- `$(selector, context)` — searches within a context element or an existing Tyrella collection.
- `$(function () { ... })` — DOM-ready shorthand; the callback runs asynchronously (via `setTimeout`) when the document is already loaded and returns nothing.
- `$('<div>…</div>')` — creates elements from HTML strings, including table/select fragments (`<tr>`, `<td>`, `<option>`, …).
- `$(window)` and `$(document)` are valid collections.

### Collection helpers
`map`, `filter`, `not`, `is`, `unique`, `reverse`, `get(index)`, `eq(index)`, `first()`, `last()`.
- `get()` without arguments returns a plain array of all elements; negative indexes count from the end (`get(-1)` → last element).
- In `map()`, a returned string is pushed as a single item (never split into characters); arrays and array-likes are flattened.

### Events
- Delegated handlers receive `this` = the matched element: `$(el).on('click', '.item', fn)`.
- `off()` with no arguments unbinds **all** handlers registered via `.on()` from the collection; `off(type, selector, handler)` unbinds selectively.
- `remove()` and `empty()` automatically detach registered listeners (including those of children). `.html()` replaces content **without** cleaning up old listeners — call `.empty()` first when you need that.
- `.one()` relies on the native `{ once: true }` option and is **not** kept in the registry: `.off()`, `.remove()` and `.empty()` cannot unbind it.
- `trigger(type, detail)` dispatches a bubbling, cancelable `CustomEvent`; the payload is available as `event.detail`.
- Event names and class names are split by spaces only; jQuery-style namespaced events (`click.ns`) are not supported.

### Attributes, data & styles
- `attr(name, null)` removes the attribute; `attr({...})` sets several at once.
- `data()` reads/writes `dataset`; non-string values are stored via `JSON.stringify`.
- `css()` accepts kebab-case or camelCase names and CSS custom properties (`css('--accent', '#f00')`); `css(prop, null)` removes the property. Values are passed to `style.setProperty()` as-is — numbers are **not** auto-suffixed with `px` (use `'100px'`). The getter reads the first element only.

### DOM manipulation
- `wrap()` returns the **wrapper** collection and `replace()` returns the **new content** collection (not the original one, unlike jQuery).
- `width()` / `height()` return `offsetWidth` / `offsetHeight` of the first element; `size()` returns its `getBoundingClientRect()`.

### Utilities & environment
- `$.each(collection, fn)` (break the loop by returning `false`), `$.toArray(value)`, `$.version`, plus `$.copyInto`, `$.assign`, `$.splitWords`.
- Targets modern browsers and NW.js environments (where both `module` and `window` exist). No polyfills for legacy browsers.

---

[Plugins Folder](./plugins)

## 📄 License
MIT
