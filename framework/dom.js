import { bindEvent } from './events.js';

// ===============================
// Virtual DOM - Create Virtual Elements
// ===============================

// Create a virtual element (Virtual Element)
export function createElement(tag, attrs = {}, children = []) {
    return {
        tag,
        attrs: { ...attrs },
        children: children.flat()
    };
}

// Shorthand for createElement
export const el = createElement;

// ===============================
// Convert Virtual DOM to Real DOM
// ===============================

function createDOMElement(vNode) {
    // Handle null/undefined/false values
    if (vNode === null || vNode === undefined || vNode === false) {
        return null;
    }

    // Handle text and numbers
    if (typeof vNode === 'string' || typeof vNode === 'number') {
        return document.createTextNode(String(vNode));
    }

    // Create the real DOM element
    const element = document.createElement(vNode.tag);

    // Process attributes
    for (const [key, value] of Object.entries(vNode.attrs || {})) {
        if (key.startsWith('on') && typeof value === 'function') {
            // Bind events (onClick, onChange, etc.)
            const eventName = key.slice(2).toLowerCase();
            bindEvent(element, eventName, value);
        } else if (key === 'className' || key === 'class') {
            element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else if (key === 'checked' || key === 'disabled' || key === 'selected') {
            element[key] = value;
        } else if (key === 'value') {
            element.value = value;
        } else {
            element.setAttribute(key, value);
        }
    }

    // Append child elements
    for (const child of vNode.children || []) {
        const childElement = createDOMElement(child);
        if (childElement) {
            element.appendChild(childElement);
        }
    }

    return element;
}

// ===============================
// Diffing Algorithm - Compare Trees
// ===============================

// Cache for storing the old virtual tree
const virtualTreeCache = new WeakMap();

function diff(oldNode, newNode) {
    // If no old node exists, create the new one
    if (!oldNode) {
        return { type: 'CREATE', newNode };
    }

    // If no new node exists, remove the old one
    if (!newNode) {
        return { type: 'REMOVE' };
    }

    // If types are different, replace
    if (typeof oldNode !== typeof newNode) {
        return { type: 'REPLACE', newNode };
    }

    // If it's a text node
    if (typeof newNode === 'string' || typeof newNode === 'number') {
        if (oldNode !== newNode) {
            return { type: 'REPLACE', newNode };
        }
        return null;
    }

    // If tag changed, replace
    if (oldNode.tag !== newNode.tag) {
        return { type: 'REPLACE', newNode };
    }

    // Compare attributes and children
    return {
        type: 'UPDATE',
        attrs: diffAttrs(oldNode.attrs, newNode.attrs),
        children: diffChildren(oldNode.children, newNode.children)
    };
}

function diffAttrs(oldAttrs = {}, newAttrs = {}) {
    const patches = [];

    // New or changed attributes
    for (const [key, value] of Object.entries(newAttrs)) {
        if (oldAttrs[key] !== value) {
            patches.push({ key, value });
        }
    }

    // Removed attributes
    for (const key of Object.keys(oldAttrs)) {
        if (!(key in newAttrs)) {
            patches.push({ key, value: undefined });
        }
    }

    return patches;
}

function diffChildren(oldChildren = [], newChildren = []) {
    const patches = [];
    const maxLength = Math.max(oldChildren.length, newChildren.length);

    for (let i = 0; i < maxLength; i++) {
        patches.push(diff(oldChildren[i], newChildren[i]));
    }

    return patches;
}

// ===============================
// Patching - Apply Changes to DOM
// ===============================

function patch(parent, patches, index = 0) {
    if (!patches) return;

    const element = parent.childNodes[index];

    switch (patches.type) {
        case 'CREATE': {
            const newElement = createDOMElement(patches.newNode);
            if (newElement) {
                parent.appendChild(newElement);
            }
            break;
        }

        case 'REMOVE': {
            if (element) {
                parent.removeChild(element);
            }
            break;
        }

        case 'REPLACE': {
            const newElement = createDOMElement(patches.newNode);
            if (element && newElement) {
                parent.replaceChild(newElement, element);
            } else if (newElement) {
                parent.appendChild(newElement);
            }
            break;
        }

        case 'UPDATE': {
            if (element) {
                patchAttrs(element, patches.attrs);
                patchChildren(element, patches.children);
            }
            break;
        }
    }
}

function patchAttrs(element, attrPatches) {
    for (const { key, value } of attrPatches) {
        if (key.startsWith('on') && typeof value === 'function') {
            const eventName = key.slice(2).toLowerCase();
            bindEvent(element, eventName, value);
        } else if (value === undefined) {
            element.removeAttribute(key);
        } else if (key === 'className' || key === 'class') {
            element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else if (key === 'checked' || key === 'disabled' || key === 'value') {
            element[key] = value;
        } else {
            element.setAttribute(key, value);
        }
    }
}

function patchChildren(parent, childPatches) {
    for (let i = 0; i < childPatches.length; i++) {
        patch(parent, childPatches[i], i);
    }
}

// ===============================
// Mount - Attach App to DOM
// ===============================

export function mount(target, vNode) {
    // Get the target element
    const container = typeof target === 'string'
        ? document.querySelector(target)
        : target;

    if (!container) {
        console.error('Mount target not found:', target);
        return;
    }

    // Get the old virtual tree
    const oldVNode = virtualTreeCache.get(container);

    if (!oldVNode) {
        // First time - create from scratch
        container.innerHTML = '';
        const element = createDOMElement(vNode);
        if (element) {
            container.appendChild(element);
        }
    } else {
        // Update using diffing
        const patches = diff(oldVNode, vNode);
        patch(container, patches, 0);
    }

    // Cache the new virtual tree
    virtualTreeCache.set(container, vNode);
}

// ===============================
// Render - Helper function for updates
// ===============================

export function render(component, target) {
    const vNode = typeof component === 'function' ? component() : component;
    mount(target, vNode);
}