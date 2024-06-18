import { describe, it, expect } from "vitest";

import { createSource } from ".";

describe("createSource", () => {
  it("should maintain the state and allow to retrieve it", () => {
    const source = createSource(10);
    expect(source.getState()).toBe(10);
  });

  it("should update the state and notify subscribers", () => {
    const source = createSource(10);
    let notifiedValue = null;
    source.subscribe((value) => {
      notifiedValue = value;
    });
    source.next(20);
    expect(source.getState()).toBe(20);
    expect(notifiedValue).toBe(20);
  });

  it("should allow multiple subscribers and notify them all", () => {
    const source = createSource(10);
    const notifications: unknown[] = [];
    source.subscribe((value) => notifications.push(`First: ${value}`));
    source.subscribe((value) => notifications.push(`Second: ${value}`));
    source.next(20);
    expect(notifications).toEqual(["First: 20", "Second: 20"]);
  });

  it("should handle unsubscribe correctly", () => {
    const source = createSource(10);
    const notifications: unknown[] = [];
    const unsubscribe = source.subscribe((value) => notifications.push(value));
    source.next(20); // Should notify
    unsubscribe(); // Unsubscribe
    source.next(30); // Should not notify
    expect(notifications).toEqual([20]); // Only the first notification should be in the array
  });
});
