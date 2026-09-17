import { describe, expect, it } from "vitest";
import { getPublicShellDelivery } from "./_core/vite";

describe("public SPA shell delivery", () => {
  it("keeps public content routes available while identifying private shell routes for noindex", () => {
    expect(getPublicShellDelivery("/")).toEqual({ isKnownRoute: true, isPrivateRoute: false });
    expect(getPublicShellDelivery("/menu/espresso-based")).toEqual({ isKnownRoute: true, isPrivateRoute: false });
    expect(getPublicShellDelivery("/checkout")).toEqual({ isKnownRoute: true, isPrivateRoute: true });
    expect(getPublicShellDelivery("/order/CFM-ABC123")).toEqual({ isKnownRoute: true, isPrivateRoute: true });
  });

  it("normalizes trailing slashes and identifies unknown paths for a real 404 response", () => {
    expect(getPublicShellDelivery("/visit/")).toEqual({ isKnownRoute: true, isPrivateRoute: false });
    expect(getPublicShellDelivery("/not-a-coffeemistry-page")).toEqual({ isKnownRoute: false, isPrivateRoute: false });
  });
});
