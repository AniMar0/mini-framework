// ===============================
// Event System - Event Binding & Management
// ===============================

// WeakMap to store event handlers per element (auto garbage collection)
const eventRegistry = new WeakMap();

/**
 * Bind an event handler to an element
 * @param {HTMLElement} element - The DOM element
 * @param {string} event - Event name (click, input, change, etc.)
 * @param {Function} handler - Event handler function
 */
export function bindEvent(element, event, handler) {
    // Get or create events object for this element
    const events = eventRegistry.get(element) || {};
    if (!eventRegistry.has(element)) {
        eventRegistry.set(element, events);
    }

    // Initialize event array and attach listener if first handler
    if (!events[event]) {
        events[event] = [];
        // Use a single listener that calls all handlers
        element[`on${event}`] = (e) => events[event].forEach(fn => fn(e));
    }

    // Add handler to the list
    events[event].push(handler);
}

/**
 * Add event listener with cleanup function
 * @param {HTMLElement} element - The DOM element
 * @param {string} event - Event name (can include 'on' prefix)
 * @param {Function} handler - Event handler function
 * @returns {Function} Cleanup function to remove the listener
 */
export function addListener(element, event, handler) {
    const cleanEvent = event.replace(/^on/, '');
    bindEvent(element, cleanEvent, handler);
    // Return cleanup function
    return () => removeListener(element, cleanEvent, handler);
}

/**
 * Remove an event handler from an element
 * @param {HTMLElement} element - The DOM element
 * @param {string} event - Event name
 * @param {Function} handler - Handler to remove
 */
export function removeListener(element, event, handler) {
    const cleanEvent = event.replace(/^on/, '');
    const events = eventRegistry.get(element);
    const handlers = events?.[cleanEvent];

    if (!handlers) return;

    const index = handlers.indexOf(handler);
    if (index === -1) return;

    // Remove the handler
    handlers.splice(index, 1);

    // Clean up if no more handlers
    if (handlers.length === 0) {
        element[`on${cleanEvent}`] = null;
        delete events[cleanEvent];
    }
}

/**
 * Remove all event handlers from an element
 * @param {HTMLElement} element - The DOM element
 */
export function removeAllListeners(element) {
    const events = eventRegistry.get(element);
    if (!events) return;

    // Clear all event handlers
    for (const event of Object.keys(events)) {
        element[`on${event}`] = null;
    }

    // Remove from registry
    eventRegistry.delete(element);
}

// ===============================
// Event Emitter - Custom Events System
// ===============================

/**
 * Simple Event Emitter class for custom events
 * Similar to Node.js EventEmitter or Redux-like pub/sub
 */
export class EventEmitter {
    constructor() {
        this.events = {};
    }

    /**
     * Subscribe to an event
     * @param {string} eventName - Name of the event
     * @param {Function} handler - Handler function
     * @returns {Function} Unsubscribe function
     */
    on(eventName, handler) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(handler);

        // Return unsubscribe function
        return () => this.off(eventName, handler);
    }

    /**
     * Subscribe to an event (one time only)
     * @param {string} eventName - Name of the event
     * @param {Function} handler - Handler function
     */
    once(eventName, handler) {
        const wrapper = (...args) => {
            handler(...args);
            this.off(eventName, wrapper);
        };
        this.on(eventName, wrapper);
    }

    /**
     * Unsubscribe from an event
     * @param {string} eventName - Name of the event
     * @param {Function} handler - Handler to remove
     */
    off(eventName, handler) {
        const handlers = this.events[eventName];
        if (!handlers) return;

        const index = handlers.indexOf(handler);
        if (index > -1) {
            handlers.splice(index, 1);
        }
    }

    /**
     * Emit an event with payload
     * @param {string} eventName - Name of the event
     * @param {*} payload - Data to pass to handlers
     */
    emit(eventName, payload) {
        const handlers = this.events[eventName];
        if (!handlers) return;

        handlers.forEach(handler => handler(payload));
    }

    /**
     * Remove all handlers for an event (or all events)
     * @param {string} [eventName] - Optional event name
     */
    removeAll(eventName) {
        if (eventName) {
            delete this.events[eventName];
        } else {
            this.events = {};
        }
    }
}

// ===============================
// Global Event Bus (Singleton)
// ===============================

// Global event bus for app-wide communication
export const eventBus = new EventEmitter();