import { router } from "../lib/trpc";
import { contentRouter } from "./content";
import { employeeRouter } from "./employee";
import { healthRouter } from "./health";
import { userRouter } from "./user";
import { exampleRouter } from "./example";

export const appRouter = router({
  example: exampleRouter,
  health: healthRouter,
  user: userRouter,
  employee: employeeRouter,
  content: contentRouter,
});

export type AppRouter = typeof appRouter;
