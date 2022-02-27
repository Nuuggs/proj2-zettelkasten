import express from "express";
import initMainControlller from "../controllers/mainController.mjs";

const router = express.Router();
const MainController = initMainControlller();

router.get('/', MainController.getSignup);
router.post('/', MainController.postSignup);

export default router;