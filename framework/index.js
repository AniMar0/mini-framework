// ===============================
// Mini-Framework - Main Entry Point
// ===============================

// DOM & Virtual DOM
export { createElement, el, mount, render } from './dom.js';

// Event System
export {
    bindEvent,
    addListener,
    removeListener,
    removeAllListeners,
    EventEmitter,
    eventBus
} from './events.js';

// Router
export {
    Router,
    initRouter,
    addRoute,
    navigate,
    getCurrentRoute,
    onRouteChange,
    setNotFound,
    goBack,
    goForward
} from './router.js';

// State Management
export {
    Store,
    createStore,
    createReducerStore,
    combineReducers
} from './state.js';