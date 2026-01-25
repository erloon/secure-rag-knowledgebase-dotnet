const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;

// Apply our mocks
require('./jest.setup.js');

const mockElement = document.createElement("div");
console.log("Before setting properties:");
console.log("  scrollTop:", mockElement.scrollTop);
console.log("  scrollHeight:", mockElement.scrollHeight);
console.log("  clientHeight:", mockElement.clientHeight);

mockElement.scrollTop = 100;
mockElement.scrollHeight = 500;
mockElement.clientHeight = 100;

console.log("After setting properties:");
console.log("  scrollTop:", mockElement.scrollTop);
console.log("  scrollHeight:", mockElement.scrollHeight);
console.log("  clientHeight:", mockElement.clientHeight);

const distanceFromBottom = 500 - 100 - 100;
console.log("  distanceFromBottom:", distanceFromBottom);
console.log("  BOTTOM_THRESHOLD:", 50);
console.log("  isAtBottom:", distanceFromBottom <= 50);
