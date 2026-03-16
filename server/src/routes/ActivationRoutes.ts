import express, { Router } from "express";
import { activateUser, checkNameAvailable, deactivateUser } from "../controllers/UserActivation";

const router: Router = express.Router();

router.route("/activateUser").post(activateUser);
router.route("/deactivateUser").put(deactivateUser);
router.route("/checkName").post(checkNameAvailable);

export default router;