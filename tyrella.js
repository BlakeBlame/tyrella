(function (root, factory) {
  const api = factory(root);
  // Electron / NW.js expose BOTH `module` and `window`, so CommonJS export and the
  // global `$` must not be mutually exclusive (classic UMD would skip the global there).
  if (typeof module === 'object' && module !== null && module.exports) module.exports = api;
  if (root && root.document) root.$ = api;
})(typeof window !== 'undefined' ? window : globalThis, function (win) {
'use strict';
const doc = win.document, createFragment = doc.createDocumentFragment.bind(doc), createText = doc.createTextNode.bind(doc);

const isEngine = (v) => v instanceof Tyrella;
const isString = (v) => typeof v === 'string';
const isNumber = (v) => typeof v === 'number';
const isFunction = (v) => typeof v === 'function';
const isObject = (v) => v && typeof v === 'object';
const isUndefined = (v) => v === undefined;
const isElement = (v) => v && v.nodeType === 1;
const isDocument = (v) => v && v.nodeType === 9;
const isFragment = (v) => v && v.nodeType === 11;

const { isArray, prototype: ArrayPrototype } = win.Array;
const { slice, includes } = ArrayPrototype;
const { freeze, keys, create, assign } = win.Object;
const { stringify } = win.JSON;
const { fromCharCode } = win.String;

const camelCache = create(null);
const toCamelCase = (property) => {
  let result = camelCache[property] || '';
  if (result) return result;
  let upper = false, length = property.length;
  for (let i = 0; i < length; i++) {
    const code = property.charCodeAt(i);
    if (code === 45) {
      upper = true;
    } else if (upper) {
      result += fromCharCode(code >= 97 && code <= 122 ? code - 32 : code);
      upper = false;
    } else {
      result += property[i];
    }
  }
  camelCache[property] = result;
  return result;
};
const template = doc.createElement('template');

const WRAP_MAP = freeze({
  tr: [3, '<table><tbody>', '</tbody></table>'],
  tbody: [2, '<table>', '</table>'],
  thead: [2, '<table>', '</table>'],
  tfoot: [2, '<table>', '</table>'],
  colgroup: [2, '<table>', '</table>'],
  caption: [2, '<table>', '</table>'],
  col: [3, '<table><colgroup>', '</colgroup></table>'],
  td: [4, '<table><tbody><tr>', '</tr></tbody></table>'],
  th: [4, '<table><tbody><tr>', '</tr></tbody></table>'],
  option: [2, '<select multiple>', '</select>'],
  optgroup: [2, '<select multiple>', '</select>'],
  legend: [2, '<fieldset>', '</fieldset>'],
  area: [2, '<map>', '</map>'],
});
const rTag = /^\s*<([a-z][a-z0-9-]*)/i;

const parseHTML = (html) => {
  const tag = rTag.exec(html)?.[1].toLowerCase();
  const wrap = tag && WRAP_MAP[tag];

  if (!wrap) {
    template.innerHTML = html;
    return template.content.childNodes;
  }

  const [depth, before, after] = wrap;
  template.innerHTML = before + html + after;
  let container = template.content;
  for (let i = 0; i < depth; i++) container = container.firstChild;
  return container.childNodes;
};
const emptyArray = freeze([]);
const querySelect = (selector, context = doc, all = true) => {
  if (!selector || (!isFragment(context) && !isDocument(context) && !isElement(context))) return emptyArray;
  if (all) {
    return context.querySelectorAll(selector);
  }
  const el = context.querySelector(selector);
  return el ? [el] : emptyArray;
};

const registry = new WeakMap(); // el -> Map(type -> Array<{callback, orig_callback, selector}>)
const getRegistry = (el, createMissing = false) => {
  let store = registry.get(el);
  if (!store && createMissing) {
    store = new Map();
    registry.set(el, store);
  }
  return store;
};
const addRegistry = (node, type, entry) => {
  const store = getRegistry(node, true);
  let list = store.get(type);
  if (!list) {
    list = [];
    store.set(type, list);
  }
  list.push(entry);
};
const clearRegistry = (el) => {
  if (!isElement(el)) return;
  const detach = (node) => {
    const store = registry.get(node);
    if (!store) return;
    for (const [type, list] of store) {
      for (let i = 0; i < list.length; i++) node.removeEventListener(type, list[i].listener);
    }
    registry.delete(node);
  };
  detach(el);
  const all = el.querySelectorAll('*');
  for (let i = 0; i < all.length; i++) detach(all[i]);
};
const splitWords = (str) => {
  if (!isString(str) || str.length === 0) return emptyArray;
  let i = 0, count = 0;
  const len = str.length, result = [];
  while (i < len) {
    while (i < len && str.charCodeAt(i) === 32) i++;
    if (i === len) break;
    const start = i;
    while (i < len && str.charCodeAt(i) !== 32) i++;
    result.push(str.slice(start, i));
  }
  return result;
};
const copyInto = (target, source) => {
  if (!source) return;
  if (isNumber(source.length)) {
    const len = source.length >>> 0;
    target.length = len;
    for (let i = 0; i < len; i++) target[i] = source[i];
    return;
  }
  if (source[Symbol.iterator]) {
    let i = 0;
    for (const item of source) target[i++] = item;
    target.length = i;
    return;
  }
  target[0] = source;
  target.length = 1;
};
const matchesSelector = (node, selector, index) => {
  if (!node) return false;
  if (isFunction(selector)) return !!selector(node, index);
  if (isElement(selector)) return node === selector;
  if (isEngine(selector)) return selector.includes(node);
  return (isElement(node) && node.matches(selector));
};
const isVar = (prop) => prop.startsWith('--');
const delegateFn = (selector, handler) => function (e) {
  let target = e.target;
  if (target && !isElement(target)) {
    target = target.parentElement;
  }
  const matched = target?.closest(selector);
  if (matched && matched !== this && this.contains(matched)) {
    handler.call(matched, e);
  }
};
const toFragment = (nodes, clone = false) => {
  const len = nodes.length;
  if (!len) return null;
  if (len === 1) {
    return clone ? nodes[0].cloneNode(true) : nodes[0];
  }
  const fragment = createFragment();
  for (let i = 0; i < len; i++) {
    fragment.appendChild(clone ? nodes[i].cloneNode(true) : nodes[i]);
  }
  return fragment;
};
const SMOOTH = { behavior: 'smooth' }, optSample = { once: true };

class Tyrella {
  constructor(elements) {
    this.length = 0;
    copyInto(this, elements);
  }
  push(el) {
    this[this.length++] = el;
    return this;
  }
  pushUnique(el) {
    if (el != null && !this.includes(el)) this[this.length++] = el;
    return this;
  }
  [Symbol.iterator]() {
    return ArrayPrototype[Symbol.iterator].call(this);
  }
  each(callback) {
    const len = this.length, fakeEngine = $();
    fakeEngine.length = 1;
    for (let i = 0; i < len; i++) {
      const target = this[i];
      fakeEngine[0] = target;
      if (callback.call(fakeEngine, target, i) === false) break;
    }
    fakeEngine[0] = null;
    return this;
  }
  map(callback) {
    if (!isFunction(callback)) return this;
    const result = $(), len = this.length;
    for (let i = 0; i < len; i++) {
      const res = callback(this[i], i);
      if (res != null) {
        if (isNumber(res.length)) {
          for (let j = 0; j < res.length; j++) result.pushUnique(res[j]);
        } else result.pushUnique(res);
      }
    }
    return result;
  }
  reverse() {
    for (let i = 0, j = this.length - 1; i < j; i++, j--) {
      const temp = this[i];
      this[i] = this[j];
      this[j] = temp;
    }
    return this;
  }
  filter(sel) {
    if (!sel) return this;
    const result = $(), len = this.length;
    for (let i = 0; i < len; i++) {
      if (matchesSelector(this[i], sel, i)) result.push(this[i]);
    }
    return result;
  }
  not(sel) {
    if (!sel) return this;
    const result = $(), len = this.length;
    for (let i = 0; i < len; i++) {
      if (!matchesSelector(this[i], sel, i)) result.push(this[i]);
    }
    return result;
  }
  is(sel) {
    const len = this.length;
    for (let i = 0; i < len; i++) {
      if (matchesSelector(this[i], sel, i)) return true;
    }
    return false;
  }
  unique() {
    if (this.length <= 1) return $(this.get());
    return new Tyrella(new Set(this));
  }
  get(index) {
    if (isUndefined(index)) return slice.call(this);
    const numeric = Number(index);
    const normalized = numeric < 0 ? numeric + this.length : numeric;
    return this[normalized];
  }
  eq(index) {
    return $(this.get(index));
  }
  first() {
    return this.eq(0);
  }
  last() {
    return this.eq(-1);
  }
  find(sel, all = true) {
    const result = $();
    if (!sel) return result;
    const len = this.length;
    for (let i = 0; i < len; i++) {
      const query = querySelect(sel, this[i], all);
      const qLen = query.length;
      for (let j = 0; j < qLen; j++) result.pushUnique(query[j]);
    }
    return result;
  }
  children(sel) {
    const result = $(), len = this.length;
    for (let i = 0; i < len; i++) {
      const children = this[i].children;
      for (let j = 0, l = children.length; j < l; j++) {
        const child = children[j];
        if ((!sel || matchesSelector(child, sel, i))) result.push(child);
      }
    }
    return result;
  }
  parent(sel) {
    const result = $(), len = this.length;
    for (let i = 0; i < len; i++) {
      const parent = this[i].parentElement;
      if (parent && (!sel || matchesSelector(parent, sel, i))) result.pushUnique(parent);
    }
    return result;
  }
  siblings(matcher) {
    const result = $(), len = this.length;
    for (let i = 0; i < len; i++) {
      const node = this[i], parent = node.parentElement;
      if (!parent) continue;
      const children = parent.children;
      for (let j = 0, childLen = children.length; j < childLen; j++) {
        const child = children[j];
        if (child !== node && (!matcher || matchesSelector(child, matcher, j))) {
          result.pushUnique(child);
        }
      }
    }
    return result;
  }
  closest(matcher) {
    const result = $(), len = this.length;
    for (let i = 0; i < len; i++) {
      let node = this[i];
      while (node && node !== doc) {
        if (matchesSelector(node, matcher, i)) {
          result.pushUnique(node);
          break;
        }
        node = node.parentElement;
      }
    }
    return result;
  }
  isInPage(node) {
    const body = doc.body;
    return node !== body && body.contains(node);
  }
  after(content) {
    const nodes = $(content), len = this.length;
    let originalUsed = false;
    for (let i = 0; i < len; i++) {
      const target = this[i];
      if (!isElement(target)) continue;
      const insertion = toFragment(nodes, originalUsed);
      if (!insertion) continue;
      target.after(insertion);
      originalUsed = true;
    }
    return this;
  }
  before(content) {
    const nodes = $(content), len = this.length;
    let originalUsed = false;
    for (let i = 0; i < len; i++) {
      const target = this[i];
      if (!isElement(target)) continue;
      const insertion = toFragment(nodes, originalUsed);
      if (!insertion) continue;
      target.before(insertion);
      originalUsed = true;
    }
    return this;
  }
  prepend(content) {
    const nodes = $(content), len = this.length;
    let originalUsed = false;
    for (let i = 0; i < len; i++) {
      const target = this[i];
      if (!isElement(target)) continue;
      const insertion = toFragment(nodes, originalUsed);
      if (!insertion) continue;
      target.prepend(insertion);
      originalUsed = true;
    }
    return this;
  }
  append(content) {
    const nodes = $(content), len = this.length;
    let originalUsed = false;
    for (let i = 0; i < len; i++) {
      const target = this[i];
      if (!isElement(target)) continue;
      const insertion = toFragment(nodes, originalUsed);
      if (!insertion) continue;
      target.appendChild(insertion);
      originalUsed = true;
    }
    return this;
  }
  appendTo(content) {
    const targets = $(content), len = targets.length;
    let originalUsed = false;
    for (let i = 0; i < len; i++) {
      const insertion = toFragment(this, originalUsed);
      if (!insertion) continue;
      targets[i].appendChild(insertion);
      originalUsed = true;
    }
    return this;
  }
  replace(content) {
    const nodes = $(content), len = this.length;
    let originalUsed = false;
    for (let i = 0; i < len; i++) {
      const target = this[i];
      if (!isElement(target) && !isDocument(target)) continue;
      const insertion = toFragment(nodes, originalUsed);
      if (!insertion) continue;
      target.replaceWith(insertion);
      originalUsed = true;
    }
    return nodes;
  }
  wrap(structure) {
    const wrap = $(structure);
    let base = null;
    for (let i = 0; i < wrap.length; i++) {
      if (isElement(wrap[i])) {
        base = wrap[i];
        break;
      }
    }
    if (!base) return wrap;

    const len = this.length, templ = len > 1 ? base.cloneNode(true) : null;
    let originalUsed = false;

    for (let i = 0; i < len; i++) {
      const target = this[i];
      if (!isElement(target)) continue;
      if (target === base || base.contains(target) || target.contains(base)) continue;

      const useOriginal = !originalUsed;
      const root = useOriginal ? base : templ.cloneNode(true);
      if (useOriginal) originalUsed = true;

      let innermost = root;

      while (innermost.firstElementChild) {
        innermost = innermost.firstElementChild;
      }
      const parent = target.parentNode;
      if (parent) {
        parent.insertBefore(root, target);
      }
      innermost.appendChild(target);
    }
    return wrap;
  }
  clone() {
    const result = $(), len = this.length;
    for (let i = 0; i < len; i++) result.push(this[i].cloneNode(true));
    return result;
  }
  remove() {
    const len = this.length;
    for (let i = 0; i < len; i++) {
      clearRegistry(this[i]);
      this[i].remove();
    }
    return this;
  }
  empty() {
    const len = this.length;
    for (let i = 0; i < len; i++) {
      const el = this[i];
      //const children = el.children;
      //for (let j = 0; j < children.length; j++) clearRegistry(children[j]);
      el.replaceChildren();
    }
    return this;
  }
  attr(name, value) {
    if (isObject(name)) {
      for (const k in name) this.attr(k, name[k]);
      return this;
    }
    const len = this.length;
    if (isUndefined(value)) return len ? this[0].getAttribute(name) : null;
    for (let i = 0; i < len; i++) {
      if (value == null) this[i].removeAttribute(name);
      else this[i].setAttribute(name, value);
    }
    return this;
  }
  data(name, value) {
    const len = this.length;
    if (isUndefined(name)) return len ? assign({}, this[0].dataset) : null;
    if (isObject(name)) {
      for (const k in name) this.data(k, name[k]);
      return this;
    }
    if (isUndefined(value)) return len ? this[0].dataset[name] : null;
    const stored = isString(value) ? value : stringify(value);
    for (let i = 0; i < len; i++) this[i].dataset[name] = stored;
    return this;
  }
  css(prop, value) {
    if (isObject(prop)) {
      for (const k in prop) this.css(k, prop[k]);
      return this;
    }
    const len = this.length;
    if (isUndefined(value)) {
      if (!len) return undefined;
      const el = this[0];
      if (isVar(prop)) return getComputedStyle(el).getPropertyValue(prop);
      const camel = toCamelCase(prop);
      return getComputedStyle(el)[camel] || el.style[camel];
    }
    const is_var = isVar(prop);
    const camel = is_var ? prop : toCamelCase(prop);
    for (let i = 0; i < len; i++) {
      const { nodeType, style } = this[i];
      if (nodeType !== 1) continue;
      if (is_var) style.setProperty(prop, value);
      else style[camel] = value;
    }
    return this;
  }
  prop(name, value) {
    const len = this.length;
    if (isUndefined(value)) return len ? this[0][name] : undefined;
    for (let i = 0; i < len; i++) this[i][name] = value;
    return this;
  }
  addClass(names) {
    const args = splitWords(names), argLen = args.length, len = this.length;
    for (let i = 0; i < len; i++) {
      const list = this[i].classList;
      for (let j = 0; j < argLen; j++) list.add(args[j]);
    }
    return this;
  }
  removeClass(names) {
    if (!names) return this.attr('class', '');
    const args = splitWords(names), argLen = args.length, len = this.length;
    for (let i = 0; i < len; i++) {
      const list = this[i].classList;
      for (let j = 0; j < argLen; j++) list.remove(args[j]);
    }
    return this;
  }
  hasClass(name) {
    const len = this.length;
    for (let i = 0; i < len; i++) {
      if (this[i].classList.contains(name)) return true;
    }
    return false;
  }
  toggleClass(names, force) {
    const args = splitWords(names), argLen = args.length, len = this.length;
    for (let i = 0; i < len; i++) {
      const list = this[i].classList;
      for (let j = 0; j < argLen; j++) list.toggle(args[j], force);
    }
    return this;
  }
  html(content) {
    const len = this.length;
    if (isUndefined(content)) return len > 0 ? this[0].innerHTML || "" : "";
    for (let i = 0; i < len; i++) this[i].innerHTML = content;
    return this;
  }
  text(content) {
    const len = this.length;
    if (isUndefined(content)) {
      let s = '';
      for (let i = 0; i < len; i++) s += this[i].textContent || '';
      return s;
    }
    for (let i = 0; i < len; i++) this[i].textContent = content;
    return this;
  }
  on(events, delegate, maybeHandler) {
    let selector = null, handler = delegate;
    if (isString(delegate)) {
      selector = delegate;
      handler = maybeHandler;
    }
    const args = splitWords(events), argLen = args.length, len = this.length;
    const listener = selector ? delegateFn(selector, handler) : handler;
    for (let e = 0; e < argLen; e++) {
      const type = args[e];
      for (let i = 0; i < len; i++) {
        this[i].addEventListener(type, listener);
        addRegistry(this[i], type, { listener, handler, selector });
      }
    }
    return this;
  }
  one(events, handler, options = optSample) {
    const args = splitWords(events), argLen = args.length, len = this.length;
    for (let e = 0; e < argLen; e++) {
      for (let i = 0; i < len; i++) this[i].addEventListener(args[e], handler, options);
    }
    return this;
  }
  off(events, delegate, maybeHandler) {
    const hasSelector = isString(delegate);
    const selector = hasSelector ? delegate : null;
    const handler = hasSelector ? maybeHandler : delegate;
    const removeAll = delegate == null;
    const args = splitWords(events), argLen = args.length, len = this.length;
    for (let e = 0; e < argLen; e++) {
      const type = args[e];
      for (let i = 0; i < len; i++) {
        const node = this[i];
        const store = getRegistry(node);
        if (!store) continue;
        const list = store.get(type);
        if (!list) continue;
        for (let j = list.length - 1; j >= 0; j--) {
          const entry = list[j];
          if (removeAll || ((selector === null || entry.selector === selector) && (handler == null || entry.handler === handler))) {
            node.removeEventListener(type, entry.listener);
            list.splice(j, 1);
          }
        }
      }
    }
    return this;
  }
  trigger(events, detail) {
    const args = splitWords(events), argLen = args.length, len = this.length;
    for (let e = 0; e < argLen; e++) {
      const type = args[e];
      for (let i = 0; i < len; i++) {
        this[i].dispatchEvent(new CustomEvent(type, { bubbles: true, cancelable: true, detail }));
      }
    }
    return this;
  }
  scroll() {
    const el = this[0];
    if (el) el.scrollIntoView(SMOOTH);
    return this;
  }
  size() {
    return this.length ? this[0].getBoundingClientRect() : null;
  }
  width() {
    return this.length ? this[0].offsetWidth : 0;
  }
  height() {
    return this.length ? this[0].offsetHeight : 0;
  }
}
const $ = (selector, context) => {
  if (!selector) return new Tyrella();
  if (isFunction(selector)) {
    if (doc.readyState !== 'loading') win.setTimeout(selector, 1);
    else doc.addEventListener('DOMContentLoaded', selector, { once: true });
    return;
  }
  if (isString(selector)) {
    if (!(selector = selector.trimStart())) return new Tyrella();
    if (selector.startsWith('<')) return new Tyrella(parseHTML(selector));
    const ctx = isEngine(context) ? context[0] : context;
    return new Tyrella(querySelect(selector, ctx || doc));
  }
  return new Tyrella(selector);
};
const fn = $.fn = $.prototype = Tyrella.prototype;
fn.toArray = slice;
fn.includes = includes;
$.toArray = function(value) {
  if (!value || isString(value) || isFunction(value)) return [];
  if (!isNumber(value.length)) return [value];
  return value.length === 0 ? [] : slice.call(value);
};
$.each = function(collection, callback) {
  let len = collection.length;
  if (isNumber(len)) {
    for (let i = 0; i < len; i++) {
      if (callback(collection[i], i) === false) break;
    }
  } else {
    const _keys = keys(collection);
    len = _keys.length;
    for (let i = 0; i < len; i++) {
      const key = _keys[i];
      if (callback(collection[key], key) === false) break;
    }
  }
  return collection;
};
/*
$.generate = function(html) {
  if (!html.startsWith("<")) return createText(html);
  return parseHTML(html);
};
$.select = function(selector, context) {
  if (!(selector = selector.trimStart())) return null;
  if (selector.startsWith('<')) return parseHTML(selector);
  const ctx = isEngine(context) ? context[0] : context;
  return querySelect(selector, ctx || doc);
};
*/
return $;
});
