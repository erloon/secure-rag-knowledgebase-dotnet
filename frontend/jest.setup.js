// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import "@jest/globals";

// Polyfill for ReadableStream in test environment
const { ReadableStream, ReadableStreamDefaultController } = require("web-streams-polyfill");

global.ReadableStream = ReadableStream;
global.ReadableStreamDefaultController = ReadableStreamDefaultController;

// Polyfill for TextDecoder/TextEncoder
global.TextDecoder = global.TextDecoder || require("util").TextDecoder;
global.TextEncoder = global.TextEncoder || require("util").TextEncoder;

// Mock Element.scrollWidth and Element.scrollHeight as writable properties
Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
  writable: true,
  configurable: true,
  value: 0
});

Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
  writable: true,
  configurable: true,
  value: 0
});

Object.defineProperty(HTMLElement.prototype, "clientHeight", {
  writable: true,
  configurable: true,
  value: 0
});

// Mock Element.scrollTo method
HTMLElement.prototype.scrollTo = jest.fn();
