import express from "express";
import initMainControlller from "../controllers/mainController.mjs";

const router = express.Router();
const MainController = initMainControlller();

router.get('/', MainController.getLogin);
router.post('/', MainController.postLogin);

export default router;