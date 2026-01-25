// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import "@jest/globals";
import React from "react";

// Mock ResizeObserver (required by Radix UI components)
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock PointerEvent (required for Radix UI dialogs in jsdom)
class MockPointerEvent extends Event {
  constructor(type, props) {
    super(type, props);
    this.pointerType = props?.pointerType ?? "mouse";
    this.pointerId = props?.pointerId ?? 1;
    this.clientX = props?.clientX ?? 0;
    this.clientY = props?.clientY ?? 0;
  }
}
global.PointerEvent = MockPointerEvent;

// Mock HTMLElement.hasPointerCapture
Element.prototype.hasPointerCapture = jest.fn().mockReturnValue(false);
Element.prototype.setPointerCapture = jest.fn();
Element.prototype.releasePointerCapture = jest.fn();

// Mock scrollIntoView (required by Radix UI)
Element.prototype.scrollIntoView = jest.fn();

// Mock nanoid to avoid ES module transformation issues
jest.mock("nanoid", () => ({
  nanoid: () => "test-id-12345"
}));

// Mock use-stick-to-bottom ES module
jest.mock("use-stick-to-bottom", () => {
  const React = require("react");
  const StickToBottomMock = ({ children, className, ...props }) =>
    React.createElement("div", { className, "data-testid": "conversation", role: "log", ...props }, children);
  StickToBottomMock.Content = ({ children, className, ...props }) =>
    React.createElement("div", { className, "data-testid": "conversation-content", ...props }, children);
  return {
    StickToBottom: StickToBottomMock,
    useStickToBottomContext: jest.fn(() => ({
      isAtBottom: true,
      scrollToBottom: jest.fn(),
    })),
  };
});

// Mock streamdown and all @streamdown packages to avoid ES module transformation issues
jest.mock("streamdown", () => ({
  Streamdown: jest.fn(({ children }) => React.createElement(React.Fragment, null, children))
}));

jest.mock("@streamdown/cjk", () => ({
  cjk: jest.fn(() => ({}))
}));

jest.mock("@streamdown/code", () => ({
  code: jest.fn(() => ({}))
}));

jest.mock("@streamdown/math", () => ({
  math: jest.fn(() => ({}))
}));

jest.mock("@streamdown/mermaid", () => ({
  mermaid: jest.fn(() => ({}))
}));

// Polyfill for ReadableStream in test environment
const { ReadableStream, ReadableStreamDefaultController } = require("web-streams-polyfill");

global.ReadableStream = ReadableStream;
global.ReadableStreamDefaultController = ReadableStreamDefaultController;

// Polyfill for TextDecoder/TextEncoder
global.TextDecoder = global.TextDecoder || require("util").TextDecoder;
global.TextEncoder = global.TextEncoder || require("util").TextEncoder;

// Use WeakMap to store per-element values for scroll properties
const scrollHeightMap = new WeakMap();
const scrollWidthMap = new WeakMap();
const scrollTopMap = new WeakMap();
const scrollLeftMap = new WeakMap();
const clientHeightMap = new WeakMap();

// Mock Element.scrollHeight as a writable property with per-element storage
Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
  get() {
    return scrollHeightMap.get(this) || 0;
  },
  set(value) {
    scrollHeightMap.set(this, value);
  },
  configurable: true
});

// Mock Element.scrollWidth as a writable property with per-element storage
Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
  get() {
    return scrollWidthMap.get(this) || 0;
  },
  set(value) {
    scrollWidthMap.set(this, value);
  },
  configurable: true
});

// Mock Element.scrollTop as a writable property with per-element storage
Object.defineProperty(HTMLElement.prototype, "scrollTop", {
  get() {
    return scrollTopMap.get(this) || 0;
  },
  set(value) {
    scrollTopMap.set(this, value);
  },
  configurable: true
});

// Mock Element.scrollLeft as a writable property with per-element storage
Object.defineProperty(HTMLElement.prototype, "scrollLeft", {
  get() {
    return scrollLeftMap.get(this) || 0;
  },
  set(value) {
    scrollLeftMap.set(this, value);
  },
  configurable: true
});

// Mock Element.clientHeight as a writable property with per-element storage
Object.defineProperty(HTMLElement.prototype, "clientHeight", {
  get() {
    return clientHeightMap.get(this) || 0;
  },
  set(value) {
    clientHeightMap.set(this, value);
  },
  configurable: true
});

// Mock Element.scrollTo method to actually update scrollTop/scrollLeft
HTMLElement.prototype.scrollTo = jest.fn(function(options) {
  if (typeof options === "object") {
    if (options.top !== undefined) {
      this.scrollTop = options.top;
    }
    if (options.left !== undefined) {
      this.scrollLeft = options.left;
    }
  } else if (typeof options === "number") {
    this.scrollTop = options;
  }
});
