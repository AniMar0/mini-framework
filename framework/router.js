import { addListener } from './events.js';

// ===============================
// Router - Client-Side Routing
// ===============================

// Router state
const state = {
    currentRoute: '/',
    routes: {},
    callbacks: [],
    notFoundHandler: null
};

/**
 * Get clean route from hash (removes # symbol)
 * @returns {string} Current route path
 */
const getCleanRoute = () => window.location.hash.slice(1) || '/';

/**
 * Parse route parameters from path
 * Example: '/user/:id' matches '/user/123' => { id: '123' }
 * @param {string} routePattern - Route pattern with params
 * @param {string} actualPath - Actual URL path
 * @returns {object|null} Params object or null if no match
 */
function matchRoute(routePattern, actualPath) {
    const patternParts = routePattern.split('/');
    const pathParts = actualPath.split('/');

    if (patternParts.length !== pathParts.length) {
        return null;
    }

    const params = {};

    for (let i = 0; i < patternParts.length; i++) {
        const pattern = patternParts[i];
        const path = pathParts[i];

        if (pattern.startsWith(':')) {
            // Dynamic parameter
            const paramName = pattern.slice(1);
            params[paramName] = path;
        } else if (pattern !== path) {
            // No match
            return null;
        }
    }

    return params;
}

/**
 * Handle route change
 */
function handleRouteChange() {
    const path = getCleanRoute();
    state.currentRoute = path;

    // Try to find matching route
    for (const [pattern, handler] of Object.entries(state.routes)) {
        const params = matchRoute(pattern, path);
        if (params !== null) {
            handler(params);
            // Notify all callbacks
            state.callbacks.forEach(fn => fn(path, params));
            return;
        }
    }

    // No route found - call 404 handler
    if (state.notFoundHandler) {
        state.notFoundHandler(path);
    }

    // Still notify callbacks
    state.callbacks.forEach(fn => fn(path, null));
}

// ===============================
// Public API
// ===============================

/**
 * Initialize the router and start listening
 */
export function initRouter() {
    addListener(window, 'hashchange', handleRouteChange);
    // Handle initial route
    handleRouteChange();
}

/**
 * Add a route handler
 * @param {string} path - Route path (e.g., '/', '/users', '/user/:id')
 * @param {Function} handler - Handler function (receives params object)
 */
export function addRoute(path, handler) {
    state.routes[path] = handler;
}

/**
 * Set handler for 404 (not found) routes
 * @param {Function} handler - Handler function
 */
export function setNotFound(handler) {
    state.notFoundHandler = handler;
}

/**
 * Subscribe to route changes
 * @param {Function} callback - Called on every route change
 * @returns {Function} Unsubscribe function
 */
export function onRouteChange(callback) {
    state.callbacks.push(callback);
    return () => {
        const index = state.callbacks.indexOf(callback);
        if (index > -1) {
            state.callbacks.splice(index, 1);
        }
    };
}

/**
 * Get the current route
 * @returns {string} Current route path
 */
export function getCurrentRoute() {
    return state.currentRoute;
}

/**
 * Navigate to a route programmatically
 * @param {string} path - Route path to navigate to
 */
export function navigate(path) {
    window.location.hash = path;
}

/**
 * Go back in history
 */
export function goBack() {
    window.history.back();
}

/**
 * Go forward in history
 */
export function goForward() {
    window.history.forward();
}

// ===============================
// Router Class (Alternative API)
// ===============================

export class Router {
    constructor() {
        this.routes = {};
        this.notFoundHandler = null;
    }

    /**
     * Add a route
     * @param {string} path - Route path
     * @param {Function} handler - Route handler
     * @returns {Router} this (for chaining)
     */
    addRoute(path, handler) {
        this.routes[path] = handler;
        addRoute(path, handler);
        return this;
    }

    /**
     * Set 404 handler
     * @param {Function} handler - Not found handler
     * @returns {Router} this (for chaining)
     */
    notFound(handler) {
        this.notFoundHandler = handler;
        setNotFound(handler);
        return this;
    }

    /**
     * Start the router
     */
    start() {
        initRouter();
    }

    /**
     * Navigate to a path
     * @param {string} path - Path to navigate to
     */
    navigate(path) {
        navigate(path);
    }
}