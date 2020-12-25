
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var routify_app = (function () {
    'use strict';

    /**
     * Hot module replacement for Svelte in the Wild
     *
     * @export
     * @param {object} Component Svelte component
     * @param {object} [options={ target: document.body }] Options for the Svelte component
     * @param {string} [id='hmr'] ID for the component container
     * @param {string} [eventName='app-loaded'] Name of the event that triggers replacement of previous component
     * @returns
     */
    function HMR(Component, options = { target: document.body }, id = 'hmr', eventName = 'app-loaded') {
        const oldContainer = document.getElementById(id);

        // Create the new (temporarily hidden) component container
        const appContainer = document.createElement("div");
        if (oldContainer) appContainer.style.visibility = 'hidden';
        else appContainer.setAttribute('id', id); //ssr doesn't get an event, so we set the id now

        // Attach it to the target element
        options.target.appendChild(appContainer);

        // Wait for the app to load before replacing the component
        addEventListener(eventName, replaceComponent);

        function replaceComponent() {
            if (oldContainer) oldContainer.remove();
            // Show our component and take over the ID of the old container
            appContainer.style.visibility = 'initial';
            // delete (appContainer.style.visibility)
            appContainer.setAttribute('id', id);
        }

        return new Component({
            ...options,
            target: appContainer
        });
    }

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    const MATCH_PARAM = RegExp(/\:([^/()]+)/g);

    function handleScroll (element) {
      if (navigator.userAgent.includes('jsdom')) return false
      scrollAncestorsToTop(element);
      handleHash();
    }

    function handleHash () {
      if (navigator.userAgent.includes('jsdom')) return false
      const { hash } = window.location;
      if (hash) {
        const validElementIdRegex = /^[A-Za-z]+[\w\-\:\.]*$/;
        if (validElementIdRegex.test(hash.substring(1))) {
          const el = document.querySelector(hash);
          if (el) el.scrollIntoView();
        }
      }
    }

    function scrollAncestorsToTop (element) {
      if (
        element &&
        element.scrollTo &&
        element.dataset.routify !== 'scroll-lock' &&
        element.dataset['routify-scroll'] !== 'lock'
      ) {
        element.style['scroll-behavior'] = 'auto';
        element.scrollTo({ top: 0, behavior: 'auto' });
        element.style['scroll-behavior'] = '';
        scrollAncestorsToTop(element.parentElement);
      }
    }

    const pathToRegex = (str, recursive) => {
      const suffix = recursive ? '' : '/?$'; //fallbacks should match recursively
      str = str.replace(/\/_fallback?$/, '(/|$)');
      str = str.replace(/\/index$/, '(/index)?'); //index files should be matched even if not present in url
      str = str.replace(MATCH_PARAM, '([^/]+)') + suffix;
      return str
    };

    const pathToParamKeys = string => {
      const paramsKeys = [];
      let matches;
      while ((matches = MATCH_PARAM.exec(string))) paramsKeys.push(matches[1]);
      return paramsKeys
    };

    const pathToRank = ({ path }) => {
      return path
        .split('/')
        .filter(Boolean)
        .map(str => (str === '_fallback' ? 'A' : str.startsWith(':') ? 'B' : 'C'))
        .join('')
    };

    let warningSuppressed = false;

    /* eslint no-console: 0 */
    function suppressWarnings () {
      if (warningSuppressed) return
      const consoleWarn = console.warn;
      console.warn = function (msg, ...msgs) {
        const ignores = [
          "was created with unknown prop 'scoped'",
          "was created with unknown prop 'scopedSync'",
        ];
        if (!ignores.find(iMsg => msg.includes(iMsg)))
          return consoleWarn(msg, ...msgs)
      };
      warningSuppressed = true;
    }

    function currentLocation () {
      const pathMatch = window.location.search.match(/__routify_path=([^&]+)/);
      const prefetchMatch = window.location.search.match(/__routify_prefetch=\d+/);
      window.routify = window.routify || {};
      window.routify.prefetched = prefetchMatch ? true : false;
      const path = pathMatch && pathMatch[1].replace(/[#?].+/, ''); // strip any thing after ? and #
      return path || window.location.pathname
    }

    window.routify = window.routify || {};

    /** @type {import('svelte/store').Writable<RouteNode>} */
    const route = writable(null); // the actual route being rendered

    /** @type {import('svelte/store').Writable<RouteNode[]>} */
    const routes = writable([]); // all routes
    routes.subscribe(routes => (window.routify.routes = routes));

    let rootContext = writable({ component: { params: {} } });

    /** @type {import('svelte/store').Writable<RouteNode>} */
    const urlRoute = writable(null);  // the route matching the url

    /** @type {import('svelte/store').Writable<String>} */
    const basepath = (() => {
        const { set, subscribe } = writable("");

        return {
            subscribe,
            set(value) {
                if (value.match(/^[/(]/))
                    set(value);
                else console.warn('Basepaths must start with / or (');
            },
            update() { console.warn('Use assignment or set to update basepaths.'); }
        }
    })();

    const location$1 = derived( // the part of the url matching the basepath
        [basepath, urlRoute],
        ([$basepath, $route]) => {
            const [, base, path] = currentLocation().match(`^(${$basepath})(${$route.regex})`) || [];
            return { base, path }
        }
    );

    const prefetchPath = writable("");

    function onAppLoaded({ path, metatags }) {
        metatags.update();
        const prefetchMatch = window.location.search.match(/__routify_prefetch=(\d+)/);
        const prefetchId = prefetchMatch && prefetchMatch[1];

        dispatchEvent(new CustomEvent('app-loaded'));
        parent.postMessage({
            msg: 'app-loaded',
            prefetched: window.routify.prefetched,
            path,
            prefetchId
        }, "*");
        window['routify'].appLoaded = true;
    }

    var defaultConfig = {
        queryHandler: {
            parse: search => fromEntries(new URLSearchParams(search)),
            stringify: params => '?' + (new URLSearchParams(params)).toString()
        }
    };


    function fromEntries(iterable) {
        return [...iterable].reduce((obj, [key, val]) => {
            obj[key] = val;
            return obj
        }, {})
    }

    /**
     * @param {string} url 
     * @return {ClientNode}
     */
    function urlToRoute(url) {
        /** @type {RouteNode[]} */
        const routes$1 = get_store_value(routes);
        const basepath$1 = get_store_value(basepath);
        const route = routes$1.find(route => url.match(`^${basepath$1}${route.regex}`));
        if (!route)
            throw new Error(
                `Route could not be found for "${url}".`
            )

        const [, base] = url.match(`^(${basepath$1})${route.regex}`);
        const path = url.slice(base.length);

        if (defaultConfig.queryHandler)
            route.params = defaultConfig.queryHandler.parse(window.location.search);

        if (route.paramKeys) {
            const layouts = layoutByPos(route.layouts);
            const fragments = path.split('/').filter(Boolean);
            const routeProps = getRouteProps(route.path);

            routeProps.forEach((prop, i) => {
                if (prop) {
                    route.params[prop] = fragments[i];
                    if (layouts[i]) layouts[i].param = { [prop]: fragments[i] };
                    else route.param = { [prop]: fragments[i] };
                }
            });
        }

        route.leftover = url.replace(new RegExp(base + route.regex), '');

        return route
    }


    /**
     * @param {array} layouts
     */
    function layoutByPos(layouts) {
        const arr = [];
        layouts.forEach(layout => {
            arr[layout.path.split('/').filter(Boolean).length - 1] = layout;
        });
        return arr
    }


    /**
     * @param {string} url
     */
    function getRouteProps(url) {
        return url
            .split('/')
            .filter(Boolean)
            .map(f => f.match(/\:(.+)/))
            .map(f => f && f[1])
    }

    /* node_modules/@sveltech/routify/runtime/Prefetcher.svelte generated by Svelte v3.31.0 */

    const { Object: Object_1 } = globals;
    const file = "node_modules/@sveltech/routify/runtime/Prefetcher.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (93:2) {#each $actives as prefetch (prefetch.options.prefetch)}
    function create_each_block(key_1, ctx) {
    	let iframe;
    	let iframe_src_value;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			iframe = element("iframe");
    			if (iframe.src !== (iframe_src_value = /*prefetch*/ ctx[1].url)) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "frameborder", "0");
    			attr_dev(iframe, "title", "routify prefetcher");
    			add_location(iframe, file, 93, 4, 2705);
    			this.first = iframe;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, iframe, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$actives*/ 1 && iframe.src !== (iframe_src_value = /*prefetch*/ ctx[1].url)) {
    				attr_dev(iframe, "src", iframe_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(iframe);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(93:2) {#each $actives as prefetch (prefetch.options.prefetch)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_value = /*$actives*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*prefetch*/ ctx[1].options.prefetch;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "id", "__routify_iframes");
    			set_style(div, "display", "none");
    			add_location(div, file, 91, 0, 2591);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$actives*/ 1) {
    				const each_value = /*$actives*/ ctx[0];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, destroy_block, create_each_block, null, get_each_context);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const iframeNum = 2;

    const defaults = {
    	validFor: 60,
    	timeout: 5000,
    	gracePeriod: 1000
    };

    /** stores and subscriptions */
    const queue = writable([]);

    const actives = derived(queue, q => q.slice(0, iframeNum));

    actives.subscribe(actives => actives.forEach(({ options }) => {
    	setTimeout(() => removeFromQueue(options.prefetch), options.timeout);
    }));

    function prefetch(path, options = {}) {
    	prefetch.id = prefetch.id || 1;

    	path = !path.href
    	? path
    	: path.href.replace(/^(?:\/\/|[^/]+)*\//, "/");

    	//replace first ? since were mixing user queries with routify queries
    	path = path.replace("?", "&");

    	options = { ...defaults, ...options, path };
    	options.prefetch = prefetch.id++;

    	//don't prefetch within prefetch or SSR
    	if (window.routify.prefetched || navigator.userAgent.match("jsdom")) return false;

    	// add to queue
    	queue.update(q => {
    		if (!q.some(e => e.options.path === path)) q.push({
    			url: `/__app.html?${optionsToQuery(options)}`,
    			options
    		});

    		return q;
    	});
    }

    /**
     * convert options to query string
     * {a:1,b:2} becomes __routify_a=1&routify_b=2
     * @param {defaults & {path: string, prefetch: number}} options
     */
    function optionsToQuery(options) {
    	return Object.entries(options).map(([key, val]) => `__routify_${key}=${val}`).join("&");
    }

    /**
     * @param {number|MessageEvent} idOrEvent
     */
    function removeFromQueue(idOrEvent) {
    	const id = idOrEvent.data ? idOrEvent.data.prefetchId : idOrEvent;
    	if (!id) return null;
    	const entry = get_store_value(queue).find(entry => entry && entry.options.prefetch == id);

    	// removeFromQueue is called by both eventListener and timeout,
    	// but we can only remove the item once
    	if (entry) {
    		const { gracePeriod } = entry.options;
    		const gracePromise = new Promise(resolve => setTimeout(resolve, gracePeriod));

    		const idlePromise = new Promise(resolve => {
    				window.requestIdleCallback
    				? window.requestIdleCallback(resolve)
    				: setTimeout(resolve, gracePeriod + 1000);
    			});

    		Promise.all([gracePromise, idlePromise]).then(() => {
    			queue.update(q => q.filter(q => q.options.prefetch != id));
    		});
    	}
    }

    // Listen to message from child window
    addEventListener("message", removeFromQueue, false);

    function instance($$self, $$props, $$invalidate) {
    	let $actives;
    	validate_store(actives, "actives");
    	component_subscribe($$self, actives, $$value => $$invalidate(0, $actives = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Prefetcher", slots, []);
    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Prefetcher> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		writable,
    		derived,
    		get: get_store_value,
    		iframeNum,
    		defaults,
    		queue,
    		actives,
    		prefetch,
    		optionsToQuery,
    		removeFromQueue,
    		$actives
    	});

    	return [$actives];
    }

    class Prefetcher extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Prefetcher",
    			options,
    			id: create_fragment.name
    		});
    	}
    }
    Prefetcher.$compile = {"vars":[{"name":"writable","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"derived","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"get","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"iframeNum","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"defaults","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"queue","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"actives","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"prefetch","export_name":"prefetch","injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"optionsToQuery","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"removeFromQueue","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"$actives","export_name":null,"injected":true,"module":false,"mutated":true,"reassigned":false,"referenced":true,"writable":true,"referenced_from_script":false}]};

    /// <reference path="../typedef.js" />

    /** @ts-check */
    /**
     * @typedef {Object} RoutifyContext
     * @prop {ClientNode} component
     * @prop {ClientNode} layout
     * @prop {any} componentFile 
     * 
     *  @returns {import('svelte/store').Readable<RoutifyContext>} */
    function getRoutifyContext() {
      return getContext('routify') || rootContext
    }


    /**
     * @typedef {import('svelte/store').Readable<ClientNodeApi>} ClientNodeHelperStore
     * @type { ClientNodeHelperStore } 
     */
    const page = {
      subscribe(run) {
        return derived(route, route => route.api).subscribe(run)
      }
    };

    /** @type {ClientNodeHelperStore} */
    const layout = {
      subscribe(run) {
        const ctx = getRoutifyContext();
        return derived(ctx, ctx => ctx.layout.api).subscribe(run)
      }
    };

    /**
     * @callback AfterPageLoadHelper
     * @param {function} callback
     * 
     * @typedef {import('svelte/store').Readable<AfterPageLoadHelper> & {_hooks:Array<function>}} AfterPageLoadHelperStore
     * @type {AfterPageLoadHelperStore}
     */
    const afterPageLoad = {
      _hooks: [],
      subscribe: hookHandler
    };

    /** 
     * @callback BeforeUrlChangeHelper
     * @param {function} callback
     *
     * @typedef {import('svelte/store').Readable<BeforeUrlChangeHelper> & {_hooks:Array<function>}} BeforeUrlChangeHelperStore
     * @type {BeforeUrlChangeHelperStore}
     **/
    const beforeUrlChange = {
      _hooks: [],
      subscribe: hookHandler
    };

    function hookHandler(listener) {
      const hooks = this._hooks;
      const index = hooks.length;
      listener(callback => { hooks[index] = callback; });
      return () => delete hooks[index]
    }

    /**
     * @callback UrlHelper
     * @param {String=} path
     * @param {UrlParams=} params
     * @param {UrlOptions=} options
     * @return {String}
     *
     * @typedef {import('svelte/store').Readable<UrlHelper>} UrlHelperStore
     * @type {UrlHelperStore} 
     * */
    const url = {
      subscribe(listener) {
        const ctx = getRoutifyContext();
        return derived(
          [ctx, route, routes, location$1],
          args => makeUrlHelper(...args)
        ).subscribe(
          listener
        )
      }
    };

    /** 
     * @param {{component: ClientNode}} $ctx 
     * @param {RouteNode} $oldRoute 
     * @param {RouteNode[]} $routes 
     * @param {{base: string, path: string}} $location
     * @returns {UrlHelper}
     */
    function makeUrlHelper($ctx, $oldRoute, $routes, $location) {
      return function url(path, params, options) {
        const { component } = $ctx;
        path = path || './';

        const strict = options && options.strict !== false;
        if (!strict) path = path.replace(/index$/, '');

        if (path.match(/^\.\.?\//)) {
          //RELATIVE PATH
          let [, breadcrumbs, relativePath] = path.match(/^([\.\/]+)(.*)/);
          let dir = component.path.replace(/\/$/, '');
          const traverse = breadcrumbs.match(/\.\.\//g) || [];
          traverse.forEach(() => dir = dir.replace(/\/[^\/]+\/?$/, ''));
          path = `${dir}/${relativePath}`.replace(/\/$/, '');

        } else if (path.match(/^\//)) ; else {
          // NAMED PATH
          const matchingRoute = $routes.find(route => route.meta.name === path);
          if (matchingRoute) path = matchingRoute.shortPath;
        }

        /** @type {Object<string, *>} Parameters */
        const allParams = Object.assign({}, $oldRoute.params, component.params, params);
        let pathWithParams = path;
        for (const [key, value] of Object.entries(allParams)) {
          pathWithParams = pathWithParams.replace(`:${key}`, value);
        }

        const fullPath = $location.base + pathWithParams + _getQueryString(path, params);
        return fullPath.replace(/\?$/, '')
      }
    }

    /**
     * 
     * @param {string} path 
     * @param {object} params 
     */
    function _getQueryString(path, params) {
      if (!defaultConfig.queryHandler) return ""
      const pathParamKeys = pathToParamKeys(path);
      const queryParams = {};
      if (params) Object.entries(params).forEach(([key, value]) => {
        if (!pathParamKeys.includes(key))
          queryParams[key] = value;
      });
      return defaultConfig.queryHandler.stringify(queryParams)
    }

    /**
     * @callback IsActiveHelper
     * @param {String=} path
     * @param {UrlParams=} params
     * @param {UrlOptions=} options
     * @returns {Boolean}
     * 
     * @typedef {import('svelte/store').Readable<IsActiveHelper>} IsActiveHelperStore
     * @type {IsActiveHelperStore} 
     * */
    const isActive = {
      subscribe(run) {
        return derived(
          [url, route],
          ([url, route]) => function isActive(path = "", params = {}, { strict } = { strict: true }) {
            path = url(path, null, { strict });
            const currentPath = url(route.path, null, { strict });
            const re = new RegExp('^' + path + '($|/)');
            return !!currentPath.match(re)
          }
        ).subscribe(run)
      },
    };



    const _metatags = {
      props: {},
      templates: {},
      services: {
        plain: { propField: 'name', valueField: 'content' },
        twitter: { propField: 'name', valueField: 'content' },
        og: { propField: 'property', valueField: 'content' },
      },
      plugins: [
        {
          name: 'applyTemplate',
          condition: () => true,
          action: (prop, value) => {
            const template = _metatags.getLongest(_metatags.templates, prop) || (x => x);
            return [prop, template(value)]
          }
        },
        {
          name: 'createMeta',
          condition: () => true,
          action(prop, value) {
            _metatags.writeMeta(prop, value);
          }
        },
        {
          name: 'createOG',
          condition: prop => !prop.match(':'),
          action(prop, value) {
            _metatags.writeMeta(`og:${prop}`, value);
          }
        },
        {
          name: 'createTitle',
          condition: prop => prop === 'title',
          action(prop, value) {
            document.title = value;
          }
        }
      ],
      getLongest(repo, name) {
        const providers = repo[name];
        if (providers) {
          const currentPath = get_store_value(route).path;
          const allPaths = Object.keys(repo[name]);
          const matchingPaths = allPaths.filter(path => currentPath.includes(path));

          const longestKey = matchingPaths.sort((a, b) => b.length - a.length)[0];

          return providers[longestKey]
        }
      },
      writeMeta(prop, value) {
        const head = document.getElementsByTagName('head')[0];
        const match = prop.match(/(.+)\:/);
        const serviceName = match && match[1] || 'plain';
        const { propField, valueField } = metatags.services[serviceName] || metatags.services.plain;
        const oldElement = document.querySelector(`meta[${propField}='${prop}']`);
        if (oldElement) oldElement.remove();

        const newElement = document.createElement('meta');
        newElement.setAttribute(propField, prop);
        newElement.setAttribute(valueField, value);
        newElement.setAttribute('data-origin', 'routify');
        head.appendChild(newElement);
      },
      set(prop, value) {
        _metatags.plugins.forEach(plugin => {
          if (plugin.condition(prop, value))
            [prop, value] = plugin.action(prop, value) || [prop, value];
        });
      },
      clear() {
        const oldElement = document.querySelector(`meta`);
        if (oldElement) oldElement.remove();
      },
      template(name, fn) {
        const origin = _metatags.getOrigin();
        _metatags.templates[name] = _metatags.templates[name] || {};
        _metatags.templates[name][origin] = fn;
      },
      update() {
        Object.keys(_metatags.props).forEach((prop) => {
          let value = (_metatags.getLongest(_metatags.props, prop));
          _metatags.plugins.forEach(plugin => {
            if (plugin.condition(prop, value)) {
              [prop, value] = plugin.action(prop, value) || [prop, value];

            }
          });
        });
      },
      batchedUpdate() {
        if (!_metatags._pendingUpdate) {
          _metatags._pendingUpdate = true;
          setTimeout(() => {
            _metatags._pendingUpdate = false;
            this.update();
          });
        }
      },
      _updateQueued: false,
      getOrigin() {
        const routifyCtx = getRoutifyContext();
        return routifyCtx && get_store_value(routifyCtx).path || '/'
      },
      _pendingUpdate: false
    };


    /**
     * metatags
     * @prop {Object.<string, string>}
     */
    const metatags = new Proxy(_metatags, {
      set(target, name, value, receiver) {
        const { props, getOrigin } = target;

        if (Reflect.has(target, name))
          Reflect.set(target, name, value, receiver);
        else {
          props[name] = props[name] || {};
          props[name][getOrigin()] = value;
        }

        if (window['routify'].appLoaded)
          target.batchedUpdate();
        return true
      }
    });

    const isChangingPage = (function () {
      const store = writable(false);
      beforeUrlChange.subscribe(fn => fn(event => {
        store.set(true);
        return true
      }));
      
      afterPageLoad.subscribe(fn => fn(event => store.set(false)));

      return store
    })();

    /* node_modules/@sveltech/routify/runtime/Route.svelte generated by Svelte v3.31.0 */
    const file$1 = "node_modules/@sveltech/routify/runtime/Route.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[19] = list[i].component;
    	child_ctx[20] = list[i].componentFile;
    	return child_ctx;
    }

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[19] = list[i].component;
    	child_ctx[20] = list[i].componentFile;
    	return child_ctx;
    }

    // (120:0) {#if $context}
    function create_if_block_1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_2, create_if_block_3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$context*/ ctx[6].component.isLayout === false) return 0;
    		if (/*remainingLayouts*/ ctx[5].length) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(120:0) {#if $context}",
    		ctx
    	});

    	return block;
    }

    // (132:36) 
    function create_if_block_3(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value_1 = [/*$context*/ ctx[6]];
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*component*/ ctx[19].path;
    	validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);

    	for (let i = 0; i < 1; i += 1) {
    		let child_ctx = get_each_context_1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < 1; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < 1; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$context, scoped, scopedSync, layout, remainingLayouts, decorator, Decorator, scopeToChild*/ 100663407) {
    				const each_value_1 = [/*$context*/ ctx[6]];
    				validate_each_argument(each_value_1);
    				group_outros();
    				validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block_1, each_1_anchor, get_each_context_1);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < 1; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 1; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < 1; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(132:36) ",
    		ctx
    	});

    	return block;
    }

    // (121:2) {#if $context.component.isLayout === false}
    function create_if_block_2(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value = [/*$context*/ ctx[6]];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*component*/ ctx[19].path;
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

    	for (let i = 0; i < 1; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < 1; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < 1; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$context, scoped, scopedSync, layout*/ 77) {
    				const each_value = [/*$context*/ ctx[6]];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block$1, each_1_anchor, get_each_context$1);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < 1; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 1; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < 1; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(121:2) {#if $context.component.isLayout === false}",
    		ctx
    	});

    	return block;
    }

    // (134:6) <svelte:component         this={componentFile}         let:scoped={scopeToChild}         let:decorator         {scoped}         {scopedSync}         {...layout.param || {}}>
    function create_default_slot(ctx) {
    	let route_1;
    	let t;
    	let current;

    	route_1 = new Route({
    			props: {
    				layouts: [.../*remainingLayouts*/ ctx[5]],
    				Decorator: typeof /*decorator*/ ctx[26] !== "undefined"
    				? /*decorator*/ ctx[26]
    				: /*Decorator*/ ctx[1],
    				childOfDecorator: /*layout*/ ctx[2].isDecorator,
    				scoped: {
    					.../*scoped*/ ctx[0],
    					.../*scopeToChild*/ ctx[25]
    				}
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(route_1.$$.fragment);
    			t = space();
    		},
    		m: function mount(target, anchor) {
    			mount_component(route_1, target, anchor);
    			insert_dev(target, t, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const route_1_changes = {};
    			if (dirty & /*remainingLayouts*/ 32) route_1_changes.layouts = [.../*remainingLayouts*/ ctx[5]];

    			if (dirty & /*decorator, Decorator*/ 67108866) route_1_changes.Decorator = typeof /*decorator*/ ctx[26] !== "undefined"
    			? /*decorator*/ ctx[26]
    			: /*Decorator*/ ctx[1];

    			if (dirty & /*layout*/ 4) route_1_changes.childOfDecorator = /*layout*/ ctx[2].isDecorator;

    			if (dirty & /*scoped, scopeToChild*/ 33554433) route_1_changes.scoped = {
    				.../*scoped*/ ctx[0],
    				.../*scopeToChild*/ ctx[25]
    			};

    			route_1.$set(route_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(route_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(route_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(route_1, detaching);
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(134:6) <svelte:component         this={componentFile}         let:scoped={scopeToChild}         let:decorator         {scoped}         {scopedSync}         {...layout.param || {}}>",
    		ctx
    	});

    	return block;
    }

    // (133:4) {#each [$context] as { component, componentFile }
    function create_each_block_1(key_1, ctx) {
    	let first;
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;

    	const switch_instance_spread_levels = [
    		{ scoped: /*scoped*/ ctx[0] },
    		{ scopedSync: /*scopedSync*/ ctx[3] },
    		/*layout*/ ctx[2].param || {}
    	];

    	var switch_value = /*componentFile*/ ctx[20];

    	function switch_props(ctx) {
    		let switch_instance_props = {
    			$$slots: {
    				default: [
    					create_default_slot,
    					({ scoped: scopeToChild, decorator }) => ({ 25: scopeToChild, 26: decorator }),
    					({ scoped: scopeToChild, decorator }) => (scopeToChild ? 33554432 : 0) | (decorator ? 67108864 : 0)
    				]
    			},
    			$$scope: { ctx }
    		};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);

    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*scoped, scopedSync, layout*/ 13)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*scoped*/ 1 && { scoped: /*scoped*/ ctx[0] },
    					dirty & /*scopedSync*/ 8 && { scopedSync: /*scopedSync*/ ctx[3] },
    					dirty & /*layout*/ 4 && get_spread_object(/*layout*/ ctx[2].param || {})
    				])
    			: {};

    			if (dirty & /*$$scope, remainingLayouts, decorator, Decorator, layout, scoped, scopeToChild*/ 234881063) {
    				switch_instance_changes.$$scope = { dirty, ctx };
    			}

    			if (switch_value !== (switch_value = /*componentFile*/ ctx[20])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(133:4) {#each [$context] as { component, componentFile }",
    		ctx
    	});

    	return block;
    }

    // (122:4) {#each [$context] as { component, componentFile }
    function create_each_block$1(key_1, ctx) {
    	let first;
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;

    	const switch_instance_spread_levels = [
    		{ scoped: /*scoped*/ ctx[0] },
    		{ scopedSync: /*scopedSync*/ ctx[3] },
    		/*layout*/ ctx[2].param || {}
    	];

    	var switch_value = /*componentFile*/ ctx[20];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);

    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*scoped, scopedSync, layout*/ 13)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*scoped*/ 1 && { scoped: /*scoped*/ ctx[0] },
    					dirty & /*scopedSync*/ 8 && { scopedSync: /*scopedSync*/ ctx[3] },
    					dirty & /*layout*/ 4 && get_spread_object(/*layout*/ ctx[2].param || {})
    				])
    			: {};

    			if (switch_value !== (switch_value = /*componentFile*/ ctx[20])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(122:4) {#each [$context] as { component, componentFile }",
    		ctx
    	});

    	return block;
    }

    // (152:0) {#if !parentElement}
    function create_if_block(ctx) {
    	let span;
    	let setParent_action;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			span = element("span");
    			add_location(span, file$1, 152, 2, 4450);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);

    			if (!mounted) {
    				dispose = action_destroyer(setParent_action = /*setParent*/ ctx[8].call(null, span));
    				mounted = true;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(152:0) {#if !parentElement}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let t;
    	let if_block1_anchor;
    	let current;
    	let if_block0 = /*$context*/ ctx[6] && create_if_block_1(ctx);
    	let if_block1 = !/*parentElement*/ ctx[4] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$context*/ ctx[6]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*$context*/ 64) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t.parentNode, t);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (!/*parentElement*/ ctx[4]) {
    				if (if_block1) ; else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $route;
    	let $context;
    	validate_store(route, "route");
    	component_subscribe($$self, route, $$value => $$invalidate(14, $route = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Route", slots, []);
    	let { layouts = [] } = $$props;
    	let { scoped = {} } = $$props;
    	let { Decorator = null } = $$props;
    	let { childOfDecorator = false } = $$props;
    	let { isRoot = false } = $$props;
    	let scopedSync = {};
    	let isDecorator = false;

    	/** @type {HTMLElement} */
    	let parentElement;

    	/** @type {LayoutOrDecorator} */
    	let layout = null;

    	/** @type {LayoutOrDecorator} */
    	let lastLayout = null;

    	/** @type {LayoutOrDecorator[]} */
    	let remainingLayouts = [];

    	const context = writable(null);
    	validate_store(context, "context");
    	component_subscribe($$self, context, value => $$invalidate(6, $context = value));

    	/** @type {import("svelte/store").Writable<Context>} */
    	const parentContextStore = getContext("routify");

    	isDecorator = Decorator && !childOfDecorator;
    	setContext("routify", context);

    	/** @param {HTMLElement} el */
    	function setParent(el) {
    		$$invalidate(4, parentElement = el.parentElement);
    	}

    	/** @param {SvelteComponent} componentFile */
    	function onComponentLoaded(componentFile) {
    		/** @type {Context} */
    		const parentContext = get_store_value(parentContextStore);

    		$$invalidate(3, scopedSync = { ...scoped });
    		lastLayout = layout;
    		if (remainingLayouts.length === 0) onLastComponentLoaded();

    		const ctx = {
    			layout: isDecorator ? parentContext.layout : layout,
    			component: layout,
    			route: $route,
    			componentFile,
    			child: isDecorator
    			? parentContext.child
    			: get_store_value(context) && get_store_value(context).child
    		};

    		context.set(ctx);
    		if (isRoot) rootContext.set(ctx);

    		if (parentContext && !isDecorator) parentContextStore.update(store => {
    			store.child = layout || store.child;
    			return store;
    		});
    	}

    	/**  @param {LayoutOrDecorator} layout */
    	function setComponent(layout) {
    		let PendingComponent = layout.component();
    		if (PendingComponent instanceof Promise) PendingComponent.then(onComponentLoaded); else onComponentLoaded(PendingComponent);
    	}

    	async function onLastComponentLoaded() {
    		afterPageLoad._hooks.forEach(hook => hook(layout.api));
    		await tick();
    		handleScroll(parentElement);

    		if (!window["routify"].appLoaded) {
    			const pagePath = $context.component.path;
    			const routePath = $route.path;
    			const isOnCurrentRoute = pagePath === routePath; //maybe we're getting redirected

    			// Let everyone know the last child has rendered
    			if (!window["routify"].stopAutoReady && isOnCurrentRoute) {
    				onAppLoaded({ path: pagePath, metatags });
    			}
    		}
    	}

    	const writable_props = ["layouts", "scoped", "Decorator", "childOfDecorator", "isRoot"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Route> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("layouts" in $$props) $$invalidate(9, layouts = $$props.layouts);
    		if ("scoped" in $$props) $$invalidate(0, scoped = $$props.scoped);
    		if ("Decorator" in $$props) $$invalidate(1, Decorator = $$props.Decorator);
    		if ("childOfDecorator" in $$props) $$invalidate(10, childOfDecorator = $$props.childOfDecorator);
    		if ("isRoot" in $$props) $$invalidate(11, isRoot = $$props.isRoot);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		setContext,
    		onDestroy,
    		onMount,
    		tick,
    		writable,
    		get: get_store_value,
    		metatags,
    		afterPageLoad,
    		route,
    		routes,
    		rootContext,
    		handleScroll,
    		onAppLoaded,
    		layouts,
    		scoped,
    		Decorator,
    		childOfDecorator,
    		isRoot,
    		scopedSync,
    		isDecorator,
    		parentElement,
    		layout,
    		lastLayout,
    		remainingLayouts,
    		context,
    		parentContextStore,
    		setParent,
    		onComponentLoaded,
    		setComponent,
    		onLastComponentLoaded,
    		$route,
    		$context
    	});

    	$$self.$inject_state = $$props => {
    		if ("layouts" in $$props) $$invalidate(9, layouts = $$props.layouts);
    		if ("scoped" in $$props) $$invalidate(0, scoped = $$props.scoped);
    		if ("Decorator" in $$props) $$invalidate(1, Decorator = $$props.Decorator);
    		if ("childOfDecorator" in $$props) $$invalidate(10, childOfDecorator = $$props.childOfDecorator);
    		if ("isRoot" in $$props) $$invalidate(11, isRoot = $$props.isRoot);
    		if ("scopedSync" in $$props) $$invalidate(3, scopedSync = $$props.scopedSync);
    		if ("isDecorator" in $$props) $$invalidate(12, isDecorator = $$props.isDecorator);
    		if ("parentElement" in $$props) $$invalidate(4, parentElement = $$props.parentElement);
    		if ("layout" in $$props) $$invalidate(2, layout = $$props.layout);
    		if ("lastLayout" in $$props) lastLayout = $$props.lastLayout;
    		if ("remainingLayouts" in $$props) $$invalidate(5, remainingLayouts = $$props.remainingLayouts);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*isDecorator, Decorator, layouts*/ 4610) {
    			 if (isDecorator) {
    				const decoratorLayout = {
    					component: () => Decorator,
    					path: `${layouts[0].path}__decorator`,
    					isDecorator: true
    				};

    				$$invalidate(9, layouts = [decoratorLayout, ...layouts]);
    			}
    		}

    		if ($$self.$$.dirty & /*layouts*/ 512) {
    			 $$invalidate(2, [layout, ...remainingLayouts] = layouts, layout, ((($$invalidate(5, remainingLayouts), $$invalidate(9, layouts)), $$invalidate(12, isDecorator)), $$invalidate(1, Decorator)));
    		}

    		if ($$self.$$.dirty & /*layout*/ 4) {
    			 setComponent(layout);
    		}
    	};

    	return [
    		scoped,
    		Decorator,
    		layout,
    		scopedSync,
    		parentElement,
    		remainingLayouts,
    		$context,
    		context,
    		setParent,
    		layouts,
    		childOfDecorator,
    		isRoot,
    		isDecorator
    	];
    }

    class Route extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			layouts: 9,
    			scoped: 0,
    			Decorator: 1,
    			childOfDecorator: 10,
    			isRoot: 11
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Route",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get layouts() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set layouts(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scoped() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scoped(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get Decorator() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Decorator(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get childOfDecorator() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set childOfDecorator(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isRoot() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isRoot(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }
    Route.$compile = {"vars":[{"name":"getContext","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"setContext","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"onDestroy","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"onMount","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"tick","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"writable","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"get","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"metatags","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"afterPageLoad","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"route","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":true},{"name":"routes","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"rootContext","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"handleScroll","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"onAppLoaded","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"layouts","export_name":"layouts","injected":false,"module":false,"mutated":false,"reassigned":true,"referenced":false,"writable":true,"referenced_from_script":true},{"name":"scoped","export_name":"scoped","injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":true,"referenced_from_script":true},{"name":"Decorator","export_name":"Decorator","injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":true,"referenced_from_script":true},{"name":"childOfDecorator","export_name":"childOfDecorator","injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":true,"referenced_from_script":true},{"name":"isRoot","export_name":"isRoot","injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":true,"referenced_from_script":true},{"name":"scopedSync","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":true,"referenced":true,"writable":true,"referenced_from_script":true},{"name":"isDecorator","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":true,"referenced":false,"writable":true,"referenced_from_script":true},{"name":"parentElement","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":true,"referenced":true,"writable":true,"referenced_from_script":true},{"name":"layout","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":true,"referenced":true,"writable":true,"referenced_from_script":true},{"name":"lastLayout","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":true,"referenced":false,"writable":true,"referenced_from_script":true},{"name":"remainingLayouts","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":true,"referenced":true,"writable":true,"referenced_from_script":true},{"name":"context","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":true},{"name":"parentContextStore","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"setParent","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"onComponentLoaded","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"setComponent","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"onLastComponentLoaded","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"$route","export_name":null,"injected":true,"module":false,"mutated":true,"reassigned":false,"referenced":false,"writable":true,"referenced_from_script":false},{"name":"$context","export_name":null,"injected":true,"module":false,"mutated":true,"reassigned":false,"referenced":true,"writable":true,"referenced_from_script":false}]};

    function init$1(routes, callback) {
      /** @type { ClientNode | false } */
      let lastRoute = false;

      function updatePage(proxyToUrl, shallow) {
        const url = proxyToUrl || currentLocation();
        const route$1 = urlToRoute(url);
        const currentRoute = shallow && urlToRoute(currentLocation());
        const contextRoute = currentRoute || route$1;
        const layouts = [...contextRoute.layouts, route$1];
        if (lastRoute) delete lastRoute.last; //todo is a page component the right place for the previous route?
        route$1.last = lastRoute;
        lastRoute = route$1;

        //set the route in the store
        if (!proxyToUrl)
          urlRoute.set(route$1);
        route.set(route$1);

        //run callback in Router.svelte
        callback(layouts);
      }

      const destroy = createEventListeners(updatePage);

      return { updatePage, destroy }
    }

    /**
     * svelte:window events doesn't work on refresh
     * @param {Function} updatePage
     */
    function createEventListeners(updatePage) {
    ['pushState', 'replaceState'].forEach(eventName => {
        const fn = history[eventName];
        history[eventName] = async function (state = {}, title, url) {
          const { id, path, params } = get_store_value(route);
          state = { id, path, params, ...state };
          const event = new Event(eventName.toLowerCase());
          Object.assign(event, { state, title, url });

          if (await runHooksBeforeUrlChange(event)) {
            fn.apply(this, [state, title, url]);
            return dispatchEvent(event)
          }
        };
      });

      let _ignoreNextPop = false;

      const listeners = {
        click: handleClick,
        pushstate: () => updatePage(),
        replacestate: () => updatePage(),
        popstate: async event => {
          if (_ignoreNextPop)
            _ignoreNextPop = false;
          else {
            if (await runHooksBeforeUrlChange(event)) {
              updatePage();
            } else {
              _ignoreNextPop = true;
              event.preventDefault();
              history.go(1);
            }
          }
        },
      };

      Object.entries(listeners).forEach(args => addEventListener(...args));

      const unregister = () => {
        Object.entries(listeners).forEach(args => removeEventListener(...args));
      };

      return unregister
    }

    function handleClick(event) {
      const el = event.target.closest('a');
      const href = el && el.getAttribute('href');

      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.shiftKey ||
        event.button ||
        event.defaultPrevented
      )
        return
      if (!href || el.target || el.host !== location.host) return

      event.preventDefault();
      history.pushState({}, '', href);
    }

    async function runHooksBeforeUrlChange(event) {
      const route$1 = get_store_value(route);
      for (const hook of beforeUrlChange._hooks.filter(Boolean)) {
        // return false if the hook returns false
        const result = await hook(event, route$1); //todo remove route from hook. Its API Can be accessed as $page
        if (!result) return false
      }
      return true
    }

    /* node_modules/@sveltech/routify/runtime/Router.svelte generated by Svelte v3.31.0 */

    const { Object: Object_1$1 } = globals;

    // (64:0) {#if layouts && $route !== null}
    function create_if_block$1(ctx) {
    	let route_1;
    	let current;

    	route_1 = new Route({
    			props: {
    				layouts: /*layouts*/ ctx[0],
    				isRoot: true
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(route_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(route_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const route_1_changes = {};
    			if (dirty & /*layouts*/ 1) route_1_changes.layouts = /*layouts*/ ctx[0];
    			route_1.$set(route_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(route_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(route_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(route_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(64:0) {#if layouts && $route !== null}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let t;
    	let prefetcher;
    	let current;
    	let if_block = /*layouts*/ ctx[0] && /*$route*/ ctx[1] !== null && create_if_block$1(ctx);
    	prefetcher = new Prefetcher({ $$inline: true });

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t = space();
    			create_component(prefetcher.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(prefetcher, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*layouts*/ ctx[0] && /*$route*/ ctx[1] !== null) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*layouts, $route*/ 3) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t.parentNode, t);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(prefetcher.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(prefetcher.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(prefetcher, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $route;
    	validate_store(route, "route");
    	component_subscribe($$self, route, $$value => $$invalidate(1, $route = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Router", slots, []);
    	let { routes: routes$1 } = $$props;
    	let { config = {} } = $$props;
    	let layouts;
    	let navigator;
    	window.routify = window.routify || {};
    	window.routify.inBrowser = !window.navigator.userAgent.match("jsdom");

    	Object.entries(config).forEach(([key, value]) => {
    		defaultConfig[key] = value;
    	});

    	suppressWarnings();
    	const updatePage = (...args) => navigator && navigator.updatePage(...args);
    	setContext("routifyupdatepage", updatePage);
    	const callback = res => $$invalidate(0, layouts = res);

    	const cleanup = () => {
    		if (!navigator) return;
    		navigator.destroy();
    		navigator = null;
    	};

    	let initTimeout = null;

    	// init is async to prevent a horrible bug that completely disable reactivity
    	// in the host component -- something like the component's update function is
    	// called before its fragment is created, and since the component is then seen
    	// as already dirty, it is never scheduled for update again, and remains dirty
    	// forever... I failed to isolate the precise conditions for the bug, but the
    	// faulty update is triggered by a change in the route store, and so offseting
    	// store initialization by one tick gives the host component some time to
    	// create its fragment. The root cause it probably a bug in Svelte with deeply
    	// intertwinned store and reactivity.
    	const doInit = () => {
    		clearTimeout(initTimeout);

    		initTimeout = setTimeout(() => {
    			cleanup();
    			navigator = init$1(routes$1, callback);
    			routes.set(routes$1);
    			navigator.updatePage();
    		});
    	};

    	onDestroy(cleanup);
    	const writable_props = ["routes", "config"];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("routes" in $$props) $$invalidate(2, routes$1 = $$props.routes);
    		if ("config" in $$props) $$invalidate(3, config = $$props.config);
    	};

    	$$self.$capture_state = () => ({
    		setContext,
    		onDestroy,
    		Route,
    		Prefetcher,
    		init: init$1,
    		route,
    		routesStore: routes,
    		prefetchPath,
    		suppressWarnings,
    		defaultConfig,
    		routes: routes$1,
    		config,
    		layouts,
    		navigator,
    		updatePage,
    		callback,
    		cleanup,
    		initTimeout,
    		doInit,
    		$route
    	});

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(2, routes$1 = $$props.routes);
    		if ("config" in $$props) $$invalidate(3, config = $$props.config);
    		if ("layouts" in $$props) $$invalidate(0, layouts = $$props.layouts);
    		if ("navigator" in $$props) navigator = $$props.navigator;
    		if ("initTimeout" in $$props) initTimeout = $$props.initTimeout;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*routes*/ 4) {
    			 if (routes$1) doInit();
    		}
    	};

    	return [layouts, $route, routes$1, config];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { routes: 2, config: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*routes*/ ctx[2] === undefined && !("routes" in props)) {
    			console.warn("<Router> was created without expected prop 'routes'");
    		}
    	}

    	get routes() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get config() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set config(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }
    Router.$compile = {"vars":[{"name":"setContext","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"onDestroy","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"Route","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"Prefetcher","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"init","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"route","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"routesStore","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"prefetchPath","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"suppressWarnings","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"defaultConfig","export_name":null,"injected":false,"module":false,"mutated":true,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"routes","export_name":"routes","injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":true,"referenced_from_script":true},{"name":"config","export_name":"config","injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":true,"referenced_from_script":true},{"name":"layouts","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":true,"referenced":true,"writable":true,"referenced_from_script":true},{"name":"navigator","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":true,"referenced":false,"writable":true,"referenced_from_script":true},{"name":"updatePage","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"callback","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"cleanup","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"initTimeout","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":true,"referenced":false,"writable":true,"referenced_from_script":true},{"name":"doInit","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"$route","export_name":null,"injected":true,"module":false,"mutated":true,"reassigned":false,"referenced":true,"writable":true,"referenced_from_script":false}]};

    /** 
     * Node payload
     * @typedef {Object} NodePayload
     * @property {RouteNode=} file current node
     * @property {RouteNode=} parent parent of the current node
     * @property {StateObject=} state state shared by every node in the walker
     * @property {Object=} scope scope inherited by descendants in the scope
     *
     * State Object
     * @typedef {Object} StateObject
     * @prop {TreePayload=} treePayload payload from the tree
     * 
     * Node walker proxy
     * @callback NodeWalkerProxy
     * @param {NodePayload} NodePayload
     */


    /**
     * Node middleware
     * @description Walks through the nodes of a tree
     * @example middleware = createNodeMiddleware(payload => {payload.file.name = 'hello'})(treePayload))
     * @param {NodeWalkerProxy} fn 
     */
    function createNodeMiddleware(fn) {

        /**    
         * NodeMiddleware payload receiver
         * @param {TreePayload} payload
         */
        const inner = async function execute(payload) {
            return await nodeMiddleware(payload.tree, fn, { state: { treePayload: payload } })
        };

        /**    
         * NodeMiddleware sync payload receiver
         * @param {TreePayload} payload
         */
        inner.sync = function executeSync(payload) {
            return nodeMiddlewareSync(payload.tree, fn, { state: { treePayload: payload } })
        };

        return inner
    }

    /**
     * Node walker
     * @param {Object} file mutable file
     * @param {NodeWalkerProxy} fn function to be called for each file
     * @param {NodePayload=} payload 
     */
    async function nodeMiddleware(file, fn, payload) {
        const { state, scope, parent } = payload || {};
        payload = {
            file,
            parent,
            state: state || {},            //state is shared by all files in the walk
            scope: clone(scope || {}),     //scope is inherited by descendants
        };

        await fn(payload);

        if (file.children) {
            payload.parent = file;
            await Promise.all(file.children.map(_file => nodeMiddleware(_file, fn, payload)));
        }
        return payload
    }

    /**
     * Node walker (sync version)
     * @param {Object} file mutable file
     * @param {NodeWalkerProxy} fn function to be called for each file
     * @param {NodePayload=} payload 
     */
    function nodeMiddlewareSync(file, fn, payload) {
        const { state, scope, parent } = payload || {};
        payload = {
            file,
            parent,
            state: state || {},            //state is shared by all files in the walk
            scope: clone(scope || {}),     //scope is inherited by descendants
        };

        fn(payload);

        if (file.children) {
            payload.parent = file;
            file.children.map(_file => nodeMiddlewareSync(_file, fn, payload));
        }
        return payload
    }


    /**
     * Clone with JSON
     * @param {T} obj 
     * @returns {T} JSON cloned object
     * @template T
     */
    function clone(obj) { return JSON.parse(JSON.stringify(obj)) }

    const setRegex = createNodeMiddleware(({ file }) => {
        if (file.isPage || file.isFallback)
            file.regex = pathToRegex(file.path, file.isFallback);
    });
    const setParamKeys = createNodeMiddleware(({ file }) => {
        file.paramKeys = pathToParamKeys(file.path);
    });

    const setShortPath = createNodeMiddleware(({ file }) => {
        if (file.isFallback || file.isIndex)
            file.shortPath = file.path.replace(/\/[^/]+$/, '');
        else file.shortPath = file.path;
    });
    const setRank = createNodeMiddleware(({ file }) => {
        file.ranking = pathToRank(file);
    });


    // todo delete?
    const addMetaChildren = createNodeMiddleware(({ file }) => {
        const node = file;
        const metaChildren = file.meta && file.meta.children || [];
        if (metaChildren.length) {
            node.children = node.children || [];
            node.children.push(...metaChildren.map(meta => ({ isMeta: true, ...meta, meta })));
        }
    });

    const setIsIndexable = createNodeMiddleware(payload => {
        const { file } = payload;
        const { isLayout, isFallback, meta } = file;
        file.isIndexable = !isLayout && !isFallback && meta.index !== false;
        file.isNonIndexable = !file.isIndexable;
    });


    const assignRelations = createNodeMiddleware(({ file, parent }) => {
        Object.defineProperty(file, 'parent', { get: () => parent });
        Object.defineProperty(file, 'nextSibling', { get: () => _getSibling(file, 1) });
        Object.defineProperty(file, 'prevSibling', { get: () => _getSibling(file, -1) });
        Object.defineProperty(file, 'lineage', { get: () => _getLineage(parent) });
    });

    function _getLineage(node, lineage = []){
        if(node){
            lineage.unshift(node);
            _getLineage(node.parent, lineage);
        }
        return lineage
    }

    /**
     * 
     * @param {RouteNode} file 
     * @param {Number} direction 
     */
    function _getSibling(file, direction) {
        if (!file.root) {
            const siblings = file.parent.children.filter(c => c.isIndexable);
            const index = siblings.indexOf(file);
            return siblings[index + direction]
        }
    }

    const assignIndex = createNodeMiddleware(({ file, parent }) => {
        if (file.isIndex) Object.defineProperty(parent, 'index', { get: () => file });
        if (file.isLayout)
            Object.defineProperty(parent, 'layout', { get: () => file });
    });

    const assignLayout = createNodeMiddleware(({ file, scope }) => {
        Object.defineProperty(file, 'layouts', { get: () => getLayouts(file) });
        function getLayouts(file) {
            const { parent } = file;
            const layout = parent && parent.layout;
            const isReset = layout && layout.isReset;
            const layouts = (parent && !isReset && getLayouts(parent)) || [];
            if (layout) layouts.push(layout);
            return layouts
        }
    });


    const createFlatList = treePayload => {
        createNodeMiddleware(payload => {
            if (payload.file.isPage || payload.file.isFallback)
            payload.state.treePayload.routes.push(payload.file);
        }).sync(treePayload);    
        treePayload.routes.sort((c, p) => (c.ranking >= p.ranking ? -1 : 1));
    };

    const setPrototype = createNodeMiddleware(({ file }) => {
        const Prototype = file.root
            ? Root
            : file.children
                ? file.isFile ? PageDir : Dir
                : file.isReset
                    ? Reset
                    : file.isLayout
                        ? Layout
                        : file.isFallback
                            ? Fallback
                            : Page;
        Object.setPrototypeOf(file, Prototype.prototype);

        function Layout() { }
        function Dir() { }
        function Fallback() { }
        function Page() { }
        function PageDir() { }
        function Reset() { }
        function Root() { }
    });

    var miscPlugins = /*#__PURE__*/Object.freeze({
        __proto__: null,
        setRegex: setRegex,
        setParamKeys: setParamKeys,
        setShortPath: setShortPath,
        setRank: setRank,
        addMetaChildren: addMetaChildren,
        setIsIndexable: setIsIndexable,
        assignRelations: assignRelations,
        assignIndex: assignIndex,
        assignLayout: assignLayout,
        createFlatList: createFlatList,
        setPrototype: setPrototype
    });

    const assignAPI = createNodeMiddleware(({ file }) => {
        file.api = new ClientApi(file);
    });

    class ClientApi {
        constructor(file) {
            this.__file = file;
            Object.defineProperty(this, '__file', { enumerable: false });
            this.isMeta = !!file.isMeta;
            this.path = file.path;
            this.title = _prettyName(file);
            this.meta = file.meta;
        }

        get parent() { return !this.__file.root && this.__file.parent.api }
        get children() {
            return (this.__file.children || this.__file.isLayout && this.__file.parent.children || [])
                .filter(c => !c.isNonIndexable)
                .sort((a, b) => {
                    if(a.isMeta && b.isMeta) return 0
                    a = (a.meta.index || a.meta.title || a.path).toString();
                    b = (b.meta.index || b.meta.title || b.path).toString();
                    return a.localeCompare((b), undefined, { numeric: true, sensitivity: 'base' })
                })
                .map(({ api }) => api)
        }
        get next() { return _navigate(this, +1) }
        get prev() { return _navigate(this, -1) }
        preload() {
            this.__file.layouts.forEach(file => file.component());
            this.__file.component(); 
        }
    }

    function _navigate(node, direction) {
        if (!node.__file.root) {
            const siblings = node.parent.children;
            const index = siblings.indexOf(node);
            return node.parent.children[index + direction]
        }
    }


    function _prettyName(file) {
        if (typeof file.meta.title !== 'undefined') return file.meta.title
        else return (file.shortPath || file.path)
            .split('/')
            .pop()
            .replace(/-/g, ' ')
    }

    const plugins = {...miscPlugins, assignAPI};

    function buildClientTree(tree) {
      const order = [
        // pages
        "setParamKeys", //pages only
        "setRegex", //pages only
        "setShortPath", //pages only
        "setRank", //pages only
        "assignLayout", //pages only,
        // all
        "setPrototype",
        "addMetaChildren",
        "assignRelations", //all (except meta components?)
        "setIsIndexable", //all
        "assignIndex", //all
        "assignAPI", //all
        // routes
        "createFlatList"
      ];

      const payload = { tree, routes: [] };
      for (let name of order) {
        const syncFn = plugins[name].sync || plugins[name];
        syncFn(payload);
      }
      return payload
    }

    //tree
    const _tree = {
      "name": "root",
      "filepath": "/",
      "root": true,
      "ownMeta": {},
      "absolutePath": "src/pages",
      "children": [
        {
          "isFile": true,
          "isDir": false,
          "file": "_fallback.svelte",
          "filepath": "/_fallback.svelte",
          "name": "_fallback",
          "ext": "svelte",
          "badExt": false,
          "absolutePath": "/home/timo/Github/Death/src/pages/_fallback.svelte",
          "importPath": "../src/pages/_fallback.svelte",
          "isLayout": false,
          "isReset": false,
          "isIndex": false,
          "isFallback": true,
          "isPage": false,
          "ownMeta": {},
          "meta": {
            "preload": false,
            "prerender": true,
            "precache-order": false,
            "precache-proximity": true,
            "recursive": true
          },
          "path": "/_fallback",
          "id": "__fallback",
          "component": () => Promise.resolve().then(function () { return _fallback; }).then(m => m.default)
        },
        {
          "isFile": true,
          "isDir": false,
          "file": "_layout.svelte",
          "filepath": "/_layout.svelte",
          "name": "_layout",
          "ext": "svelte",
          "badExt": false,
          "absolutePath": "/home/timo/Github/Death/src/pages/_layout.svelte",
          "importPath": "../src/pages/_layout.svelte",
          "isLayout": true,
          "isReset": false,
          "isIndex": false,
          "isFallback": false,
          "isPage": false,
          "ownMeta": {},
          "meta": {
            "preload": false,
            "prerender": true,
            "precache-order": false,
            "precache-proximity": true,
            "recursive": true
          },
          "path": "/",
          "id": "__layout",
          "component": () => Promise.resolve().then(function () { return _layout; }).then(m => m.default)
        },
        {
          "isFile": true,
          "isDir": false,
          "file": "christianity.md",
          "filepath": "/christianity.md",
          "name": "christianity",
          "ext": "md",
          "badExt": false,
          "absolutePath": "/home/timo/Github/Death/src/pages/christianity.md",
          "importPath": "../src/pages/christianity.md",
          "isLayout": false,
          "isReset": false,
          "isIndex": false,
          "isFallback": false,
          "isPage": true,
          "ownMeta": {},
          "meta": {
            "frontmatter": {
              "title": "Mitä elämässäni tapahtuu juuri nyt?",
              "summary": "Tältä sivulta löydät tiivistelmän mihin keskityn ammatillisesti ja henkilökohtaisessa elämässä.",
              "desc": "Tervetuloa tutustumaan minuun tarkemmin. Tältä sivulta löydät kattavasti kaiken mikä on minulle tärkeää tällä hetkellä ammatillisesti ja henkilökohtaisessa elämässä.",
              "layout": "article",
              "img": "timo",
              "language": "fi"
            },
            "preload": false,
            "prerender": true,
            "precache-order": false,
            "precache-proximity": true,
            "recursive": true
          },
          "path": "/christianity",
          "id": "_christianity",
          "component": () => Promise.resolve().then(function () { return christianity; }).then(m => m.default)
        },
        {
          "isFile": false,
          "isDir": true,
          "file": "fi",
          "filepath": "/fi",
          "name": "fi",
          "ext": "",
          "badExt": false,
          "absolutePath": "/home/timo/Github/Death/src/pages/fi",
          "children": [
            {
              "isFile": true,
              "isDir": false,
              "file": "index.svelte",
              "filepath": "/fi/index.svelte",
              "name": "index",
              "ext": "svelte",
              "badExt": false,
              "absolutePath": "/home/timo/Github/Death/src/pages/fi/index.svelte",
              "importPath": "../src/pages/fi/index.svelte",
              "isLayout": false,
              "isReset": false,
              "isIndex": true,
              "isFallback": false,
              "isPage": true,
              "ownMeta": {},
              "meta": {
                "preload": false,
                "prerender": true,
                "precache-order": false,
                "precache-proximity": true,
                "recursive": true
              },
              "path": "/fi/index",
              "id": "_fi_index",
              "component": () => Promise.resolve().then(function () { return index; }).then(m => m.default)
            },
            {
              "isFile": true,
              "isDir": false,
              "file": "kristinusko.md",
              "filepath": "/fi/kristinusko.md",
              "name": "kristinusko",
              "ext": "md",
              "badExt": false,
              "absolutePath": "/home/timo/Github/Death/src/pages/fi/kristinusko.md",
              "importPath": "../src/pages/fi/kristinusko.md",
              "isLayout": false,
              "isReset": false,
              "isIndex": false,
              "isFallback": false,
              "isPage": true,
              "ownMeta": {},
              "meta": {
                "frontmatter": {
                  "title": "Kristinusko",
                  "summary": "Kuolema odottaa meitä kaikkia, mutta mitä meille oikeasti tapahtuu kuollessa ja voiko kuollutta herättää henkiin? Voiko uskonnot tarjota meille ikuista elämää?",
                  "layout": "article",
                  "language": "fi",
                  "pub": [
                    10,
                    "Apr"
                  ],
                  "published": "2020-04-12T01:06:14+03:00",
                  "modified": "2020-04-12T01:16:53+03:00"
                },
                "preload": false,
                "prerender": true,
                "precache-order": false,
                "precache-proximity": true,
                "recursive": true
              },
              "path": "/fi/kristinusko",
              "id": "_fi_kristinusko",
              "component": () => Promise.resolve().then(function () { return kristinusko; }).then(m => m.default)
            },
            {
              "isFile": true,
              "isDir": false,
              "file": "kuolema.md",
              "filepath": "/fi/kuolema.md",
              "name": "kuolema",
              "ext": "md",
              "badExt": false,
              "absolutePath": "/home/timo/Github/Death/src/pages/fi/kuolema.md",
              "importPath": "../src/pages/fi/kuolema.md",
              "isLayout": false,
              "isReset": false,
              "isIndex": false,
              "isFallback": false,
              "isPage": true,
              "ownMeta": {},
              "meta": {
                "frontmatter": {
                  "title": "Mikä on kuolema?",
                  "summary": "Kuolema odottaa meitä kaikkia, mutta mitä meille oikeasti tapahtuu kuollessa ja voiko kuollutta herättää henkiin? Voiko uskonnot tarjota meille ikuista elämää?",
                  "layout": "article",
                  "language": "fi",
                  "pub": [
                    10,
                    "Apr"
                  ],
                  "published": "2020-04-10T01:06:14+03:00",
                  "modified": "2020-04-10T01:16:53+03:00"
                },
                "preload": false,
                "prerender": true,
                "precache-order": false,
                "precache-proximity": true,
                "recursive": true
              },
              "path": "/fi/kuolema",
              "id": "_fi_kuolema",
              "component": () => Promise.resolve().then(function () { return kuolema; }).then(m => m.default)
            }
          ],
          "isLayout": false,
          "isReset": false,
          "isIndex": false,
          "isFallback": false,
          "isPage": false,
          "ownMeta": {},
          "meta": {
            "preload": false,
            "prerender": true,
            "precache-order": false,
            "precache-proximity": true,
            "recursive": true
          },
          "path": "/fi"
        },
        {
          "isFile": true,
          "isDir": false,
          "file": "index.svelte",
          "filepath": "/index.svelte",
          "name": "index",
          "ext": "svelte",
          "badExt": false,
          "absolutePath": "/home/timo/Github/Death/src/pages/index.svelte",
          "importPath": "../src/pages/index.svelte",
          "isLayout": false,
          "isReset": false,
          "isIndex": true,
          "isFallback": false,
          "isPage": true,
          "ownMeta": {},
          "meta": {
            "preload": false,
            "prerender": true,
            "precache-order": false,
            "precache-proximity": true,
            "recursive": true
          },
          "path": "/index",
          "id": "_index",
          "component": () => Promise.resolve().then(function () { return index$1; }).then(m => m.default)
        },
        {
          "isFile": true,
          "isDir": false,
          "file": "is-death-reversible.md",
          "filepath": "/is-death-reversible.md",
          "name": "is-death-reversible",
          "ext": "md",
          "badExt": false,
          "absolutePath": "/home/timo/Github/Death/src/pages/is-death-reversible.md",
          "importPath": "../src/pages/is-death-reversible.md",
          "isLayout": false,
          "isReset": false,
          "isIndex": false,
          "isFallback": false,
          "isPage": true,
          "ownMeta": {},
          "meta": {
            "frontmatter": {
              "title": "A Study of Death",
              "summary": "A study of death; what happens in death and what different religions promise after death. Is there life after death?",
              "layout": "article",
              "language": "en"
            },
            "preload": false,
            "prerender": true,
            "precache-order": false,
            "precache-proximity": true,
            "recursive": true
          },
          "path": "/is-death-reversible",
          "id": "_isDeathReversible",
          "component": () => Promise.resolve().then(function () { return isDeathReversible; }).then(m => m.default)
        }
      ],
      "isLayout": false,
      "isReset": false,
      "isIndex": false,
      "isFallback": false,
      "meta": {
        "preload": false,
        "prerender": true,
        "precache-order": false,
        "precache-proximity": true,
        "recursive": true
      },
      "path": "/"
    };


    const {tree, routes: routes$1} = buildClientTree(_tree);

    /* src/App.svelte generated by Svelte v3.31.0 */

    function create_fragment$3(ctx) {
    	let router;
    	let current;
    	router = new Router({ props: { routes: routes$1 }, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(router.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(router, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Router, routes: routes$1 });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }
    App.$compile = {"vars":[{"name":"Router","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"routes","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false}]};

    const app = HMR(App, { target: document.body }, 'routify-app');

    /* src/pages/_fallback.svelte generated by Svelte v3.31.0 */
    const file$2 = "src/pages/_fallback.svelte";

    function create_fragment$4(ctx) {
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let t2;
    	let a;
    	let t3;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "404";
    			t1 = space();
    			div1 = element("div");
    			t2 = text("Page not found. \n  \n  ");
    			a = element("a");
    			t3 = text("Go back");
    			attr_dev(div0, "class", "huge svelte-viq1pm");
    			add_location(div0, file$2, 18, 2, 268);
    			attr_dev(a, "href", a_href_value = /*$url*/ ctx[0]("../"));
    			add_location(a, file$2, 21, 2, 391);
    			attr_dev(div1, "class", "big");
    			add_location(div1, file$2, 19, 2, 298);
    			attr_dev(div2, "class", "e404 svelte-viq1pm");
    			add_location(div2, file$2, 17, 0, 247);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, t2);
    			append_dev(div1, a);
    			append_dev(a, t3);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$url*/ 1 && a_href_value !== (a_href_value = /*$url*/ ctx[0]("../"))) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $url;
    	validate_store(url, "url");
    	component_subscribe($$self, url, $$value => $$invalidate(0, $url = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Fallback", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Fallback> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ url, $url });
    	return [$url];
    }

    class Fallback extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Fallback",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }
    Fallback.$compile = {"vars":[{"name":"url","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"$url","export_name":null,"injected":true,"module":false,"mutated":true,"reassigned":false,"referenced":true,"writable":true,"referenced_from_script":false}]};

    var _fallback = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': Fallback
    });

    const lang = writable("en");

    const Nav = {
    	"en": [
    		{
    			"name": "Home",
    			"path": "/"
    		}, {
    			"name": "Definition",
    			"path": "/definition"
    		}, {
    			"name": "Promises of religions",
    			"path": "/religions",
    			"items": [
    				{
    					"name": "Christianity",
    					"path": "/christianity"
    				}
    			]
    		}, {
    			"name": "Couses of deaths",
    			"path": "/couses"
    		}, {
    			"name": "Suomeksi",
    			"path": "/fi"
    		}
    	],
    	"fi": [
    		{
    			"name": "Etusivu",
    			"path": "/fi"
    		}, {
    			"name": "Määritelmä",
    			"path": "/fi/maaritelma"
    		}, {
    			"name": "Uskontojen lupaukset",
    			"path": "/uskonnot",
    			"items": [
    				{
    					"name": "Kristinusko",
    					"path": "/kristinusko"
    				}
    			]
    		}, {
    			"name": "Kuolinsyy",
    			"path": "/syyt"
    		}, {
    			"name": "English",
    			"path": "/"
    		}
    	]
    };

    /* src/pages/_layout.svelte generated by Svelte v3.31.0 */
    const file$3 = "src/pages/_layout.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[25] = list[i];
    	return child_ctx;
    }

    // (37:498) {:else}
    function create_else_block(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M24 3.752l-4.423-3.752-7.771 9.039-7.647-9.008-4.159 4.278c2.285 2.885 5.284 5.903 8.362 8.708l-8.165 9.447 1.343 1.487c1.978-1.335 5.981-4.373 10.205-7.958 4.304 3.67 8.306 6.663 10.229 8.006l1.449-1.278-8.254-9.724c3.287-2.973 6.584-6.354 8.831-9.245z");
    			add_location(path, file$3, 36, 588, 1519);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			add_location(svg, file$3, 36, 505, 1436);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(37:498) {:else}",
    		ctx
    	});

    	return block;
    }

    // (37:148) {#if !active}
    function create_if_block_2$1(ctx) {
    	let svg;
    	let title;
    	let t0;
    	let desc;
    	let t1;
    	let rect0;
    	let rect1;
    	let rect2;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			title = svg_element("title");
    			t0 = text("Open or close navigation");
    			desc = svg_element("desc");
    			t1 = text("Pressing the button in the mobile version opens the main navigation menu. Pressing again closes the menu.");
    			rect0 = svg_element("rect");
    			rect1 = svg_element("rect");
    			rect2 = svg_element("rect");
    			add_location(title, file$3, 36, 210, 1141);
    			add_location(desc, file$3, 36, 249, 1180);
    			attr_dev(rect0, "width", "100");
    			attr_dev(rect0, "height", "20");
    			add_location(rect0, file$3, 36, 367, 1298);
    			attr_dev(rect1, "y", "30");
    			attr_dev(rect1, "width", "100");
    			attr_dev(rect1, "height", "20");
    			add_location(rect1, file$3, 36, 404, 1335);
    			attr_dev(rect2, "y", "60");
    			attr_dev(rect2, "width", "100");
    			attr_dev(rect2, "height", "20");
    			add_location(rect2, file$3, 36, 448, 1379);
    			attr_dev(svg, "viewBox", "0 0 100 80");
    			attr_dev(svg, "width", "30");
    			attr_dev(svg, "height", "30");
    			add_location(svg, file$3, 36, 161, 1092);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, title);
    			append_dev(title, t0);
    			append_dev(svg, desc);
    			append_dev(desc, t1);
    			append_dev(svg, rect0);
    			append_dev(svg, rect1);
    			append_dev(svg, rect2);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(37:148) {#if !active}",
    		ctx
    	});

    	return block;
    }

    // (39:1) {#if Nav[$lang]}
    function create_if_block_1$1(ctx) {
    	let nav;
    	let ul;
    	let each_value = Nav[/*$lang*/ ctx[0]];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul, "class", "block");
    			add_location(ul, file$3, 39, 76, 1901);
    			attr_dev(nav, "id", "menu");
    			attr_dev(nav, "class", "bgb cell");
    			toggle_class(nav, "hidden", !/*active*/ ctx[1]);
    			toggle_class(nav, "grid", /*active*/ ctx[1]);
    			add_location(nav, file$3, 39, 1, 1826);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$url, Nav, $lang, $isActive, active*/ 771) {
    				each_value = Nav[/*$lang*/ ctx[0]];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*active*/ 2) {
    				toggle_class(nav, "hidden", !/*active*/ ctx[1]);
    			}

    			if (dirty & /*active*/ 2) {
    				toggle_class(nav, "grid", /*active*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(39:1) {#if Nav[$lang]}",
    		ctx
    	});

    	return block;
    }

    // (40:94) {#each Nav[$lang] as item}
    function create_each_block$2(ctx) {
    	let li;
    	let a;
    	let t_value = /*item*/ ctx[25].name + "";
    	let t;
    	let a_href_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "class", "block");
    			attr_dev(a, "href", a_href_value = /*$url*/ ctx[8](/*item*/ ctx[25].path));
    			attr_dev(a, "hreflang", /*$lang*/ ctx[0]);
    			toggle_class(a, "active", /*$isActive*/ ctx[9](/*item*/ ctx[25].path));
    			add_location(a, file$3, 39, 124, 1949);
    			add_location(li, file$3, 39, 120, 1945);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*click_handler_1*/ ctx[15], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$lang*/ 1 && t_value !== (t_value = /*item*/ ctx[25].name + "")) set_data_dev(t, t_value);

    			if (dirty & /*$url, $lang*/ 257 && a_href_value !== (a_href_value = /*$url*/ ctx[8](/*item*/ ctx[25].path))) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*$lang*/ 1) {
    				attr_dev(a, "hreflang", /*$lang*/ ctx[0]);
    			}

    			if (dirty & /*$isActive, Nav, $lang*/ 513) {
    				toggle_class(a, "active", /*$isActive*/ ctx[9](/*item*/ ctx[25].path));
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(40:94) {#each Nav[$lang] as item}",
    		ctx
    	});

    	return block;
    }

    // (51:1) {#if help}
    function create_if_block$2(ctx) {
    	let div;
    	let h3;
    	let t1;
    	let button0;
    	let t3;
    	let button1;
    	let t5;
    	let button2;
    	let t7;
    	let button3;
    	let t9;
    	let button4;
    	let t11;
    	let button5;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			h3.textContent = "Accessibility";
    			t1 = space();
    			button0 = element("button");
    			button0.textContent = "Increase Text";
    			t3 = space();
    			button1 = element("button");
    			button1.textContent = "Decrease Text";
    			t5 = space();
    			button2 = element("button");
    			button2.textContent = "High Contrast";
    			t7 = space();
    			button3 = element("button");
    			button3.textContent = "Negative Contrast";
    			t9 = space();
    			button4 = element("button");
    			button4.textContent = "Light Background";
    			t11 = space();
    			button5 = element("button");
    			button5.textContent = "Reset";
    			add_location(h3, file$3, 52, 3, 3293);
    			attr_dev(button0, "data-message", "Increase font size");
    			add_location(button0, file$3, 53, 3, 3319);
    			attr_dev(button1, "data-message", "Decrease font size");
    			add_location(button1, file$3, 54, 3, 3415);
    			attr_dev(button2, "data-message", "Change colors to high contrast - black, white and blue");
    			add_location(button2, file$3, 55, 3, 3511);
    			attr_dev(button3, "data-message", "Change colors to negative contrast - black, white and yellow");
    			add_location(button3, file$3, 56, 3, 3651);
    			attr_dev(button4, "data-message", "Change background to white and text to black");
    			add_location(button4, file$3, 57, 3, 3800);
    			attr_dev(button5, "data-message", "Reset all accessibility choices");
    			add_location(button5, file$3, 58, 3, 3928);
    			attr_dev(div, "id", "helpers");
    			attr_dev(div, "class", "abs bgw");
    			add_location(div, file$3, 51, 2, 3255);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			append_dev(div, t1);
    			append_dev(div, button0);
    			append_dev(div, t3);
    			append_dev(div, button1);
    			append_dev(div, t5);
    			append_dev(div, button2);
    			append_dev(div, t7);
    			append_dev(div, button3);
    			append_dev(div, t9);
    			append_dev(div, button4);
    			append_dev(div, t11);
    			append_dev(div, button5);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_3*/ ctx[17], false, false, false),
    					listen_dev(button1, "click", /*click_handler_4*/ ctx[18], false, false, false),
    					listen_dev(button2, "click", /*click_handler_5*/ ctx[19], false, false, false),
    					listen_dev(button3, "click", /*click_handler_6*/ ctx[20], false, false, false),
    					listen_dev(button4, "click", /*click_handler_7*/ ctx[21], false, false, false),
    					listen_dev(button5, "click", /*click_handler_8*/ ctx[22], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(51:1) {#if help}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let header;
    	let div0;
    	let a;
    	let t0;
    	let t1;
    	let button0;
    	let t2;
    	let t3;
    	let main;
    	let main_style_value;
    	let t4;
    	let div1;
    	let button1;
    	let svg;
    	let title;
    	let t5;
    	let path;
    	let t6;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (!/*active*/ ctx[1]) return create_if_block_2$1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = Nav[/*$lang*/ ctx[0]] && create_if_block_1$1(ctx);
    	const default_slot_template = /*#slots*/ ctx[13].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[12], null);
    	let if_block2 = /*help*/ ctx[2] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			header = element("header");
    			div0 = element("div");
    			a = element("a");
    			t0 = text(/*logoTitle*/ ctx[4]);
    			t1 = space();
    			button0 = element("button");
    			if_block0.c();
    			t2 = space();
    			if (if_block1) if_block1.c();
    			t3 = space();
    			main = element("main");
    			if (default_slot) default_slot.c();
    			t4 = space();
    			div1 = element("div");
    			button1 = element("button");
    			svg = svg_element("svg");
    			title = svg_element("title");
    			t5 = text("Accessibility Tools");
    			path = svg_element("path");
    			t6 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(a, "class", "block");
    			attr_dev(a, "href", /*logoUrl*/ ctx[6]);
    			attr_dev(a, "title", /*logoAlt*/ ctx[5]);
    			attr_dev(a, "hreflang", /*$lang*/ ctx[0]);
    			add_location(a, file$3, 34, 27, 843);
    			attr_dev(div0, "id", "logo");
    			attr_dev(div0, "class", "up");
    			add_location(div0, file$3, 34, 1, 817);
    			attr_dev(button0, "id", "openMenu");
    			attr_dev(button0, "class", "toggle");
    			attr_dev(button0, "title", "Open/close main navigation");
    			toggle_class(button0, "open", /*active*/ ctx[1]);
    			toggle_class(button0, "bgw", !/*active*/ ctx[1]);
    			add_location(button0, file$3, 36, 1, 932);
    			attr_dev(header, "class", "bgb noUnd");
    			add_location(header, file$3, 32, 0, 788);
    			attr_dev(main, "id", "hello");
    			attr_dev(main, "class", /*effect*/ ctx[3]);
    			attr_dev(main, "style", main_style_value = "font-size:" + /*font*/ ctx[7] + "px");
    			add_location(main, file$3, 44, 0, 2135);
    			add_location(title, file$3, 48, 191, 2446);
    			attr_dev(path, "d", "M12 0c6.623 0 12 5.377 12 12s-5.377 12-12 12-12-5.377-12-12 5.377-12 12-12m0 2c5.52 0 10 4.481 10 10 0 5.52-4.48 10-10 10-5.519 0-10-4.48-10-10 0-5.519 4.481-10 10-10m0 1c4.967 0 9 4.033 9 9s-4.033 9-9 9-9-4.033-9-9 4.033-9 9-9m-.011 11.5c-.474.006-.765.448-.989.804-.483.767-1.005 1.58-1.455 2.264-.155.238-.325.43-.609.432-.285.002-.526-.343-.389-.632.366-.769 1.953-3.539 1.953-5.868 0-.806-.429-1-1-1h-2c-.276 0-.5-.224-.5-.5s.224-.5.5-.5h9c.276 0 .5.224.5.5s-.224.5-.5.5h-2c-.57 0-1 .194-1 1 0 2.329 1.587 5.099 1.953 5.868.137.289-.103.634-.389.632-.284-.002-.454-.194-.609-.432-.45-.684-.973-1.497-1.455-2.264-.226-.359-.52-.806-1-.804h-.011zm.011-8.5c.828 0 1.5.672 1.5 1.5s-.672 1.5-1.5 1.5-1.5-.672-1.5-1.5.672-1.5 1.5-1.5");
    			add_location(path, file$3, 48, 225, 2480);
    			attr_dev(svg, "width", "38");
    			attr_dev(svg, "height", "38");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill-rule", "evenodd");
    			attr_dev(svg, "clip-rule", "evenodd");
    			add_location(svg, file$3, 48, 68, 2323);
    			attr_dev(button1, "id", "helper");
    			attr_dev(button1, "class", "abs bgw");
    			add_location(button1, file$3, 48, 1, 2256);
    			attr_dev(div1, "id", "helpMe");
    			toggle_class(div1, "active", /*help*/ ctx[2]);
    			add_location(div1, file$3, 46, 0, 2216);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, div0);
    			append_dev(div0, a);
    			append_dev(a, t0);
    			append_dev(header, t1);
    			append_dev(header, button0);
    			if_block0.m(button0, null);
    			append_dev(header, t2);
    			if (if_block1) if_block1.m(header, null);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, main, anchor);

    			if (default_slot) {
    				default_slot.m(main, null);
    			}

    			insert_dev(target, t4, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, button1);
    			append_dev(button1, svg);
    			append_dev(svg, title);
    			append_dev(title, t5);
    			append_dev(svg, path);
    			append_dev(div1, t6);
    			if (if_block2) if_block2.m(div1, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[14], false, false, false),
    					listen_dev(button1, "click", /*click_handler_2*/ ctx[16], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*logoTitle*/ 16) set_data_dev(t0, /*logoTitle*/ ctx[4]);

    			if (!current || dirty & /*logoUrl*/ 64) {
    				attr_dev(a, "href", /*logoUrl*/ ctx[6]);
    			}

    			if (!current || dirty & /*logoAlt*/ 32) {
    				attr_dev(a, "title", /*logoAlt*/ ctx[5]);
    			}

    			if (!current || dirty & /*$lang*/ 1) {
    				attr_dev(a, "hreflang", /*$lang*/ ctx[0]);
    			}

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(button0, null);
    				}
    			}

    			if (dirty & /*active*/ 2) {
    				toggle_class(button0, "open", /*active*/ ctx[1]);
    			}

    			if (dirty & /*active*/ 2) {
    				toggle_class(button0, "bgw", !/*active*/ ctx[1]);
    			}

    			if (Nav[/*$lang*/ ctx[0]]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1$1(ctx);
    					if_block1.c();
    					if_block1.m(header, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 4096) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[12], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*effect*/ 8) {
    				attr_dev(main, "class", /*effect*/ ctx[3]);
    			}

    			if (!current || dirty & /*font*/ 128 && main_style_value !== (main_style_value = "font-size:" + /*font*/ ctx[7] + "px")) {
    				attr_dev(main, "style", main_style_value);
    			}

    			if (/*help*/ ctx[2]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block$2(ctx);
    					if_block2.c();
    					if_block2.m(div1, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (dirty & /*help*/ 4) {
    				toggle_class(div1, "active", /*help*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			if_block0.d();
    			if (if_block1) if_block1.d();
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(main);
    			if (default_slot) default_slot.d(detaching);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div1);
    			if (if_block2) if_block2.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $page;
    	let $lang;
    	let $url;
    	let $isActive;
    	validate_store(page, "page");
    	component_subscribe($$self, page, $$value => $$invalidate(11, $page = $$value));
    	validate_store(lang, "lang");
    	component_subscribe($$self, lang, $$value => $$invalidate(0, $lang = $$value));
    	validate_store(url, "url");
    	component_subscribe($$self, url, $$value => $$invalidate(8, $url = $$value));
    	validate_store(isActive, "isActive");
    	component_subscribe($$self, isActive, $$value => $$invalidate(9, $isActive = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Layout", slots, ['default']);
    	let active, help, effect, logoTitle, logoAlt, logoUrl;
    	let font = 18;
    	let styleHigh = "dark high";

    	function effects(i) {
    		if (i == "reset") {
    			$$invalidate(3, effect = "");
    			$$invalidate(7, font = 18);
    		} else if (effect && effect.includes(i)) $$invalidate(3, effect = ""); else $$invalidate(3, effect = "effect " + i);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Layout> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(1, active = !active);
    	const click_handler_1 = () => $$invalidate(1, active = !active);
    	const click_handler_2 = () => $$invalidate(2, help = !help);
    	const click_handler_3 = () => $$invalidate(7, font += 1);
    	const click_handler_4 = () => $$invalidate(7, font -= 1);
    	const click_handler_5 = e => effects("high bgd");
    	const click_handler_6 = e => effects("neg bgd");
    	const click_handler_7 = e => effects("bgw");
    	const click_handler_8 = e => effects("reset");

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(12, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		isActive,
    		url,
    		page,
    		metatags,
    		lang,
    		Nav,
    		active,
    		help,
    		effect,
    		logoTitle,
    		logoAlt,
    		logoUrl,
    		font,
    		styleHigh,
    		effects,
    		$page,
    		$lang,
    		$url,
    		$isActive
    	});

    	$$self.$inject_state = $$props => {
    		if ("active" in $$props) $$invalidate(1, active = $$props.active);
    		if ("help" in $$props) $$invalidate(2, help = $$props.help);
    		if ("effect" in $$props) $$invalidate(3, effect = $$props.effect);
    		if ("logoTitle" in $$props) $$invalidate(4, logoTitle = $$props.logoTitle);
    		if ("logoAlt" in $$props) $$invalidate(5, logoAlt = $$props.logoAlt);
    		if ("logoUrl" in $$props) $$invalidate(6, logoUrl = $$props.logoUrl);
    		if ("font" in $$props) $$invalidate(7, font = $$props.font);
    		if ("styleHigh" in $$props) styleHigh = $$props.styleHigh;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$page, $lang*/ 2049) {
    			 if ($page.path) {
    				let item = $page.path.split("/");
    				lang.set(item[1]);

    				switch ($lang) {
    					case "fi":
    						$$invalidate(4, logoTitle = "Kuolema");
    						$$invalidate(5, logoAlt = "Tutkimus kuolemasta");
    						$$invalidate(6, logoUrl = "/fi");
    						break;
    					default:
    						$$invalidate(4, logoTitle = "Death");
    						$$invalidate(5, logoAlt = "A study of death");
    						$$invalidate(6, logoUrl = "/");
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*$page*/ 2048) {
    			 metatags.canonical = "https://aboutdeath.net" + $page.__file.shortPath;
    		}
    	};

    	return [
    		$lang,
    		active,
    		help,
    		effect,
    		logoTitle,
    		logoAlt,
    		logoUrl,
    		font,
    		$url,
    		$isActive,
    		effects,
    		$page,
    		$$scope,
    		slots,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7,
    		click_handler_8
    	];
    }

    class Layout extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Layout",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }
    Layout.$compile = {"vars":[{"name":"isActive","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"url","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"page","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":true},{"name":"metatags","export_name":null,"injected":false,"module":false,"mutated":true,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"lang","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":true},{"name":"Nav","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"active","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":true,"referenced":true,"writable":true,"referenced_from_script":false},{"name":"help","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":true,"referenced":true,"writable":true,"referenced_from_script":false},{"name":"effect","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":true,"referenced":true,"writable":true,"referenced_from_script":true},{"name":"logoTitle","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":true,"referenced":true,"writable":true,"referenced_from_script":true},{"name":"logoAlt","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":true,"referenced":true,"writable":true,"referenced_from_script":true},{"name":"logoUrl","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":true,"referenced":true,"writable":true,"referenced_from_script":true},{"name":"font","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":true,"referenced":true,"writable":true,"referenced_from_script":true},{"name":"styleHigh","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":true,"referenced_from_script":false},{"name":"effects","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"$page","export_name":null,"injected":true,"module":false,"mutated":true,"reassigned":false,"referenced":false,"writable":true,"referenced_from_script":false},{"name":"$lang","export_name":null,"injected":true,"module":false,"mutated":true,"reassigned":false,"referenced":true,"writable":true,"referenced_from_script":false},{"name":"$url","export_name":null,"injected":true,"module":false,"mutated":true,"reassigned":false,"referenced":true,"writable":true,"referenced_from_script":false},{"name":"$isActive","export_name":null,"injected":true,"module":false,"mutated":true,"reassigned":false,"referenced":true,"writable":true,"referenced_from_script":false}]};

    var _layout = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': Layout
    });

    /* src/components/Article.svelte generated by Svelte v3.31.0 */
    const file$4 = "src/components/Article.svelte";

    function create_fragment$6(ctx) {
    	let article;
    	let div1;
    	let div0;
    	let h1;
    	let t0;
    	let t1;
    	let p;
    	let t2;
    	let t3;
    	let div3;
    	let div2;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			article = element("article");
    			div1 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			t0 = text(/*title*/ ctx[0]);
    			t1 = space();
    			p = element("p");
    			t2 = text(/*summary*/ ctx[1]);
    			t3 = space();
    			div3 = element("div");
    			div2 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(h1, "id", "title");
    			attr_dev(h1, "itemprop", "headline");
    			add_location(h1, file$4, 14, 3, 423);
    			attr_dev(p, "class", "summary mxa");
    			attr_dev(p, "itemprop", "description");
    			add_location(p, file$4, 15, 3, 474);
    			attr_dev(div0, "class", "container mxa");
    			add_location(div0, file$4, 13, 2, 392);
    			attr_dev(div1, "id", "about");
    			attr_dev(div1, "class", "bgw pad");
    			add_location(div1, file$4, 12, 1, 357);
    			attr_dev(div2, "class", "container mxa");
    			add_location(div2, file$4, 19, 58, 613);
    			attr_dev(div3, "id", "content");
    			attr_dev(div3, "class", "bgb pad");
    			attr_dev(div3, "itemprop", "articleBody");
    			add_location(div3, file$4, 19, 1, 556);
    			attr_dev(article, "itemscope", "");
    			attr_dev(article, "itemtype", "http://schema.org/NewsArticle");
    			add_location(article, file$4, 10, 0, 294);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, div1);
    			append_dev(div1, div0);
    			append_dev(div0, h1);
    			append_dev(h1, t0);
    			append_dev(div0, t1);
    			append_dev(div0, p);
    			append_dev(p, t2);
    			append_dev(article, t3);
    			append_dev(article, div3);
    			append_dev(div3, div2);

    			if (default_slot) {
    				default_slot.m(div2, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*title*/ 1) set_data_dev(t0, /*title*/ ctx[0]);
    			if (!current || dirty & /*summary*/ 2) set_data_dev(t2, /*summary*/ ctx[1]);

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 4) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[2], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Article", slots, ['default']);
    	let { title } = $$props, { summary } = $$props;
    	const writable_props = ["title", "summary"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Article> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("summary" in $$props) $$invalidate(1, summary = $$props.summary);
    		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ metatags, title, summary });

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("summary" in $$props) $$invalidate(1, summary = $$props.summary);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*title*/ 1) {
    			 metatags.title = title;
    		}

    		if ($$self.$$.dirty & /*summary*/ 2) {
    			 metatags.description = summary;
    		}

    		if ($$self.$$.dirty & /*title*/ 1) {
    			 metatags["twitter:title"] = title;
    		}

    		if ($$self.$$.dirty & /*summary*/ 2) {
    			 metatags["twitter:description"] = summary;
    		}
    	};

    	 metatags.author = "Timo Anttila <moro@tuspe.com>";
    	return [title, summary, $$scope, slots];
    }

    class Article extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { title: 0, summary: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Article",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*title*/ ctx[0] === undefined && !("title" in props)) {
    			console.warn("<Article> was created without expected prop 'title'");
    		}

    		if (/*summary*/ ctx[1] === undefined && !("summary" in props)) {
    			console.warn("<Article> was created without expected prop 'summary'");
    		}
    	}

    	get title() {
    		throw new Error("<Article>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Article>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get summary() {
    		throw new Error("<Article>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set summary(value) {
    		throw new Error("<Article>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }
    Article.$compile = {"vars":[{"name":"metatags","export_name":null,"injected":false,"module":false,"mutated":true,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"title","export_name":"title","injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":true,"referenced_from_script":true},{"name":"summary","export_name":"summary","injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":true,"referenced_from_script":true}]};

    /* src/pages/christianity.md generated by Svelte v3.31.0 */
    const file$5 = "src/pages/christianity.md";

    // (10:0) <Layout_MDSVEX_DEFAULT {...metadata}>
    function create_default_slot$1(ctx) {
    	let h20;
    	let t1;
    	let p0;
    	let a0;
    	let t3;
    	let h21;
    	let t5;
    	let p1;
    	let t6;
    	let br0;
    	let t7;
    	let br1;
    	let t8;
    	let t9;
    	let h22;
    	let t11;
    	let p2;
    	let t13;
    	let p3;
    	let t15;
    	let ul0;
    	let li0;
    	let t17;
    	let li1;
    	let t18;
    	let a1;
    	let t20;
    	let li2;
    	let t21;
    	let a2;
    	let t23;
    	let t24;
    	let li3;
    	let t25;
    	let a3;
    	let t27;
    	let t28;
    	let li4;
    	let t30;
    	let li5;
    	let t31;
    	let a4;
    	let t33;
    	let t34;
    	let h23;
    	let t36;
    	let ul1;
    	let li6;
    	let t38;
    	let li7;
    	let t39;
    	let a5;
    	let t41;
    	let t42;
    	let li8;
    	let t44;
    	let li9;
    	let t46;
    	let li10;
    	let t47;
    	let a6;
    	let t49;
    	let a7;
    	let t51;
    	let li11;
    	let t53;
    	let li12;
    	let t54;
    	let a8;
    	let t56;
    	let t57;
    	let h24;
    	let t59;
    	let ul2;
    	let li13;
    	let t61;
    	let li14;
    	let t63;
    	let li15;
    	let t65;
    	let li16;
    	let t67;
    	let h25;
    	let t69;
    	let ul3;
    	let li17;
    	let t71;
    	let h26;
    	let t73;
    	let ul4;
    	let li18;
    	let a9;
    	let t75;
    	let li19;
    	let a10;
    	let t77;
    	let h27;
    	let t79;
    	let ul5;
    	let li20;
    	let a11;
    	let t81;
    	let li21;
    	let a12;
    	let t83;
    	let li22;
    	let a13;
    	let t85;
    	let li23;
    	let a14;
    	let t87;
    	let li24;
    	let a15;
    	let t89;
    	let li25;
    	let a16;
    	let t91;
    	let li26;
    	let a17;

    	const block = {
    		c: function create() {
    			h20 = element("h2");
    			h20.textContent = "Paikkakunta:";
    			t1 = space();
    			p0 = element("p");
    			a0 = element("a");
    			a0.textContent = "Nokia";
    			t3 = space();
    			h21 = element("h2");
    			h21.textContent = "Tittelit:";
    			t5 = space();
    			p1 = element("p");
    			t6 = text("Hallituksen puheenjohtaja");
    			br0 = element("br");
    			t7 = text("\nToimitusjohtaja");
    			br1 = element("br");
    			t8 = text("\nTeknologiajohtaja");
    			t9 = space();
    			h22 = element("h2");
    			h22.textContent = "Työelämä:";
    			t11 = space();
    			p2 = element("p");
    			p2.textContent = "Täyden palvelun verkkokehittäjä, joka haluaa intohimoisesti tehdä verkkopalveluista parempia, nopeampia ja helpompia käyttää. Tekniikoita, joiden kanssa nautin työskennellä, ovat JavaScript, Svelte, PHP, NodeJS ja MariaDB. Käytän yleensä sisällönhallintaan ProcessWireä, mutta tuttuja alustoja ovat myös WordPress ja Drupal. Rakastan työtäni ja haluan kehittää osaamistani joka päivä. Aina löytyy jotain uutta ja mielenkiintoista tutkittavaa.";
    			t13 = space();
    			p3 = element("p");
    			p3.textContent = "Projekteja tehdessä haluaisin aina ylittää asiakkaan odotukset ja tiedän onnistuneeni, asiakkaan tuntiessa saavansa enemmän kuin alunperin tilasi.";
    			t15 = space();
    			ul0 = element("ul");
    			li0 = element("li");
    			li0.textContent = "Suunnittelen ja kehitän kokemuksia mitkä tekevät ihmisten elämästä helpompaa. Tärkeimpänä aina yksinkertaisuus, nopeus, käytettävyys ja helppo päivitys.";
    			t17 = space();
    			li1 = element("li");
    			t18 = text("Toimitusjohtaja ja täyden palvelun devaaja digitoimistossa ");
    			a1 = element("a");
    			a1.textContent = "Tuspe Design Oy";
    			t20 = space();
    			li2 = element("li");
    			t21 = text("Aktiivinen alihankkija digitoimistolle ");
    			a2 = element("a");
    			a2.textContent = "Molentum Oy";
    			t23 = text(".");
    			t24 = space();
    			li3 = element("li");
    			t25 = text("Teknologiajohtaja ja hallituksen puheenjohtaja yrityksessä ");
    			a3 = element("a");
    			a3.textContent = "Ratsukko Solutions Oy";
    			t27 = text(".");
    			t28 = space();
    			li4 = element("li");
    			li4.textContent = "Ylläpidän viittä palvelinta ja olen vastuussa asiakkaiden verkkopalveluiden turvallisuudesta.";
    			t30 = space();
    			li5 = element("li");
    			t31 = text("Sitoutumaton ");
    			a4 = element("a");
    			a4.textContent = "Perussuomalaisten";
    			t33 = text(" kunnallisvaaliehdokas Nokialla.");
    			t34 = space();
    			h23 = element("h2");
    			h23.textContent = "Henkilökohtainen elämä:";
    			t36 = space();
    			ul1 = element("ul");
    			li6 = element("li");
    			li6.textContent = "Kiinnostunut tekoälyn mahdollisuuksista, tekniikan ihmeistä ja ihmisten käyttäytymisestä.";
    			t38 = space();
    			li7 = element("li");
    			t39 = text("Valokuvaan kaikenlaista kaunista ja mielenkiintoista ");
    			a5 = element("a");
    			a5.textContent = "Instagramiin";
    			t41 = text(".");
    			t42 = space();
    			li8 = element("li");
    			li8.textContent = "Ylpeä isä kahdelle lemmikille.";
    			t44 = space();
    			li9 = element("li");
    			li9.textContent = "Rakastan luontoa.";
    			t46 = space();
    			li10 = element("li");
    			t47 = text("Vapaaehtoisena: ");
    			a6 = element("a");
    			a6.textContent = "Plan International Finland";
    			t49 = text(", ");
    			a7 = element("a");
    			a7.textContent = "Best Buddies";
    			t51 = space();
    			li11 = element("li");
    			li11.textContent = "Aktiivinen vierailija ja vapaaehtoinen monissa tapahtumissa.";
    			t53 = space();
    			li12 = element("li");
    			t54 = text("Sijoitan aktiivisesti osakkeisiin ja rahastoihin (");
    			a8 = element("a");
    			a8.textContent = "Shareville";
    			t56 = text(").");
    			t57 = space();
    			h24 = element("h2");
    			h24.textContent = "Teknologiat / työkalut:";
    			t59 = space();
    			ul2 = element("ul");
    			li13 = element("li");
    			li13.textContent = "HTML, CSS, JavaScript, Svelte, JQuery";
    			t61 = space();
    			li14 = element("li");
    			li14.textContent = "PHP, SQL, NodeJS, Express";
    			t63 = space();
    			li15 = element("li");
    			li15.textContent = "ProcessWire, Drupal, Wordpress";
    			t65 = space();
    			li16 = element("li");
    			li16.textContent = "MySQL, MariaDB, SQLite";
    			t67 = space();
    			h25 = element("h2");
    			h25.textContent = "Kielet:";
    			t69 = space();
    			ul3 = element("ul");
    			li17 = element("li");
    			li17.textContent = "Finnish, English";
    			t71 = space();
    			h26 = element("h2");
    			h26.textContent = "Yhteystiedot:";
    			t73 = space();
    			ul4 = element("ul");
    			li18 = element("li");
    			a9 = element("a");
    			a9.textContent = "+358 40 774 6121";
    			t75 = space();
    			li19 = element("li");
    			a10 = element("a");
    			a10.textContent = "moro@tuspe.com";
    			t77 = space();
    			h27 = element("h2");
    			h27.textContent = "Seuraa minua somessa";
    			t79 = space();
    			ul5 = element("ul");
    			li20 = element("li");
    			a11 = element("a");
    			a11.textContent = "https://tuspe.com";
    			t81 = space();
    			li21 = element("li");
    			a12 = element("a");
    			a12.textContent = "https://github.com/timoanttila";
    			t83 = space();
    			li22 = element("li");
    			a13 = element("a");
    			a13.textContent = "https://twitter.com/_timoanttila";
    			t85 = space();
    			li23 = element("li");
    			a14 = element("a");
    			a14.textContent = "https://www.instagram.com/_timoanttila/";
    			t87 = space();
    			li24 = element("li");
    			a15 = element("a");
    			a15.textContent = "https://trakt.tv/users/timoanttila";
    			t89 = space();
    			li25 = element("li");
    			a16 = element("a");
    			a16.textContent = "https://www.linkedin.com/in/anttilatimo/";
    			t91 = space();
    			li26 = element("li");
    			a17 = element("a");
    			a17.textContent = "https://github.com/TuspeDesign";
    			attr_dev(h20, "id", "paikkakunta");
    			add_location(h20, file$5, 10, 0, 659);
    			attr_dev(a0, "href", "https://goo.gl/maps/k437LzVrvYzhUvXV9");
    			attr_dev(a0, "title", "Google Maps");
    			attr_dev(a0, "rel", "nofollow");
    			add_location(a0, file$5, 11, 3, 701);
    			add_location(p0, file$5, 11, 0, 698);
    			attr_dev(h21, "id", "tittelit");
    			add_location(h21, file$5, 16, 0, 805);
    			add_location(br0, file$5, 17, 28, 866);
    			add_location(br1, file$5, 18, 15, 886);
    			add_location(p1, file$5, 17, 0, 838);
    			attr_dev(h22, "id", "työelämä");
    			add_location(h22, file$5, 20, 0, 913);
    			add_location(p2, file$5, 21, 0, 946);
    			add_location(p3, file$5, 22, 0, 1396);
    			add_location(li0, file$5, 24, 0, 1555);
    			attr_dev(a1, "href", "https://tuspe.com/");
    			attr_dev(a1, "title", "Digitoimisto Tuspe Design");
    			attr_dev(a1, "rel", "nofollow");
    			add_location(a1, file$5, 25, 63, 1780);
    			add_location(li1, file$5, 25, 0, 1717);
    			attr_dev(a2, "href", "https://molentum.fi/");
    			attr_dev(a2, "rel", "nofollow");
    			add_location(a2, file$5, 30, 43, 1933);
    			add_location(li2, file$5, 30, 0, 1890);
    			attr_dev(a3, "href", "https://www.ratsukko.com/");
    			attr_dev(a3, "rel", "nofollow");
    			add_location(a3, file$5, 34, 63, 2069);
    			add_location(li3, file$5, 34, 0, 2006);
    			add_location(li4, file$5, 38, 0, 2157);
    			attr_dev(a4, "href", "(https://www.perussuomalaiset.fi/)");
    			add_location(a4, file$5, 39, 17, 2277);
    			add_location(li5, file$5, 39, 0, 2260);
    			add_location(ul0, file$5, 23, 0, 1550);
    			attr_dev(h23, "id", "henkilökohtainen-elämä");
    			add_location(h23, file$5, 41, 0, 2387);
    			add_location(li6, file$5, 43, 0, 2453);
    			attr_dev(a5, "href", "https://www.instagram.com/_timoanttila/");
    			attr_dev(a5, "rel", "nofollow");
    			add_location(a5, file$5, 44, 57, 2609);
    			add_location(li7, file$5, 44, 0, 2552);
    			add_location(li8, file$5, 48, 0, 2702);
    			add_location(li9, file$5, 49, 0, 2742);
    			attr_dev(a6, "href", "https://plan.fi/");
    			attr_dev(a6, "rel", "nofollow");
    			add_location(a6, file$5, 50, 20, 2789);
    			attr_dev(a7, "href", "https://www.tukiliitto.fi/toiminta/best-buddies-kaveritoiminta/");
    			attr_dev(a7, "title", "Best Buddies -kaveritoiminta");
    			attr_dev(a7, "rel", "nofollow");
    			add_location(a7, file$5, 53, 33, 2868);
    			add_location(li10, file$5, 50, 0, 2769);
    			add_location(li11, file$5, 58, 0, 3023);
    			attr_dev(a8, "href", "https://shareville.fi/jasenet/timo-anttila/portfolios");
    			attr_dev(a8, "rel", "nofollow");
    			add_location(a8, file$5, 59, 54, 3147);
    			add_location(li12, file$5, 59, 0, 3093);
    			add_location(ul1, file$5, 42, 0, 2448);
    			attr_dev(h24, "id", "teknologiat--työkalut");
    			add_location(h24, file$5, 64, 0, 3259);
    			add_location(li13, file$5, 66, 0, 3324);
    			add_location(li14, file$5, 67, 0, 3371);
    			add_location(li15, file$5, 68, 0, 3406);
    			add_location(li16, file$5, 69, 0, 3446);
    			add_location(ul2, file$5, 65, 0, 3319);
    			attr_dev(h25, "id", "kielet");
    			add_location(h25, file$5, 71, 0, 3484);
    			add_location(li17, file$5, 73, 0, 3518);
    			add_location(ul3, file$5, 72, 0, 3513);
    			attr_dev(h26, "id", "yhteystiedot");
    			add_location(h26, file$5, 75, 0, 3550);
    			attr_dev(a9, "href", "tel:+358407746121");
    			attr_dev(a9, "rel", "nofollow");
    			add_location(a9, file$5, 77, 4, 3600);
    			add_location(li18, file$5, 77, 0, 3596);
    			attr_dev(a10, "href", "mailto:moro@tuspe.com");
    			attr_dev(a10, "rel", "nofollow");
    			add_location(a10, file$5, 78, 4, 3673);
    			add_location(li19, file$5, 78, 0, 3669);
    			add_location(ul4, file$5, 76, 0, 3591);
    			attr_dev(h27, "id", "seuraa-minua-somessa");
    			add_location(h27, file$5, 80, 0, 3750);
    			attr_dev(a11, "href", "https://tuspe.com");
    			attr_dev(a11, "rel", "nofollow");
    			add_location(a11, file$5, 82, 4, 3815);
    			add_location(li20, file$5, 82, 0, 3811);
    			attr_dev(a12, "href", "https://github.com/timoanttila");
    			attr_dev(a12, "rel", "nofollow");
    			add_location(a12, file$5, 83, 4, 3889);
    			add_location(li21, file$5, 83, 0, 3885);
    			attr_dev(a13, "href", "https://twitter.com/_timoanttila/with_replies");
    			attr_dev(a13, "rel", "nofollow");
    			add_location(a13, file$5, 87, 4, 3994);
    			add_location(li22, file$5, 87, 0, 3990);
    			attr_dev(a14, "href", "https://www.instagram.com/_timoanttila/");
    			attr_dev(a14, "rel", "nofollow");
    			add_location(a14, file$5, 91, 4, 4116);
    			add_location(li23, file$5, 91, 0, 4112);
    			attr_dev(a15, "href", "https://trakt.tv/users/timoanttila");
    			attr_dev(a15, "rel", "nofollow");
    			add_location(a15, file$5, 95, 4, 4239);
    			add_location(li24, file$5, 95, 0, 4235);
    			attr_dev(a16, "href", "https://www.linkedin.com/in/anttilatimo/");
    			attr_dev(a16, "rel", "nofollow");
    			add_location(a16, file$5, 99, 4, 4352);
    			add_location(li25, file$5, 99, 0, 4348);
    			attr_dev(a17, "href", "https://github.com/TuspeDesign");
    			attr_dev(a17, "rel", "nofollow");
    			add_location(a17, file$5, 103, 4, 4477);
    			add_location(li26, file$5, 103, 0, 4473);
    			add_location(ul5, file$5, 81, 0, 3806);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h20, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p0, anchor);
    			append_dev(p0, a0);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, h21, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, t6);
    			append_dev(p1, br0);
    			append_dev(p1, t7);
    			append_dev(p1, br1);
    			append_dev(p1, t8);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, h22, anchor);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, p2, anchor);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, p3, anchor);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, ul0, anchor);
    			append_dev(ul0, li0);
    			append_dev(ul0, t17);
    			append_dev(ul0, li1);
    			append_dev(li1, t18);
    			append_dev(li1, a1);
    			append_dev(ul0, t20);
    			append_dev(ul0, li2);
    			append_dev(li2, t21);
    			append_dev(li2, a2);
    			append_dev(li2, t23);
    			append_dev(ul0, t24);
    			append_dev(ul0, li3);
    			append_dev(li3, t25);
    			append_dev(li3, a3);
    			append_dev(li3, t27);
    			append_dev(ul0, t28);
    			append_dev(ul0, li4);
    			append_dev(ul0, t30);
    			append_dev(ul0, li5);
    			append_dev(li5, t31);
    			append_dev(li5, a4);
    			append_dev(li5, t33);
    			insert_dev(target, t34, anchor);
    			insert_dev(target, h23, anchor);
    			insert_dev(target, t36, anchor);
    			insert_dev(target, ul1, anchor);
    			append_dev(ul1, li6);
    			append_dev(ul1, t38);
    			append_dev(ul1, li7);
    			append_dev(li7, t39);
    			append_dev(li7, a5);
    			append_dev(li7, t41);
    			append_dev(ul1, t42);
    			append_dev(ul1, li8);
    			append_dev(ul1, t44);
    			append_dev(ul1, li9);
    			append_dev(ul1, t46);
    			append_dev(ul1, li10);
    			append_dev(li10, t47);
    			append_dev(li10, a6);
    			append_dev(li10, t49);
    			append_dev(li10, a7);
    			append_dev(ul1, t51);
    			append_dev(ul1, li11);
    			append_dev(ul1, t53);
    			append_dev(ul1, li12);
    			append_dev(li12, t54);
    			append_dev(li12, a8);
    			append_dev(li12, t56);
    			insert_dev(target, t57, anchor);
    			insert_dev(target, h24, anchor);
    			insert_dev(target, t59, anchor);
    			insert_dev(target, ul2, anchor);
    			append_dev(ul2, li13);
    			append_dev(ul2, t61);
    			append_dev(ul2, li14);
    			append_dev(ul2, t63);
    			append_dev(ul2, li15);
    			append_dev(ul2, t65);
    			append_dev(ul2, li16);
    			insert_dev(target, t67, anchor);
    			insert_dev(target, h25, anchor);
    			insert_dev(target, t69, anchor);
    			insert_dev(target, ul3, anchor);
    			append_dev(ul3, li17);
    			insert_dev(target, t71, anchor);
    			insert_dev(target, h26, anchor);
    			insert_dev(target, t73, anchor);
    			insert_dev(target, ul4, anchor);
    			append_dev(ul4, li18);
    			append_dev(li18, a9);
    			append_dev(ul4, t75);
    			append_dev(ul4, li19);
    			append_dev(li19, a10);
    			insert_dev(target, t77, anchor);
    			insert_dev(target, h27, anchor);
    			insert_dev(target, t79, anchor);
    			insert_dev(target, ul5, anchor);
    			append_dev(ul5, li20);
    			append_dev(li20, a11);
    			append_dev(ul5, t81);
    			append_dev(ul5, li21);
    			append_dev(li21, a12);
    			append_dev(ul5, t83);
    			append_dev(ul5, li22);
    			append_dev(li22, a13);
    			append_dev(ul5, t85);
    			append_dev(ul5, li23);
    			append_dev(li23, a14);
    			append_dev(ul5, t87);
    			append_dev(ul5, li24);
    			append_dev(li24, a15);
    			append_dev(ul5, t89);
    			append_dev(ul5, li25);
    			append_dev(li25, a16);
    			append_dev(ul5, t91);
    			append_dev(ul5, li26);
    			append_dev(li26, a17);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h20);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(h21);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(h22);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(p3);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(ul0);
    			if (detaching) detach_dev(t34);
    			if (detaching) detach_dev(h23);
    			if (detaching) detach_dev(t36);
    			if (detaching) detach_dev(ul1);
    			if (detaching) detach_dev(t57);
    			if (detaching) detach_dev(h24);
    			if (detaching) detach_dev(t59);
    			if (detaching) detach_dev(ul2);
    			if (detaching) detach_dev(t67);
    			if (detaching) detach_dev(h25);
    			if (detaching) detach_dev(t69);
    			if (detaching) detach_dev(ul3);
    			if (detaching) detach_dev(t71);
    			if (detaching) detach_dev(h26);
    			if (detaching) detach_dev(t73);
    			if (detaching) detach_dev(ul4);
    			if (detaching) detach_dev(t77);
    			if (detaching) detach_dev(h27);
    			if (detaching) detach_dev(t79);
    			if (detaching) detach_dev(ul5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(10:0) <Layout_MDSVEX_DEFAULT {...metadata}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let layout_mdsvex_default;
    	let current;
    	const layout_mdsvex_default_spread_levels = [metadata];

    	let layout_mdsvex_default_props = {
    		$$slots: { default: [create_default_slot$1] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < layout_mdsvex_default_spread_levels.length; i += 1) {
    		layout_mdsvex_default_props = assign(layout_mdsvex_default_props, layout_mdsvex_default_spread_levels[i]);
    	}

    	layout_mdsvex_default = new Article({
    			props: layout_mdsvex_default_props,
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(layout_mdsvex_default.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(layout_mdsvex_default, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const layout_mdsvex_default_changes = (dirty & /*metadata*/ 0)
    			? get_spread_update(layout_mdsvex_default_spread_levels, [get_spread_object(metadata)])
    			: {};

    			if (dirty & /*$$scope*/ 1) {
    				layout_mdsvex_default_changes.$$scope = { dirty, ctx };
    			}

    			layout_mdsvex_default.$set(layout_mdsvex_default_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(layout_mdsvex_default.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(layout_mdsvex_default.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(layout_mdsvex_default, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const metadata = {
    	"title": "Mitä elämässäni tapahtuu juuri nyt?",
    	"summary": "Tältä sivulta löydät tiivistelmän mihin keskityn ammatillisesti ja henkilökohtaisessa elämässä.",
    	"desc": "Tervetuloa tutustumaan minuun tarkemmin. Tältä sivulta löydät kattavasti kaiken mikä on minulle tärkeää tällä hetkellä ammatillisesti ja henkilökohtaisessa elämässä.",
    	"layout": "article",
    	"img": "timo",
    	"language": "fi"
    };

    const { title, summary, desc, layout: layout$1, img, language } = metadata;

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Christianity", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Christianity> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		metadata,
    		title,
    		summary,
    		desc,
    		layout: layout$1,
    		img,
    		language,
    		Layout_MDSVEX_DEFAULT: Article
    	});

    	return [];
    }

    class Christianity extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Christianity",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }
    Christianity.$compile = {"vars":[{"name":"metadata","export_name":"metadata","injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"title","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"summary","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"desc","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"layout","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"img","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"language","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"Layout_MDSVEX_DEFAULT","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false}]};

    var christianity = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': Christianity,
        metadata: metadata
    });

    /* src/pages/fi/index.svelte generated by Svelte v3.31.0 */
    const file$6 = "src/pages/fi/index.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i].meta;
    	child_ctx[7] = list[i].path;
    	return child_ctx;
    }

    // (21:2) {#each posts as {meta, path}}
    function create_each_block$3(ctx) {
    	let li;
    	let a;
    	let h2;
    	let t0_value = /*meta*/ ctx[6].frontmatter.title + "";
    	let t0;
    	let t1;
    	let p;
    	let t2_value = /*meta*/ ctx[6].frontmatter.summary + "";
    	let t2;
    	let a_href_value;
    	let a_title_value;
    	let a_hreflang_value;
    	let t3;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			h2 = element("h2");
    			t0 = text(t0_value);
    			t1 = space();
    			p = element("p");
    			t2 = text(t2_value);
    			t3 = space();
    			attr_dev(h2, "class", "small darkBlue");
    			add_location(h2, file$6, 23, 5, 1647);
    			attr_dev(p, "class", "desc");
    			add_location(p, file$6, 24, 5, 1709);
    			attr_dev(a, "class", "article grid block");
    			attr_dev(a, "href", a_href_value = /*$url*/ ctx[0](/*path*/ ctx[7]));
    			attr_dev(a, "title", a_title_value = /*meta*/ ctx[6].frontmatter.title);
    			attr_dev(a, "hreflang", a_hreflang_value = /*meta*/ ctx[6].frontmatter.language);
    			add_location(a, file$6, 22, 4, 1525);
    			attr_dev(li, "class", "block");
    			add_location(li, file$6, 21, 3, 1502);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, h2);
    			append_dev(h2, t0);
    			append_dev(a, t1);
    			append_dev(a, p);
    			append_dev(p, t2);
    			append_dev(li, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$url*/ 1 && a_href_value !== (a_href_value = /*$url*/ ctx[0](/*path*/ ctx[7]))) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(21:2) {#each posts as {meta, path}}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div0;
    	let p0;
    	let t1;
    	let p1;
    	let t3;
    	let div1;
    	let ul;
    	let each_value = /*posts*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = "Olen pitkään ollut kiinnostunut kuolemasta. Mietin paljon miten nopeasti aika kuluu ja mitä olen elämässäni saavuttanut.";
    			t1 = space();
    			p1 = element("p");
    			p1.textContent = "On pelottava ajatus, että tämä mahtava koneisto jota kehoksi kutsutaan, voidaan sulkea ja unohtaa kuin vanha tietokone. Mitä enemmän mietin tuota, sitä enemmän halusin tutustua kuolemaan tieteellisesti, henkisesti ja uskonnollisesti. Voiko tiede tarjota meille lisää vuosia tai herättää aivokuolleita? Onko meillä toivoa iankaikkisesta elämästä tai uudelleensyntymisestä? Uskonnot tarjoavat kauniita ajatuksia, mutta onko niissä yhtään todellisuutta? Onko kenelläkään vastausta kysymyksiin kuoleman jälkeisestä? Uskon, että tiede voi pidentää elämäämme tulevaisuudessa, mutta kerkeääkö se pelastaa minun elämääni?";
    			t3 = space();
    			div1 = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(p0, file$6, 14, 4, 656);
    			add_location(p1, file$6, 15, 4, 788);
    			attr_dev(div0, "id", "content");
    			add_location(div0, file$6, 13, 0, 633);
    			attr_dev(ul, "id", "posts");
    			attr_dev(ul, "class", "noUnd");
    			add_location(ul, file$6, 19, 1, 1437);
    			attr_dev(div1, "id", "content");
    			add_location(div1, file$6, 18, 0, 1417);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, p0);
    			append_dev(div0, t1);
    			append_dev(div0, p1);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$url, posts*/ 3) {
    				each_value = /*posts*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let $layout;
    	let $url;
    	validate_store(layout, "layout");
    	component_subscribe($$self, layout, $$value => $$invalidate(3, $layout = $$value));
    	validate_store(url, "url");
    	component_subscribe($$self, url, $$value => $$invalidate(0, $url = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Fi", slots, []);
    	const posts = $layout.parent.children.filter(c => c.meta["frontmatter"]).sort((a, b) => a.meta["frontmatter"].published.localeCompare(b.meta["frontmatter"].published));
    	let title = "Tutkielma kuolemasta";
    	let summary = "Kuolema odottaa meitä kaikkia, mutta mitä meille oikeasti tapahtuu kuollessa ja voiko kuollutta herättää henkiin? Voiko uskonnot tarjota meille ikuista elämää?";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Fi> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		url,
    		layout,
    		metatags,
    		posts,
    		title,
    		summary,
    		$layout,
    		$url
    	});

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(4, title = $$props.title);
    		if ("summary" in $$props) $$invalidate(5, summary = $$props.summary);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	 metatags.title = title;
    	 metatags.description = summary;
    	 metatags["twitter:title"] = title;
    	 metatags["twitter:description"] = summary;
    	return [$url, posts];
    }

    class Fi extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Fi",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }
    Fi.$compile = {"vars":[{"name":"url","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"layout","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":true},{"name":"metatags","export_name":null,"injected":false,"module":false,"mutated":true,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"posts","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"title","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":true,"referenced_from_script":true},{"name":"summary","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":false,"writable":true,"referenced_from_script":true},{"name":"$layout","export_name":null,"injected":true,"module":false,"mutated":true,"reassigned":false,"referenced":false,"writable":true,"referenced_from_script":false},{"name":"$url","export_name":null,"injected":true,"module":false,"mutated":true,"reassigned":false,"referenced":true,"writable":true,"referenced_from_script":false}]};

    var index = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': Fi
    });

    /* src/pages/fi/kristinusko.md generated by Svelte v3.31.0 */
    const file$7 = "src/pages/fi/kristinusko.md";

    // (10:0) <Layout_MDSVEX_DEFAULT {...metadata}>
    function create_default_slot$2(ctx) {
    	let p0;
    	let t1;
    	let p1;
    	let t3;
    	let p2;
    	let t5;
    	let p3;
    	let t7;
    	let p4;
    	let t9;
    	let p5;
    	let t11;
    	let p6;
    	let t13;
    	let p7;
    	let t15;
    	let p8;
    	let t17;
    	let p9;
    	let t19;
    	let p10;
    	let t21;
    	let p11;
    	let t23;
    	let p12;
    	let t25;
    	let p13;
    	let t27;
    	let p14;
    	let t29;
    	let p15;
    	let t31;
    	let p16;
    	let t33;
    	let p17;
    	let t35;
    	let p18;
    	let t37;
    	let p19;
    	let t39;
    	let p20;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			p0.textContent = "Olen pitkään ollut kiinnostunut kuolemasta. Mietin paljon miten nopeasti aika kuluu ja mitä olen elämässäni saavuttanut.";
    			t1 = space();
    			p1 = element("p");
    			p1.textContent = "On pelottava ajatus, että tämä mahtava koneisto jota kehoksi kutsutaan, voidaan sulkea ja unohtaa kuin vanha tietokone. Mitä enemmän mietin tuota, sitä enemmän halusin tutustua kuolemaan tieteellisesti, henkisesti ja uskonnollisesti. Voiko tiede tarjota meille lisää vuosia tai herättää aivokuolleita? Onko meillä toivoa iankaikkisesta elämästä tai uudelleensyntymisestä? Uskonnot tarjoavat kauniita ajatuksia, mutta onko niissä yhtään todellisuutta? Onko kenelläkään vastausta kysymyksiin kuoleman jälkeisestä? Uskon, että tiede voi pidentää elämäämme tulevaisuudessa, mutta kerkeääkö se pelastaa minun elämääni?";
    			t3 = space();
    			p2 = element("p");
    			p2.textContent = "Kuolema määritellään kaikkien elävää organismia ylläpitävien biologisten toimintojen lopettamiseksi.";
    			t5 = space();
    			p3 = element("p");
    			p3.textContent = "Aivokuolema, täydellinen ja peruuttamaton aivotoiminnan menetys (mukaan lukien elämän ylläpitämiseksi välttämätön tahaton toiminta), sellaisena kuin se on määritelty Harvardin lääketieteellisen koulun Ad Hoc -komitean vuonna 1968 antamassa raportissa, on ihmiskuoleman laillinen määritelmä useimmissa maailman maissa. .";
    			t7 = space();
    			p4 = element("p");
    			p4.textContent = "Joko suoraan trauman kautta tai epäsuorasti toissijaisten sairausaiheiden kautta, aivokuolema on lopullinen patologinen tila, jonka yli 60 miljoonaa ihmistä siirtyy maailmanlaajuisesti vuosittain.";
    			t9 = space();
    			p5 = element("p");
    			p5.textContent = "Lääketieteellisen laitoksen kautta (samoin kuin populaarikulttuurin kautta, viimeaikaisissa julkisissa tapauksissa, kuten Jahi McMathin ja Bobbi Kristina Brownin ympäristössä) kerrotaan toistuvasti, että aivokuolema on “peruuttamaton” ja sitä tulisi pitää linjan loppuun.";
    			t11 = space();
    			p6 = element("p");
    			p6.textContent = "Kuolema määritellään kaikkien elävää organismia ylläpitävien biologisten toimintojen lopuksi.";
    			t13 = space();
    			p7 = element("p");
    			p7.textContent = "Lähtökohtaisesti kaikki elävät organismit kuolevat joskus. Normaalien solujen elinaika jatkuu noin 50 jakautumiskerran päähän. Niiden kromosomeissa olevat telomeerit lyhentyvät jokaisella jakautumiskerralla. Erilaistumattomat kantasolut, sukusolut ja eräät syöpäsolut kykenevät telomeraasientsyymin avulla ylläpitämään kromosomiensa vakiopituuden.[1]";
    			t15 = space();
    			p8 = element("p");
    			p8.textContent = "Eläimillä kuolema seuraa usein jonkin tärkeän elimen, kuten sydämen, toiminnan lakattua. Kasvit puolestaan voivat sopivissa olosuhteissa jatkaa elinkaartaan juurissaan ja versoissaan, jolloin voi olla tulkinnanvaraista, koska yksilö kuolee ja klooni jatkaa sen elämää. Yksisoluisten, jakautumalla lisääntyvien organismien kuolema on vielä vaikeampi määritellä.";
    			t17 = space();
    			p9 = element("p");
    			p9.textContent = "On mahdollista että organismi kuolee, mutta osa sen soluista ja elimistä jää eloon ja voidaan siirtää uuteen isäntään, kuten elinsiirron tapauksessa. Elinsiirron yhteydessä yhä elävät kudokset on poistettava nopeasti kuolleesta isännästä, ennen kuin ne kuolevat puutteellisten elintoimintojen takia. Toisaalta organismin yksittäiset solut tai jopa elimet voivat kuolla, mutta organismi voi jäädä eloon. Monet yksittäiset solut elävät vain lyhyen aikaa, joten suurin osa organismin soluista uusiutuu jatkuvasti.";
    			t19 = space();
    			p10 = element("p");
    			p10.textContent = "Senkin jälkeen kun ihminen on lääketieteellisesti ja laillisesti todettu kuolleeksi, ruumis on täynnä elämää. Vielä ihmisen kuoleman jälkeen suurin osa hänen soluistaan ja elimistään ovat vielä elossa, ja ne kuolevat kukin eri tahtiin.";
    			t21 = space();
    			p11 = element("p");
    			p11.textContent = "Biologisesta näkökulmasta kuolema on näin ollen pikemminkin prosessi kuin tapahtuma, huomauttavat University College Londonin tiedemiehet tuoreessa tutkimuksessaan.";
    			t23 = space();
    			p12 = element("p");
    			p12.textContent = "Tutkijoiden mukaan elimistöllistä kuolemaa kokonaisuutena on tutkittu huomattavan suppeasti biologiassa, vaikka sen ymmärtäminen auttaisi ymmärtämään myös tappavien tautien ja jopa ikääntymisen etenemistä.";
    			t25 = space();
    			p13 = element("p");
    			p13.textContent = "Tutkijoiden mukaan prosessin ymmärtämisellä voitaisiin jopa oppia kääntämään vakavien sairauksien eteneminen päinvastaiseksi kuoleman kynnyksellä olevissa potilaissa.";
    			t27 = space();
    			p14 = element("p");
    			p14.textContent = "Tutkimusryhmä perehtyi juuri näihin kysymyksiin elimistöllisestä kuolemasta tutkimalla prosessia sukkulamadoissa.";
    			t29 = space();
    			p15 = element("p");
    			p15.textContent = "Suomessa brittitutkimuksesta kertoi ensimmäisenä Seura.";
    			t31 = space();
    			p16 = element("p");
    			p16.textContent = "Energia ehtyy soluista\nTutkimuskohteeksi valikoitui sukkulamato, sillä kyseinen laji on läpikuultavuutensa vuoksi otollinen biologisten prosessien tutkimiseen.";
    			t33 = space();
    			p17 = element("p");
    			p17.textContent = "Tiedemiehet ovat jo aiemmassa tutkimuksessaan huomanneet, että kuollessaan sen suoliston läpi kulkee päästä häntään sinisenä hehkuva aalto, joka syntyy kuolevien solujen vapauttamasta antraliinihaposta.";
    			t35 = space();
    			p18 = element("p");
    			p18.textContent = "Uudessa tutkimuksessa selvitettiin sitä, mistä kuolema madossa varsinaisesti alkaa. Selvisi, että elimistöllinen kuolema alkoi siitä, kun eliön soluista loppuu energia pitämään kalsiumia sisällään, ja kalsium vapautuu.";
    			t37 = space();
    			p19 = element("p");
    			p19.textContent = "Kalsiumin vapautuessa sitä sisältäneet solut hajoavat yksi toisensa jälkeen, mikä näkyy suppilomadon suolistossa etenevänä sinisenä valona.";
    			t39 = space();
    			p20 = element("p");
    			p20.textContent = "Sukkulamadolle tehty tuore tutkimus on osa laajempaa tutkimusprojektia, jossa selvitetään ikääntymisen tuottamia terveysongelmia ja ratkaisuja niihin.";
    			add_location(p0, file$7, 10, 0, 620);
    			add_location(p1, file$7, 11, 0, 748);
    			add_location(p2, file$7, 12, 0, 1369);
    			add_location(p3, file$7, 13, 0, 1477);
    			add_location(p4, file$7, 14, 0, 1804);
    			add_location(p5, file$7, 15, 0, 2008);
    			add_location(p6, file$7, 16, 0, 2287);
    			add_location(p7, file$7, 17, 0, 2388);
    			add_location(p8, file$7, 18, 0, 2746);
    			add_location(p9, file$7, 19, 0, 3114);
    			add_location(p10, file$7, 20, 0, 3632);
    			add_location(p11, file$7, 21, 0, 3875);
    			add_location(p12, file$7, 22, 0, 4047);
    			add_location(p13, file$7, 23, 0, 4260);
    			add_location(p14, file$7, 24, 0, 4434);
    			add_location(p15, file$7, 25, 0, 4555);
    			add_location(p16, file$7, 26, 0, 4618);
    			add_location(p17, file$7, 28, 0, 4785);
    			add_location(p18, file$7, 29, 0, 4995);
    			add_location(p19, file$7, 30, 0, 5221);
    			add_location(p20, file$7, 31, 0, 5368);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, p2, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, p3, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, p4, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, p5, anchor);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, p6, anchor);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, p7, anchor);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, p8, anchor);
    			insert_dev(target, t17, anchor);
    			insert_dev(target, p9, anchor);
    			insert_dev(target, t19, anchor);
    			insert_dev(target, p10, anchor);
    			insert_dev(target, t21, anchor);
    			insert_dev(target, p11, anchor);
    			insert_dev(target, t23, anchor);
    			insert_dev(target, p12, anchor);
    			insert_dev(target, t25, anchor);
    			insert_dev(target, p13, anchor);
    			insert_dev(target, t27, anchor);
    			insert_dev(target, p14, anchor);
    			insert_dev(target, t29, anchor);
    			insert_dev(target, p15, anchor);
    			insert_dev(target, t31, anchor);
    			insert_dev(target, p16, anchor);
    			insert_dev(target, t33, anchor);
    			insert_dev(target, p17, anchor);
    			insert_dev(target, t35, anchor);
    			insert_dev(target, p18, anchor);
    			insert_dev(target, t37, anchor);
    			insert_dev(target, p19, anchor);
    			insert_dev(target, t39, anchor);
    			insert_dev(target, p20, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(p3);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(p4);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(p5);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(p6);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(p7);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(p8);
    			if (detaching) detach_dev(t17);
    			if (detaching) detach_dev(p9);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(p10);
    			if (detaching) detach_dev(t21);
    			if (detaching) detach_dev(p11);
    			if (detaching) detach_dev(t23);
    			if (detaching) detach_dev(p12);
    			if (detaching) detach_dev(t25);
    			if (detaching) detach_dev(p13);
    			if (detaching) detach_dev(t27);
    			if (detaching) detach_dev(p14);
    			if (detaching) detach_dev(t29);
    			if (detaching) detach_dev(p15);
    			if (detaching) detach_dev(t31);
    			if (detaching) detach_dev(p16);
    			if (detaching) detach_dev(t33);
    			if (detaching) detach_dev(p17);
    			if (detaching) detach_dev(t35);
    			if (detaching) detach_dev(p18);
    			if (detaching) detach_dev(t37);
    			if (detaching) detach_dev(p19);
    			if (detaching) detach_dev(t39);
    			if (detaching) detach_dev(p20);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(10:0) <Layout_MDSVEX_DEFAULT {...metadata}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let layout_mdsvex_default;
    	let current;
    	const layout_mdsvex_default_spread_levels = [metadata$1];

    	let layout_mdsvex_default_props = {
    		$$slots: { default: [create_default_slot$2] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < layout_mdsvex_default_spread_levels.length; i += 1) {
    		layout_mdsvex_default_props = assign(layout_mdsvex_default_props, layout_mdsvex_default_spread_levels[i]);
    	}

    	layout_mdsvex_default = new Article({
    			props: layout_mdsvex_default_props,
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(layout_mdsvex_default.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(layout_mdsvex_default, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const layout_mdsvex_default_changes = (dirty & /*metadata*/ 0)
    			? get_spread_update(layout_mdsvex_default_spread_levels, [get_spread_object(metadata$1)])
    			: {};

    			if (dirty & /*$$scope*/ 1) {
    				layout_mdsvex_default_changes.$$scope = { dirty, ctx };
    			}

    			layout_mdsvex_default.$set(layout_mdsvex_default_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(layout_mdsvex_default.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(layout_mdsvex_default.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(layout_mdsvex_default, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const metadata$1 = {
    	"title": "Kristinusko",
    	"summary": "Kuolema odottaa meitä kaikkia, mutta mitä meille oikeasti tapahtuu kuollessa ja voiko kuollutta herättää henkiin? Voiko uskonnot tarjota meille ikuista elämää?",
    	"layout": "article",
    	"language": "fi",
    	"pub": [10, "Apr"],
    	"published": "2020-04-11T22:06:14.000Z",
    	"modified": "2020-04-11T22:16:53.000Z"
    };

    const { title: title$1, summary: summary$1, layout: layout$2, language: language$1, pub, published, modified } = metadata$1;

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Kristinusko", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Kristinusko> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		metadata: metadata$1,
    		title: title$1,
    		summary: summary$1,
    		layout: layout$2,
    		language: language$1,
    		pub,
    		published,
    		modified,
    		Layout_MDSVEX_DEFAULT: Article
    	});

    	return [];
    }

    class Kristinusko extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Kristinusko",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }
    Kristinusko.$compile = {"vars":[{"name":"metadata","export_name":"metadata","injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"title","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"summary","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"layout","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"language","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"pub","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"published","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"modified","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"Layout_MDSVEX_DEFAULT","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false}]};

    var kristinusko = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': Kristinusko,
        metadata: metadata$1
    });

    /* src/pages/fi/kuolema.md generated by Svelte v3.31.0 */
    const file$8 = "src/pages/fi/kuolema.md";

    // (10:0) <Layout_MDSVEX_DEFAULT {...metadata}>
    function create_default_slot$3(ctx) {
    	let p0;
    	let t1;
    	let p1;
    	let t3;
    	let p2;
    	let t5;
    	let p3;
    	let t7;
    	let p4;
    	let t9;
    	let p5;
    	let t11;
    	let p6;
    	let t13;
    	let p7;
    	let t15;
    	let p8;
    	let t17;
    	let p9;
    	let t19;
    	let p10;
    	let t21;
    	let p11;
    	let t23;
    	let p12;
    	let t25;
    	let p13;
    	let t27;
    	let p14;
    	let t29;
    	let p15;
    	let t31;
    	let p16;
    	let t33;
    	let p17;
    	let t35;
    	let p18;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			p0.textContent = "Kuolema määritellään kaikkien elävää organismia ylläpitävien biologisten toimintojen lopettamiseksi.";
    			t1 = space();
    			p1 = element("p");
    			p1.textContent = "Aivokuolema, täydellinen ja peruuttamaton aivotoiminnan menetys (mukaan lukien elämän ylläpitämiseksi välttämätön tahaton toiminta), sellaisena kuin se on määritelty Harvardin lääketieteellisen koulun Ad Hoc -komitean vuonna 1968 antamassa raportissa, on ihmiskuoleman laillinen määritelmä useimmissa maailman maissa. .";
    			t3 = space();
    			p2 = element("p");
    			p2.textContent = "Joko suoraan trauman kautta tai epäsuorasti toissijaisten sairausaiheiden kautta, aivokuolema on lopullinen patologinen tila, jonka yli 60 miljoonaa ihmistä siirtyy maailmanlaajuisesti vuosittain.";
    			t5 = space();
    			p3 = element("p");
    			p3.textContent = "Lääketieteellisen laitoksen kautta (samoin kuin populaarikulttuurin kautta, viimeaikaisissa julkisissa tapauksissa, kuten Jahi McMathin ja Bobbi Kristina Brownin ympäristössä) kerrotaan toistuvasti, että aivokuolema on “peruuttamaton” ja sitä tulisi pitää linjan loppuun.";
    			t7 = space();
    			p4 = element("p");
    			p4.textContent = "Kuolema määritellään kaikkien elävää organismia ylläpitävien biologisten toimintojen lopuksi.";
    			t9 = space();
    			p5 = element("p");
    			p5.textContent = "Lähtökohtaisesti kaikki elävät organismit kuolevat joskus. Normaalien solujen elinaika jatkuu noin 50 jakautumiskerran päähän. Niiden kromosomeissa olevat telomeerit lyhentyvät jokaisella jakautumiskerralla. Erilaistumattomat kantasolut, sukusolut ja eräät syöpäsolut kykenevät telomeraasientsyymin avulla ylläpitämään kromosomiensa vakiopituuden.[1]";
    			t11 = space();
    			p6 = element("p");
    			p6.textContent = "Eläimillä kuolema seuraa usein jonkin tärkeän elimen, kuten sydämen, toiminnan lakattua. Kasvit puolestaan voivat sopivissa olosuhteissa jatkaa elinkaartaan juurissaan ja versoissaan, jolloin voi olla tulkinnanvaraista, koska yksilö kuolee ja klooni jatkaa sen elämää. Yksisoluisten, jakautumalla lisääntyvien organismien kuolema on vielä vaikeampi määritellä.";
    			t13 = space();
    			p7 = element("p");
    			p7.textContent = "On mahdollista että organismi kuolee, mutta osa sen soluista ja elimistä jää eloon ja voidaan siirtää uuteen isäntään, kuten elinsiirron tapauksessa. Elinsiirron yhteydessä yhä elävät kudokset on poistettava nopeasti kuolleesta isännästä, ennen kuin ne kuolevat puutteellisten elintoimintojen takia. Toisaalta organismin yksittäiset solut tai jopa elimet voivat kuolla, mutta organismi voi jäädä eloon. Monet yksittäiset solut elävät vain lyhyen aikaa, joten suurin osa organismin soluista uusiutuu jatkuvasti.";
    			t15 = space();
    			p8 = element("p");
    			p8.textContent = "Senkin jälkeen kun ihminen on lääketieteellisesti ja laillisesti todettu kuolleeksi, ruumis on täynnä elämää. Vielä ihmisen kuoleman jälkeen suurin osa hänen soluistaan ja elimistään ovat vielä elossa, ja ne kuolevat kukin eri tahtiin.";
    			t17 = space();
    			p9 = element("p");
    			p9.textContent = "Biologisesta näkökulmasta kuolema on näin ollen pikemminkin prosessi kuin tapahtuma, huomauttavat University College Londonin tiedemiehet tuoreessa tutkimuksessaan.";
    			t19 = space();
    			p10 = element("p");
    			p10.textContent = "Tutkijoiden mukaan elimistöllistä kuolemaa kokonaisuutena on tutkittu huomattavan suppeasti biologiassa, vaikka sen ymmärtäminen auttaisi ymmärtämään myös tappavien tautien ja jopa ikääntymisen etenemistä.";
    			t21 = space();
    			p11 = element("p");
    			p11.textContent = "Tutkijoiden mukaan prosessin ymmärtämisellä voitaisiin jopa oppia kääntämään vakavien sairauksien eteneminen päinvastaiseksi kuoleman kynnyksellä olevissa potilaissa.";
    			t23 = space();
    			p12 = element("p");
    			p12.textContent = "Tutkimusryhmä perehtyi juuri näihin kysymyksiin elimistöllisestä kuolemasta tutkimalla prosessia sukkulamadoissa.";
    			t25 = space();
    			p13 = element("p");
    			p13.textContent = "Suomessa brittitutkimuksesta kertoi ensimmäisenä Seura.";
    			t27 = space();
    			p14 = element("p");
    			p14.textContent = "Energia ehtyy soluista\nTutkimuskohteeksi valikoitui sukkulamato, sillä kyseinen laji on läpikuultavuutensa vuoksi otollinen biologisten prosessien tutkimiseen.";
    			t29 = space();
    			p15 = element("p");
    			p15.textContent = "Tiedemiehet ovat jo aiemmassa tutkimuksessaan huomanneet, että kuollessaan sen suoliston läpi kulkee päästä häntään sinisenä hehkuva aalto, joka syntyy kuolevien solujen vapauttamasta antraliinihaposta.";
    			t31 = space();
    			p16 = element("p");
    			p16.textContent = "Uudessa tutkimuksessa selvitettiin sitä, mistä kuolema madossa varsinaisesti alkaa. Selvisi, että elimistöllinen kuolema alkoi siitä, kun eliön soluista loppuu energia pitämään kalsiumia sisällään, ja kalsium vapautuu.";
    			t33 = space();
    			p17 = element("p");
    			p17.textContent = "Kalsiumin vapautuessa sitä sisältäneet solut hajoavat yksi toisensa jälkeen, mikä näkyy suppilomadon suolistossa etenevänä sinisenä valona.";
    			t35 = space();
    			p18 = element("p");
    			p18.textContent = "Sukkulamadolle tehty tuore tutkimus on osa laajempaa tutkimusprojektia, jossa selvitetään ikääntymisen tuottamia terveysongelmia ja ratkaisuja niihin.";
    			add_location(p0, file$8, 10, 0, 625);
    			add_location(p1, file$8, 11, 0, 733);
    			add_location(p2, file$8, 12, 0, 1060);
    			add_location(p3, file$8, 13, 0, 1264);
    			add_location(p4, file$8, 14, 0, 1543);
    			add_location(p5, file$8, 15, 0, 1644);
    			add_location(p6, file$8, 16, 0, 2002);
    			add_location(p7, file$8, 17, 0, 2370);
    			add_location(p8, file$8, 18, 0, 2888);
    			add_location(p9, file$8, 19, 0, 3131);
    			add_location(p10, file$8, 20, 0, 3303);
    			add_location(p11, file$8, 21, 0, 3516);
    			add_location(p12, file$8, 22, 0, 3690);
    			add_location(p13, file$8, 23, 0, 3811);
    			add_location(p14, file$8, 24, 0, 3874);
    			add_location(p15, file$8, 26, 0, 4041);
    			add_location(p16, file$8, 27, 0, 4251);
    			add_location(p17, file$8, 28, 0, 4477);
    			add_location(p18, file$8, 29, 0, 4624);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, p2, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, p3, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, p4, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, p5, anchor);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, p6, anchor);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, p7, anchor);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, p8, anchor);
    			insert_dev(target, t17, anchor);
    			insert_dev(target, p9, anchor);
    			insert_dev(target, t19, anchor);
    			insert_dev(target, p10, anchor);
    			insert_dev(target, t21, anchor);
    			insert_dev(target, p11, anchor);
    			insert_dev(target, t23, anchor);
    			insert_dev(target, p12, anchor);
    			insert_dev(target, t25, anchor);
    			insert_dev(target, p13, anchor);
    			insert_dev(target, t27, anchor);
    			insert_dev(target, p14, anchor);
    			insert_dev(target, t29, anchor);
    			insert_dev(target, p15, anchor);
    			insert_dev(target, t31, anchor);
    			insert_dev(target, p16, anchor);
    			insert_dev(target, t33, anchor);
    			insert_dev(target, p17, anchor);
    			insert_dev(target, t35, anchor);
    			insert_dev(target, p18, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(p3);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(p4);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(p5);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(p6);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(p7);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(p8);
    			if (detaching) detach_dev(t17);
    			if (detaching) detach_dev(p9);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(p10);
    			if (detaching) detach_dev(t21);
    			if (detaching) detach_dev(p11);
    			if (detaching) detach_dev(t23);
    			if (detaching) detach_dev(p12);
    			if (detaching) detach_dev(t25);
    			if (detaching) detach_dev(p13);
    			if (detaching) detach_dev(t27);
    			if (detaching) detach_dev(p14);
    			if (detaching) detach_dev(t29);
    			if (detaching) detach_dev(p15);
    			if (detaching) detach_dev(t31);
    			if (detaching) detach_dev(p16);
    			if (detaching) detach_dev(t33);
    			if (detaching) detach_dev(p17);
    			if (detaching) detach_dev(t35);
    			if (detaching) detach_dev(p18);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(10:0) <Layout_MDSVEX_DEFAULT {...metadata}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let layout_mdsvex_default;
    	let current;
    	const layout_mdsvex_default_spread_levels = [metadata$2];

    	let layout_mdsvex_default_props = {
    		$$slots: { default: [create_default_slot$3] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < layout_mdsvex_default_spread_levels.length; i += 1) {
    		layout_mdsvex_default_props = assign(layout_mdsvex_default_props, layout_mdsvex_default_spread_levels[i]);
    	}

    	layout_mdsvex_default = new Article({
    			props: layout_mdsvex_default_props,
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(layout_mdsvex_default.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(layout_mdsvex_default, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const layout_mdsvex_default_changes = (dirty & /*metadata*/ 0)
    			? get_spread_update(layout_mdsvex_default_spread_levels, [get_spread_object(metadata$2)])
    			: {};

    			if (dirty & /*$$scope*/ 1) {
    				layout_mdsvex_default_changes.$$scope = { dirty, ctx };
    			}

    			layout_mdsvex_default.$set(layout_mdsvex_default_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(layout_mdsvex_default.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(layout_mdsvex_default.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(layout_mdsvex_default, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const metadata$2 = {
    	"title": "Mikä on kuolema?",
    	"summary": "Kuolema odottaa meitä kaikkia, mutta mitä meille oikeasti tapahtuu kuollessa ja voiko kuollutta herättää henkiin? Voiko uskonnot tarjota meille ikuista elämää?",
    	"layout": "article",
    	"language": "fi",
    	"pub": [10, "Apr"],
    	"published": "2020-04-09T22:06:14.000Z",
    	"modified": "2020-04-09T22:16:53.000Z"
    };

    const { title: title$2, summary: summary$2, layout: layout$3, language: language$2, pub: pub$1, published: published$1, modified: modified$1 } = metadata$2;

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Kuolema", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Kuolema> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		metadata: metadata$2,
    		title: title$2,
    		summary: summary$2,
    		layout: layout$3,
    		language: language$2,
    		pub: pub$1,
    		published: published$1,
    		modified: modified$1,
    		Layout_MDSVEX_DEFAULT: Article
    	});

    	return [];
    }

    class Kuolema extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Kuolema",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }
    Kuolema.$compile = {"vars":[{"name":"metadata","export_name":"metadata","injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"title","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"summary","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"layout","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"language","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"pub","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"published","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"modified","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"Layout_MDSVEX_DEFAULT","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false}]};

    var kuolema = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': Kuolema,
        metadata: metadata$2
    });

    /* src/pages/index.svelte generated by Svelte v3.31.0 */
    const file$9 = "src/pages/index.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i].meta;
    	child_ctx[7] = list[i].path;
    	return child_ctx;
    }

    // (23:2) {#each posts as {meta, path}}
    function create_each_block$4(ctx) {
    	let li;
    	let div5;
    	let aside;
    	let div3;
    	let div2;
    	let div0;
    	let t0_value = /*meta*/ ctx[6].frontmatter.pub[0] + "";
    	let t0;
    	let t1;
    	let div1;
    	let t2_value = /*meta*/ ctx[6].frontmatter.pub[1] + "";
    	let t2;
    	let t3;
    	let a;
    	let div4;
    	let h2;
    	let t4_value = /*meta*/ ctx[6].frontmatter.title + "";
    	let t4;
    	let t5;
    	let p;
    	let t6_value = /*meta*/ ctx[6].frontmatter.summary + "";
    	let t6;
    	let a_href_value;
    	let a_title_value;
    	let t7;

    	const block = {
    		c: function create() {
    			li = element("li");
    			div5 = element("div");
    			aside = element("aside");
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			t2 = text(t2_value);
    			t3 = space();
    			a = element("a");
    			div4 = element("div");
    			h2 = element("h2");
    			t4 = text(t4_value);
    			t5 = space();
    			p = element("p");
    			t6 = text(t6_value);
    			t7 = space();
    			attr_dev(div0, "class", "day");
    			add_location(div0, file$9, 28, 8, 997);
    			attr_dev(div1, "class", "month");
    			add_location(div1, file$9, 29, 8, 1054);
    			attr_dev(div2, "class", "grid cell");
    			add_location(div2, file$9, 27, 7, 965);
    			attr_dev(div3, "class", "pub bor");
    			add_location(div3, file$9, 26, 6, 936);
    			attr_dev(aside, "class", "grid tc");
    			add_location(aside, file$9, 25, 5, 906);
    			attr_dev(h2, "class", "bold");
    			add_location(h2, file$9, 35, 7, 1260);
    			attr_dev(p, "class", "summary");
    			add_location(p, file$9, 36, 7, 1314);
    			attr_dev(div4, "class", "content");
    			add_location(div4, file$9, 34, 6, 1231);
    			attr_dev(a, "class", "article grid");
    			attr_dev(a, "href", a_href_value = /*$url*/ ctx[0](/*path*/ ctx[7]));
    			attr_dev(a, "title", a_title_value = /*meta*/ ctx[6].frontmatter.title);
    			add_location(a, file$9, 33, 5, 1151);
    			attr_dev(div5, "class", "content grid");
    			add_location(div5, file$9, 24, 4, 874);
    			attr_dev(li, "class", "mxa");
    			add_location(li, file$9, 23, 3, 853);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div5);
    			append_dev(div5, aside);
    			append_dev(aside, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, t2);
    			append_dev(div5, t3);
    			append_dev(div5, a);
    			append_dev(a, div4);
    			append_dev(div4, h2);
    			append_dev(h2, t4);
    			append_dev(div4, t5);
    			append_dev(div4, p);
    			append_dev(p, t6);
    			append_dev(li, t7);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$url*/ 1 && a_href_value !== (a_href_value = /*$url*/ ctx[0](/*path*/ ctx[7]))) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(23:2) {#each posts as {meta, path}}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let section;
    	let div0;
    	let h1;
    	let t1;
    	let p;
    	let t3;
    	let div1;
    	let ul;
    	let each_value = /*posts*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			section = element("section");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = `${/*title*/ ctx[2]}`;
    			t1 = space();
    			p = element("p");
    			p.textContent = `${/*summary*/ ctx[3]}`;
    			t3 = space();
    			div1 = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h1, file$9, 15, 2, 651);
    			attr_dev(p, "class", "summary mxa");
    			add_location(p, file$9, 16, 2, 670);
    			attr_dev(div0, "class", "container content mxa tc");
    			add_location(div0, file$9, 14, 1, 610);
    			attr_dev(section, "id", "about");
    			attr_dev(section, "class", "bgw pad noUnd");
    			add_location(section, file$9, 13, 0, 566);
    			attr_dev(ul, "id", "posts");
    			attr_dev(ul, "class", "container mxa grid block noUnd");
    			add_location(ul, file$9, 21, 1, 763);
    			attr_dev(div1, "id", "content");
    			attr_dev(div1, "class", "bgb pad");
    			add_location(div1, file$9, 20, 0, 727);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div0);
    			append_dev(div0, h1);
    			append_dev(div0, t1);
    			append_dev(div0, p);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$url, posts*/ 3) {
    				each_value = /*posts*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let $layout;
    	let $url;
    	validate_store(layout, "layout");
    	component_subscribe($$self, layout, $$value => $$invalidate(5, $layout = $$value));
    	validate_store(url, "url");
    	component_subscribe($$self, url, $$value => $$invalidate(0, $url = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Pages", slots, []);
    	const posts = $layout.parent.children.filter(c => c.meta["frontmatter"]).sort((a, b) => b.meta["frontmatter"].published.localeCompare(a.meta["frontmatter"].published));
    	let title = "Tutorials";
    	let summary = "A collection of tutorials about things I've learned or discovered. Most of the tutorials are easy to read and to learn.";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Pages> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		url,
    		layout,
    		metatags,
    		posts,
    		title,
    		summary,
    		$layout,
    		$url
    	});

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(2, title = $$props.title);
    		if ("summary" in $$props) $$invalidate(3, summary = $$props.summary);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	 metatags.title = title;
    	 metatags.description = summary;
    	 metatags["twitter:title"] = title;
    	 metatags["twitter:description"] = summary;
    	return [$url, posts, title, summary];
    }

    class Pages extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Pages",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }
    Pages.$compile = {"vars":[{"name":"url","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"layout","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":true},{"name":"metatags","export_name":null,"injected":false,"module":false,"mutated":true,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":true},{"name":"posts","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"title","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":true,"referenced_from_script":true},{"name":"summary","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":true,"referenced_from_script":true},{"name":"$layout","export_name":null,"injected":true,"module":false,"mutated":true,"reassigned":false,"referenced":false,"writable":true,"referenced_from_script":false},{"name":"$url","export_name":null,"injected":true,"module":false,"mutated":true,"reassigned":false,"referenced":true,"writable":true,"referenced_from_script":false}]};

    var index$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': Pages
    });

    /* src/pages/is-death-reversible.md generated by Svelte v3.31.0 */
    const file$a = "src/pages/is-death-reversible.md";

    // (10:0) <Layout_MDSVEX_DEFAULT {...metadata}>
    function create_default_slot$4(ctx) {
    	let p;
    	let a;

    	const block = {
    		c: function create() {
    			p = element("p");
    			a = element("a");
    			a.textContent = "https://www.singularityweblog.com/is-death-reversible/";
    			attr_dev(a, "href", "https://www.singularityweblog.com/is-death-reversible/");
    			attr_dev(a, "rel", "nofollow");
    			add_location(a, file$a, 10, 3, 465);
    			add_location(p, file$a, 10, 0, 462);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, a);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$4.name,
    		type: "slot",
    		source: "(10:0) <Layout_MDSVEX_DEFAULT {...metadata}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let layout_mdsvex_default;
    	let current;
    	const layout_mdsvex_default_spread_levels = [metadata$3];

    	let layout_mdsvex_default_props = {
    		$$slots: { default: [create_default_slot$4] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < layout_mdsvex_default_spread_levels.length; i += 1) {
    		layout_mdsvex_default_props = assign(layout_mdsvex_default_props, layout_mdsvex_default_spread_levels[i]);
    	}

    	layout_mdsvex_default = new Article({
    			props: layout_mdsvex_default_props,
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(layout_mdsvex_default.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(layout_mdsvex_default, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const layout_mdsvex_default_changes = (dirty & /*metadata*/ 0)
    			? get_spread_update(layout_mdsvex_default_spread_levels, [get_spread_object(metadata$3)])
    			: {};

    			if (dirty & /*$$scope*/ 1) {
    				layout_mdsvex_default_changes.$$scope = { dirty, ctx };
    			}

    			layout_mdsvex_default.$set(layout_mdsvex_default_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(layout_mdsvex_default.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(layout_mdsvex_default.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(layout_mdsvex_default, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const metadata$3 = {
    	"title": "A Study of Death",
    	"summary": "A study of death; what happens in death and what different religions promise after death. Is there life after death?",
    	"layout": "article",
    	"language": "en"
    };

    const { title: title$3, summary: summary$3, layout: layout$4, language: language$3 } = metadata$3;

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Is_death_reversible", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Is_death_reversible> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		metadata: metadata$3,
    		title: title$3,
    		summary: summary$3,
    		layout: layout$4,
    		language: language$3,
    		Layout_MDSVEX_DEFAULT: Article
    	});

    	return [];
    }

    class Is_death_reversible extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Is_death_reversible",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }
    Is_death_reversible.$compile = {"vars":[{"name":"metadata","export_name":"metadata","injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false},{"name":"title","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"summary","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"layout","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"language","export_name":null,"injected":false,"module":true,"mutated":false,"reassigned":false,"referenced":false,"writable":false,"referenced_from_script":false},{"name":"Layout_MDSVEX_DEFAULT","export_name":null,"injected":false,"module":false,"mutated":false,"reassigned":false,"referenced":true,"writable":false,"referenced_from_script":false}]};

    var isDeathReversible = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': Is_death_reversible,
        metadata: metadata$3
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
