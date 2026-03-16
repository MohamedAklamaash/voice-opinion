import express, { Router } from "express";
import { createARoom, deleteARoom, getAllRooms, getRoomDetails, updateRoom, inviteToRoom, getPendingInvites } from "../controllers/RoomsController";
import { joinRoom, leaveARoom } from "../services/RoomServices";

const router: Router = express.Router();

//room controllers
router.route("/createARoom").post(createARoom);
router.route("/getRoomDetails/:id").get(getRoomDetails);
router.route("/getAllRooms").get(getAllRooms);
router.route("/deleteARoom/:id").delete(deleteARoom);
router.route("/updateRoom/:id").put(updateRoom);

//room services
router.route("/joinRoom/:roomId").put(joinRoom);
router.route("/leaveRoom/:roomId").put(leaveARoom);
router.route("/invite/:id").post(inviteToRoom);
router.route("/pendingInvites/:email").get(getPendingInvites);

export default router;