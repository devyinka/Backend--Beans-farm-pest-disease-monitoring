import type { FarmUpdatePayload } from "../../type/types";
import { getFarmNamespace } from "../namespace/farm.namespace";

export const FARM_UPDATE_EVENT = "farmupdate";

export const emitFarmUpdate = (payload: FarmUpdatePayload): void => {
  const farmNamespace = getFarmNamespace();

  if (!farmNamespace) {
    console.warn("[Socket] Farm namespace is not ready — skipping emit");
    return;
  }

  // Keep the event name stable so the frontend hook can consume it without extra mapping.
  farmNamespace.emit(FARM_UPDATE_EVENT, payload);
};
