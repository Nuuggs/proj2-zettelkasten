import express from 'express';

import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';

import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { checkLogin, getLanding, getSignup, postSignup, getLogin, postLogin, getDashboard, getLogout, getNoteForm, postNoteForm, getNote, postNote, deleteNote, getAllNotes, getTagNotes, deleteCategory } from "./index.js"
// ======================================== //
// ===== ==== ===== Setup ===== ===== ===== //
// ======================================== //

const __dirname = dirname(fileURLToPath(import.meta.url));

// Initialize express
const app = express();

// Set view engine
app.set('view engine', 'ejs');

app.use(express.static(join(__dirname, 'public')));
// For request.body for post requests
app.use(express.urlencoded({ extended: false }));

// Method Override for PUT and DELETE requests
app.use(methodOverride('_method'));

// Cookie Parser
app.use(cookieParser());

// ======================================== //
// ===== ==== ===== Routes ===== ==== ===== //
// ======================================== //
app.use(checkLogin);

// ----- Landing Page ----- //
app.get('/', getLanding);

// ----- Sign Up ----- //
app.get('/signup', getSignup);
app.post('/signup', postSignup);

// ----- Log In ----- //
app.get('/login', getLogin);
app.post('/login', postLogin);


// ----- Dashboard ----- //
app.get('/dashboard/:user', getDashboard);

// ----- Log Out ----- //
app.get('/logout', getLogout);

// ----- Note ----- //
app.get('/note', getNoteForm);
app.post('/note', postNoteForm);
app.get('/note/:id', getNote);
app.post('/note/:id', postNote);
app.get('/note/:id/delete', deleteNote);
app.get('/notes', getAllNotes);
app.get('/notes/:tag', getTagNotes);
app.get('/notes/:tag/delete', deleteCategory);

// ======================================== //
// ===== ===== ===== Port ===== ===== ===== //
// ======================================== //
app.listen(3004);