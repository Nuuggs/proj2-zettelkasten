import express from 'express';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';

import bindRoutes from './routes.mjs';

// Initialize express
const app = express();

// Set view engine
app.set('view engine', 'ejs');

// Expose the files stored in the public folder
app.use(express.static('public'));

// For request.body for post requests
app.use(express.urlencoded({ extended: false }));

// Method Override for PUT and DELETE requests
app.use(methodOverride('_method'));

// Cookie Parser
app.use(cookieParser());

bindRoutes(app);

const PORT = process.env.PORT || 3004;
app.listen(PORT);