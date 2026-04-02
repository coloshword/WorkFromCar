import { isSilent } from "./isSilent";

describe('isSilent()', () => {
  it("returns true for gmail.resolveContact", () => {
    expect(isSilent({ tool: "gmail.resolveContact", toolParameters: null })).toBe(true);
  });

  it("returns true for gmail.summarizeEmails", () => {
    expect(isSilent({ tool: "gmail.summarizeEmails", toolParameters: null })).toBe(true);
  });

  it("returns true for gcal.getEvents", () => {
    expect(isSilent({ tool: "gcal.getEvents", toolParameters: null })).toBe(true);
  });

  it("returns false for gmail.createDraft", () => {
    expect(isSilent({ tool: "gmail.createDraft", toolParameters: null })).toBe(false);
  });

  it("returns false for gcal.respondToEvent", () => {
    expect(isSilent({ tool: "gcal.respondToEvent", toolParameters: null })).toBe(false);
  });

  it("returns false for an unknown tool", () => {
    expect(isSilent({ tool: "unknown.tool", toolParameters: null })).toBe(false);
  });
});
