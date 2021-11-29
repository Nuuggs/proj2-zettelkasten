import pg from 'pg';
import jsSHA from 'jssha';
import { DateTime } from 'luxon';

// Initialize DB connection for SQL database
const { Pool } = pg;
const pgConnectionConfigs = {
  user: 'bryluke000',
  host: 'localhost',
  database: 'zettelkasten',
  port: 5432,
};

const pool = new Pool(pgConnectionConfigs);

// DateTime
const dt = DateTime.now();


// ======================================== //
// ===== ==== === SALTINESS ===  ==== ===== //
// ======================================== //
const SALT = process.env.MY_ENV_VAR;
console.log('salt:', SALT);


// ======================================== //
// ===== ====  Helper Functions  ==== ===== //
// ======================================== //

export const checkLogin = (req, res, next) => {
  // console.log('req.cookies:', req.cookies);
  req.isUserLoggedIn = false;
  
  if (req.cookies.loggedInHash) {
    req.isUserLoggedIn = true;
  }

  next();
};

export const getLanding = (req, res) => {
  console.log('GET Request: /');
  console.log(req.isUserLoggedIn);
  if (req.isUserLoggedIn === true) {
    res.redirect(`/dashboard/${req.cookies.username}`)
  }
  res.render('landing');
};

export const getSignup = (req, res) => {
  console.log('GET Request: /signup');
  if (req.isUserLoggedIn === true) {
    res.redirect(`/dashboard/${req.cookies.username}`)
  }
  res.render('signup');
};

export const postSignup = (req, res) => {
  console.log('POST Request: /signup');
  
  const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8'});

  shaObj.update(req.body.password);

  const hashedPassword = shaObj.getHash('HEX');
  const queryArr = [
    req.body.username,
    hashedPassword
  ];
  
  const sqlQuery = "INSERT INTO users (username, password) VALUES ($1, $2)";
  pool.query(sqlQuery, queryArr, (insertQueryError, insertQueryResult) => {
    if ( insertQueryError ) {
      console.error('Insert Query Error', insertQueryError);
      res.status(400).send('Sorry an error was detected, please try again\n If issue persists, please contact support.<br><br><a href="/login">Try again</a>');
      return;
    }

    res.send('Your details are successfully stored. Redirecting you to the main page. Please attempt to log in.<br><br><a href="/">Back to Main</a>');

  });
};

export const getLogin = (req, res) => {
  console.log('GET Request: /login');
  if (req.isUserLoggedIn === true) {
    res.redirect(`/dashboard/${req.cookies.username}`)
  }

  res.render('login');
};

export const postLogin = (req, res) => {
  console.log("POST Request: /login");

  const sqlQuery = 'SELECT * FROM users WHERE username=$1';
  pool.query(sqlQuery, [req.body.username], (selectQueryError, selectQueryResult) => {
    if ( selectQueryError ) {
      console.error('Select Query Error: ', selectQueryError);
      res.status(503).send('Sorry an error was detected, please try again.<br> If issue persists, please contact support.<br><br><a href="/login">Try again</a>');
      return;
    }

    if ( selectQueryResult.length === 0 ) {
      res.status(403).send('Sorry an error was detected, please try again.<br> If issue persists, please contact support.<br><br><a href="/login">Try again</a>');
    }

    const user = selectQueryResult.rows[0];

    const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
    shaObj.update(req.body.password);
    const hashedPassword = shaObj.getHash('HEX');

    if ( user.password === hashedPassword ) {
      
      res.cookie('username', user.username);
      res.cookie('id', user.id)

      const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8'});
      const unhashedCookieString = `${user.username}-${SALT}`;
      shaObj.update(unhashedCookieString);
      const hashedCookieString = shaObj.getHash('HEX');
      res.cookie('loggedInHash', hashedCookieString);

      res.redirect(`/dashboard/${user.username}`);
    } else {
      res.status(403).send('Sorry an error was detected, please try again.<br> If issue persists, please contact support.<br><br><a href="/login">Try again</a>');      
    }

  });
};

export const getLogout = (req, res) => {
  console.log('GET Request: /logout')
  res.clearCookie('loggedInHash');
  res.clearCookie('username');
  res.clearCookie('id');
  res.redirect('/');
};

export const getDashboard = (req, res) => {
  console.log('GET Request: /dashboard/:user');
  if (req.isUserLoggedIn === false) {
    res.status(403).send('Sorry an error was detected, you are not logged in.<br> If issue persists, please contact support.<br><br><a href="/login">Try again</a>');    
    return; 
  }

  const {user} = req.params;
  console.log('username', user);
  console.log(req.params);
  // console.log(req);
  const ejsObj = {
    user: user,
    note: {},
    dt: dt 
  }

  const sqlQuery = 'SELECT * FROM notes ORDER BY id DESC LIMIT 1';
  pool.query(sqlQuery, (selectQueryError, selectQueryResult) => {
    if ( selectQueryError ) {
      console.error('Select Query Error: ', selectQueryError);
    }
    const lastNote = selectQueryResult.rows[0];
    console.log(lastNote);
    ejsObj.note = lastNote;
    res.render('dashboard', ejsObj);
  });
  
  return;
};

export const getNoteForm = (req, res) => {
  console.log('GET Request: /note');

  if (req.isUserLoggedIn === false) {
    res.status(403).send('Sorry an error was detected, you are not logged in.<br> If issue persists, please contact support.<br><br><a href="/login">Try again</a>');     
  }

  res.render('note-form');
};

export const postNoteForm = (req, res) => {
  console.log('POST Request: /note');
  
  // Query for user id
  const noteUserId = req.cookies.id;
  const inputIdentifier = req.body.identifier;
  const inputTitle = req.body.title;
  const inputTag = req.body.tag;
  const inputContent = req.body.content;
  const inputLink = req.body.link;

  const queryArr = [noteUserId, inputIdentifier, inputTitle, inputContent];
  
  const sqlQuery = "INSERT INTO notes (user_id, identifier, title, content) VALUES ($1, $2, $3, $4) RETURNING id";
  pool.query(sqlQuery, queryArr, (insertQueryError, insertQueryResult) => {
    if ( insertQueryError ) {
      if ( insertQueryError.code === '23505') {
        console.log(insertQueryError);
        res.status(400).send('Sorry the identifier you chose has been used before, please try again with a different identifier<br> If issue persists, please contact support.<br><br><a href="/note">Back</a>');
        return;
      }
      console.error('Insert Query Error', insertQueryError);
      res.status(400).send('Sorry an error was detected, please try again\n If issue persists, please contact support.<br><br><a href="/note">Try again</a>');
      return;
    }
    console.log(insertQueryResult.rows[0].id);
    res.redirect(`/note/${insertQueryResult.rows[0].id}`);

  });
};

export const getNote = (req, res) => {
  console.log('GET Request: /note/:id');

  if (req.isUserLoggedIn === false) {
    res.status(403).send('Sorry an error was detected, you are not logged in.<br> If issue persists, please contact support.<br><br><a href="/login">Try again</a>');     
  }
  console.log('note id: ', req.params.id);
  const noteId = req.params.id;
  req.note_id = noteId;
  const sqlQuery = `SELECT * FROM notes WHERE id=${noteId}`;
  pool.query(sqlQuery, (selectQueryError, selectQueryResult) => {
    if( selectQueryError ) {
      console.error('Select Query Note Id Error: ', selectQueryError);
    }
    
    const ejsObj = selectQueryResult.rows[0];
    console.log(ejsObj);

    res.render('note', ejsObj);
  });
  
};

export const postNote = (req, res) => {
  console.log('POST Request: /note/:id');
  
  const noteId = req.body.note_id;
  const inputIdentifier = req.body.identifier;
  const inputTitle = req.body.title;
  const inputTag = req.body.tag;
  const inputContent = req.body.content;
  const inputLink = req.body.link;
  
  const sqlQuery = `UPDATE notes SET identifier='${inputIdentifier}', title='${inputTitle}', content='${inputContent}' WHERE id=${noteId}`;
  console.log(sqlQuery);

  pool.query(sqlQuery, (updateQueryError, updateQueryResult) => {
    if( updateQueryError ) {
      console.error('Update Query Error: ', updateQueryError);
      return;
    }
    console.log('edit worked')
    res.redirect(`/note/${req.body.note_id}`);
  });
};

export const deleteNote = (req, res) => {
  const {index} = req.params;
};

export const getAllNotes = (req, res) => {
  console.log('GET Request: /notes');

  if (req.isUserLoggedIn === false) {
    res.status(403).send('Sorry an error was detected, you are not logged in.<br> If issue persists, please contact support.<br><br><a href="/login">Try again</a>');     
  }

  const sqlQuery = 'SELECT * FROM notes ORDER BY id asc';
  
  pool.query(sqlQuery, (selectQueryError, selectQueryResult) => {
    if( selectQueryError ) {
      console.error('Select Query Note Id Error: ', selectQueryError);
    }
    console.log(selectQueryResult.rows);
    const notesArray = selectQueryResult.rows;
    const ejsObj = {notesArray: notesArray};
    
    console.log(ejsObj);
    // res.send('testing...');
    res.render('notes', ejsObj);
  });

}

