import { describe, expect, it } from "vitest";
import { getUpdateGlowTone, isNearBottom, UPDATE_GLOW_TONES } from "./chatEffects";

describe("chatEffects", () => {
  it("rotates through the premium glow palette deterministically", () => {
    expect(UPDATE_GLOW_TONES).toEqual(["violet", "rose", "emerald", "sky"]);
    expect(getUpdateGlowTone(0)).toBe("violet");
    expect(getUpdateGlowTone(1)).toBe("rose");
    expect(getUpdateGlowTone(2)).toBe("emerald");
    expect(getUpdateGlowTone(3)).toBe("sky");
    expect(getUpdateGlowTone(4)).toBe("violet");
  });

  it("detects when the chat is still near the bottom", () => {
    const pinnedNode = { scrollHeight: 1200, scrollTop: 980, clientHeight: 180 };
    const reviewingNode = { scrollHeight: 1200, scrollTop: 700, clientHeight: 180 };

    expect(isNearBottom(null)).toBe(true);
    expect(isNearBottom(pinnedNode)).toBe(true);
    expect(isNearBottom(reviewingNode)).toBe(false);
  });
});
