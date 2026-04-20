import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

const STUB_W = 400;
const STUB_H = 800;

// jsdom reports 0 for every element's layout (no actual rendering). Stub the
// common size readers so libraries that compute layout from clientHeight /
// getBoundingClientRect (notably @tanstack/react-virtual) can produce a
// non-empty initial render.
Object.defineProperty(HTMLElement.prototype, "clientHeight", {
  configurable: true,
  value: STUB_H,
});
Object.defineProperty(HTMLElement.prototype, "clientWidth", {
  configurable: true,
  value: STUB_W,
});
Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
  configurable: true,
  value: STUB_H,
});
Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
  configurable: true,
  value: STUB_W,
});
HTMLElement.prototype.getBoundingClientRect = function (): DOMRect {
  return {
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: STUB_W,
    bottom: STUB_H,
    width: STUB_W,
    height: STUB_H,
    toJSON() {
      return this;
    },
  } as DOMRect;
};

// jsdom does not implement ResizeObserver. @radix-ui uses it for tooltip sizing
// (we just need a no-op there) and @tanstack/react-virtual uses it to learn the
// scroll element's size (we need to actually report the stubbed dimensions).
class ResizeObserverStub {
  private cb: ResizeObserverCallback;
  constructor(cb: ResizeObserverCallback) {
    this.cb = cb;
  }
  observe(target: Element) {
    const entry = {
      target,
      contentRect: target.getBoundingClientRect(),
      borderBoxSize: [{ inlineSize: STUB_W, blockSize: STUB_H }],
      contentBoxSize: [{ inlineSize: STUB_W, blockSize: STUB_H }],
      devicePixelContentBoxSize: [{ inlineSize: STUB_W, blockSize: STUB_H }],
    } as unknown as ResizeObserverEntry;
    this.cb([entry], this as unknown as ResizeObserver);
  }
  unobserve() {}
  disconnect() {}
}
(globalThis as typeof globalThis & { ResizeObserver: unknown }).ResizeObserver =
  ResizeObserverStub;

afterEach(() => {
  cleanup();
});
