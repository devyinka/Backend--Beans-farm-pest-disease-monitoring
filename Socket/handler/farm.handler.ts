import type { FarmUpdatePayload } from "../../type/types";
import { getFarmNamespace } from "../namespace/farm.namespace";

export const FARM_UPDATE_EVENT = "farmupdate";

//i connected this to the fronted at DashboardPage.tsx in the useEffect that listens to the farmupdate event. I also added a console log to make sure it works and it does. I will now connect this to the backend where the farm data is updated and emit the event with the new data.
export const emitFarmUpdate = (payload: FarmUpdatePayload): void => {
  const farmNamespace = getFarmNamespace();

  if (!farmNamespace) {
    console.warn("[Socket] Farm namespace is not ready — skipping emit");
    return;
  }

  // Keep the event name stable so the frontend hook can consume it without extra mapping.
  farmNamespace.emit(FARM_UPDATE_EVENT, payload);
};
