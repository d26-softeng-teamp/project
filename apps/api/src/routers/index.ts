import { router } from "../lib/trpc";
import { appUserRouter } from "./appUser";
import { contentRouter } from "./content";
import { employeeRouter } from "./employee";
import { healthRouter } from "./health";
import { userRouter } from "./user";

export const appRouter = router({
  health: healthRouter,
  user: userRouter,
  employee: employeeRouter,
  content: contentRouter,
  appUser: appUserRouter,
});

export type AppRouter = typeof appRouter;
