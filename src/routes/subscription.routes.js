import { Router } from "express";
import {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

router.route("/c/:channelId").get(getSubscribedChannels).post(toggleSubscription);

router.route("/u/:subscribersId").get(getUserChannelSubscribers);


export default router;