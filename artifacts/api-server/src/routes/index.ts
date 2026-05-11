import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ordersRouter from "./orders";
import customersRouter from "./customers";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(ordersRouter);
router.use(customersRouter);
router.use(analyticsRouter);

export default router;
