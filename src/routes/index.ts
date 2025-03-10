import { Router } from "express";
import leadRoutes from "./lead.routes";
import followUpRoutes from "./follow-up-routes";

const router = Router();

router.use("/leads", leadRoutes);
router.use("/follow-up", followUpRoutes);

export default router;
