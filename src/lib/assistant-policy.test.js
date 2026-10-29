import { describe, expect, it } from "bun:test";
import { ownsConversation } from "./assistant-policy.ts";

describe("Account-saved separate conversations", () => {
  it("allows only the conversation's account", () => {
    expect(ownsConversation("account-a", "account-a")).toBe(true);
    expect(ownsConversation("account-a", "account-b")).toBe(false);
    expect(ownsConversation("account-a", "")).toBe(false);
  });
});
