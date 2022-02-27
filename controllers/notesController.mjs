import pool from "../database.js";

export default function initNotesControlller(db) {
 
  const getNoteForm = (req, res) => {
    console.log('GET Request: /note');

    if (req.isUserLoggedIn === false) {
      res.status(403).send('Sorry an error was detected, you are not logged in.<br> If issue persists, please contact support.<br><br><a href="/login">Try again</a>');     
    }

    res.render('note-form');
  };

  const postNoteForm = (req, res) => {
    console.log('POST Request: /note');
    
    // Query for user id
    const noteUserId = req.cookies.id;
    const inputIdentifier = req.body.identifier;
    const inputTitle = req.body.title;
    const inputTag = req.body.tag;
    const inputContent = req.body.content;
    const inputLink = req.body.link;
    
    const queryArr = [noteUserId, inputIdentifier, inputTitle, inputContent];
    // Variables to store note and tag id
    let noteId = 0;
    let tagId = 0;
    // Functionality for tags and links - positioned here because below has redirect. Can refactor in future.
    // Tag insert
    pool
    .query("INSERT INTO notes (user_id, identifier, title, content) VALUES ($1, $2, $3, $4) RETURNING id", queryArr)
    .then((result) => {
      noteId = result.rows[0].id;
      console.log('note id: ', noteId);
      return pool.query(`SELECT id FROM tags WHERE tag_name='${inputTag}'`);
    })
    .then((result) => {
      // Input Validation for tags
      console.log('select test result: ', result.rows[0]);
      if ( result.rows[0] === undefined ) {
        if ( inputTag === '' ) {
          return 'skip';
        }
        return pool.query(`INSERT INTO tags (tag_name) VALUES ('${inputTag}') RETURNING id`);
      }
      else {
        return pool.query(`SELECT id FROM tags WHERE tag_name='${inputTag}'`);
      } 
    })  
    .then((result) => {
      console.log('looking for skip: ', result.rows)
      if ( result.rows[0] === 'skip') {
        return;
      }
      tagId = result.rows[0].id;
      console.log('tag id:', tagId);
      // Input validations for notes_tags
      return pool.query(`INSERT INTO notes_tags (note_id, tag_id) VALUES ('${noteId}', '${tagId}') RETURNING *`);
    })
    .then((result) => {
      res.redirect(`/note/${result.rows[0].note_id}`);
    })
    .catch((error) => {
      console.log('error found', error);
      res.status(400).send('Sorry an error was detected, please try again\n If issue persists, please contact support.<br><br><a href="/note">Try again</a>');
      return;
    });

  };

  const getNote = (req, res) => {
    console.log('GET Request: /note/:id');

    if (req.isUserLoggedIn === false) {
      res.status(403).send('Sorry an error was detected, you are not logged in.<br> If issue persists, please contact support.<br><br><a href="/login">Try again</a>');     
    }
    // console.log('note id: ', req.params.id);
    const noteId = req.params.id;
    req.note_id = noteId;

    let ejsObj;
    
    pool
      .query(`SELECT * FROM notes WHERE id=${noteId}`)
      .then ((result) => {
        if ( result.rows.length === 0 ) {
          res.redirect('/');
        }
        
        ejsObj = result.rows[0];
        ejsObj.tags = [];
        
        return pool.query(
          `SELECT notes_tags.note_id, notes_tags.tag_id, tags.id, tags.tag_name
          FROM notes_tags
          INNER JOIN tags
          ON notes_tags.tag_id = tags.id
          WHERE notes_tags.note_id=${noteId}`
        )
      })
      .then ((result) => {
        if ( result.rows[0] === undefined){
          res.render('note', ejsObj);
          return;
        }
        else {
          result.rows.forEach((tag) => {
            ejsObj.tags.push(tag);
          });

          res.render('note', ejsObj);
        }
      })
      .catch((error) => console.error('getNote Error: ', error))
      
  };

  const postNote = (req, res) => {
    console.log('POST Request: /note/:id');

    const noteId = req.body.note_id;
    const inputIdentifier = req.body.identifier;
    const inputTitle = req.body.title;
    const inputTag = req.body.tag;
    const inputContent = req.body.content;
    const inputLink = req.body.link;

    let tagId = 0;
    
    const sqlQuery = `UPDATE notes SET identifier='${inputIdentifier}', title='${inputTitle}', content='${inputContent}' WHERE id=${noteId}`;

    pool
    .query(sqlQuery)
    .then((result) => {
      console.log('edit worked');
      // Input validation for tags
      return pool.query(`SELECT id FROM tags WHERE tag_name='${inputTag}'`);
    })
    .then((result) => {
      console.log('input tag: ', inputTag);
      console.log('selecting tag: ', result.rows[0]);
      if ( result.rows[0] === undefined ) {
        if ( inputTag === '') {
          return 'skip';
        }
        return pool.query(`INSERT INTO tags (tag_name) VALUES ('${inputTag}') RETURNING id`);
      }
      else {
        return pool.query(`SELECT id FROM tags WHERE tag_name='${inputTag}'`);
      }
      
    })
    .then((result) => {
      console.log('finding skip... ', result);
      if ( result === 'skip' ) {
        return 'skip';
      }
      tagId = result.rows[0].id;
      console.log('tag id:', tagId);
      // Input validation for notes_tags
      return pool.query(`SELECT id FROM notes_tags WHERE note_id=${noteId} AND tag_id=${tagId}`)
    })
    .then((result) => {
      if ( result === 'skip' ) {
        return 'skip';
      }

      if ( result.rows[0] === undefined) {
      return pool.query(`INSERT INTO notes_tags (note_id, tag_id) VALUES ('${noteId}', '${tagId}') RETURNING *`);
      }
      else {return;}
    })
    .then((result) => {
      res.redirect(`/note/${noteId}`);
    })
    .catch((error) => console.error(error.stack));      
  };

  const deleteNote = (req, res) => {
    const noteId = req.params.id;

    pool.query(`DELETE FROM notes WHERE id=${noteId}`)
      .then((result) => pool.query(`DELETE FROM notes_tags WHERE note_id=${noteId}`))
      .then((result) => res.redirect('/'))
      .catch((error) => {console.error(error)});

  };

  const getAllNotes = (req, res) => {
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

  };

  const deleteNoteTag = (req, res) => {
    console.log('GET Request: /delete/:id/:tag/');
    const noteId = req.params.id;
    const tag = req.params.tag;

    pool.query(`SELECT id from tags WHERE tag_name='${tag}'`)
    .then((result) => {
      const tagId = result.rows[0].id;
      return pool.query(`DELETE FROM notes_tags WHERE note_id=${noteId} AND tag_id=${tagId}`)
    })
    .then((result) => res.redirect(`/note/${noteId}`))
    .catch((error) => console.error(error));

  };
  
  return {
    getAllNotes, deleteNoteTag, deleteNote, getNote, postNote, getNoteForm, postNoteForm
  };
}