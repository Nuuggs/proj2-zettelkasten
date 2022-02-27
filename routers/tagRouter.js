import express from "express";
import initTagsControlller from "../controllers/tagsController.mjs";

const router = express.Router();
const TagController = initTagsControlller();

router.get('/:tag/delete', TagController.deleteTag);
router.get('/:tag', TagController.getTagNotes);
router.get('/', TagController.getAllTags);

export default router;