import express, { Router } from "express";
import { createARoom, deleteARoom, getAllRooms, getRoomDetails, updateRoom, inviteToRoom, getPendingInvites, getSocialRooms, getMyInvitedRooms, leaveInvite } from "../controllers/RoomsController";
import { joinRoom, leaveARoom } from "../services/RoomServices";

const router: Router = express.Router();

router.route("/createARoom").post(createARoom);
router.route("/getRoomDetails/:id").get(getRoomDetails);
router.route("/getAllRooms").get(getAllRooms);
router.route("/deleteARoom/:id").delete(deleteARoom);
router.route("/updateRoom/:id").put(updateRoom);
router.route("/joinRoom/:roomId").put(joinRoom);
router.route("/leaveRoom/:roomId").put(leaveARoom);
router.route("/invite/:id").post(inviteToRoom);
router.route("/pendingInvites/:email").get(getPendingInvites);
router.route("/social/:email").get(getSocialRooms);
router.route("/myRooms/:email").get(getMyInvitedRooms);
router.route("/leaveInvite/:id").delete(leaveInvite);

export default router;
