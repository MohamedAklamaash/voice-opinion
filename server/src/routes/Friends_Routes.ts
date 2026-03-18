import express, { Router } from "express";
import {
    sendFriendRequest,
    respondToRequest,
    getFriends,
    getPendingRequests,
    getSentRequests,
    searchUsers,
} from "../controllers/FriendsController";

const router: Router = express.Router();

router.post("/request", sendFriendRequest);
router.put("/respond", respondToRequest);
router.get("/list/:email", getFriends);
router.get("/pending/:email", getPendingRequests);
router.get("/sent/:email", getSentRequests);
router.get("/search", searchUsers);

export default router;
