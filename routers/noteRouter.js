import express from "express";
import initNotesControlller from "../controllers/notesController.mjs";

const router = express.Router();
const NotesController = initNotesControlller();

router.get('/all', NotesController.getAllNotes);
router.get('/:id/:tag/delete', NotesController.deleteNoteTag);
router.get('/:id/delete', NotesController.deleteNote);
router.get('/:id', NotesController.getNote);
router.post('/:id', NotesController.postNote);
router.get('/', NotesController.getNoteForm); // => app.get(/note)
router.post('/', NotesController.postNoteForm);//=> app.post(/note)



export default router;