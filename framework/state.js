// ===============================
// State Management - Redux-like Store
// ===============================

/**
 * Create a simple store (Functional API)
 * @param {*} initialState - Initial state value
 * @returns {object} Store with state, setState, subscribe
 */
export function createStore(initialState) {
    let state = initialState;
    const listeners = [];

    /**
     * Update the state and notify all listeners
     * @param {*} newState - New state (or function that returns new state)
     */
    function setState(newState) {
        // Support function updater like React's setState
        if (typeof newState === 'function') {
            state = newState(state);
        } else {
            state = newState;
        }
        // Notify all subscribers
        listeners.forEach(fn => fn(state));
    }

    /**
     * Subscribe to state changes
     * @param {Function} fn - Listener function
     * @returns {Function} Unsubscribe function
     */
    function subscribe(fn) {
        listeners.push(fn);
        // Call immediately with current state
        fn(state);
        // Return unsubscribe function
        return () => {
            const index = listeners.indexOf(fn);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        };
    }

    /**
     * Get current state
     * @returns {*} Current state
     */
    function getState() {
        return state;
    }

    return {
        get state() {
            return state;
        },
        getState,
        setState,
        subscribe
    };
}

// ===============================
// Store Class (Alternative OOP API)
// ===============================

export class Store {
    constructor(initialState = {}) {
        this._state = initialState;
        this._listeners = [];
    }

    /**
     * Get current state
     * @returns {*} Current state
     */
    getState() {
        return this._state;
    }

    /**
     * Update state
     * @param {*} updater - New state or updater function
     */
    setState(updater) {
        if (typeof updater === 'function') {
            this._state = updater(this._state);
        } else {
            this._state = { ...this._state, ...updater };
        }
        // Notify all subscribers
        this._listeners.forEach(fn => fn(this._state));
    }

    /**
     * Subscribe to state changes
     * @param {Function} listener - Listener function
     * @returns {Function} Unsubscribe function
     */
    subscribe(listener) {
        this._listeners.push(listener);
        // Call immediately with current state
        listener(this._state);
        // Return unsubscribe function
        return () => {
            const index = this._listeners.indexOf(listener);
            if (index > -1) {
                this._listeners.splice(index, 1);
            }
        };
    }
}

// ===============================
// Redux-like Store with Reducers
// ===============================

/**
 * Create a Redux-like store with reducer
 * @param {Function} reducer - Reducer function (state, action) => newState
 * @param {*} initialState - Initial state
 * @returns {object} Store with getState, dispatch, subscribe
 */
export function createReducerStore(reducer, initialState) {
    let state = initialState;
    const listeners = [];

    /**
     * Get current state
     */
    function getState() {
        return state;
    }

    /**
     * Dispatch an action
     * @param {object} action - Action object { type: string, payload?: any }
     */
    function dispatch(action) {
        state = reducer(state, action);
        listeners.forEach(fn => fn(state));
        return action;
    }

    /**
     * Subscribe to state changes
     * @param {Function} listener - Listener function
     * @returns {Function} Unsubscribe function
     */
    function subscribe(listener) {
        listeners.push(listener);
        return () => {
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        };
    }

    // Initialize with INIT action
    dispatch({ type: '@@INIT' });

    return {
        getState,
        dispatch,
        subscribe
    };
}

// ===============================
// Combine Reducers Helper
// ===============================

/**
 * Combine multiple reducers into one
 * @param {object} reducers - Object with reducer functions
 * @returns {Function} Combined reducer
 */
export function combineReducers(reducers) {
    return (state = {}, action) => {
        const newState = {};
        let hasChanged = false;

        for (const [key, reducer] of Object.entries(reducers)) {
            const previousStateForKey = state[key];
            const nextStateForKey = reducer(previousStateForKey, action);
            newState[key] = nextStateForKey;
            hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
        }

        return hasChanged ? newState : state;
    };
}