/**
 * UI image asset paths.
 * Keep public asset references centralized so components stay display-only.
 */

import type { RouteType } from "../types";

export const ROUTE_CARD_IMAGES: Record<RouteType, string> = {
  straight: "/assets/cards/routes/route-straight.png",
  turn: "/assets/cards/routes/route-corner.png",
  tee: "/assets/cards/routes/route-t.png",
  cross: "/assets/cards/routes/route-cross.png",
};

export const LANDMARK_IMAGES: Record<string, string> = {
  火山: "/assets/cards/landmarks/volcano.png",
  木屋: "/assets/cards/landmarks/cabin.png",
  篝火: "/assets/cards/landmarks/campfire.png",
  淡水湖: "/assets/cards/landmarks/lake.png",
  山洞: "/assets/cards/landmarks/cave.png",
};

export const CARD_BACK_IMAGE = "/assets/cards/back/card-back.png";

export const FINISH_IMAGE = "/assets/cards/finish/Finish.png";

