import pool from "../database.js";

export default function initTagsControlller(db) {
  
  const getAllTags = (req, res) => {
    if (req.isUserLoggedIn === false) {
      res.status(403).send('Sorry an error was detected, you are not logged in.<br> If issue persists, please contact support.<br><br><a href="/login">Try again</a>');     
    }

    const sqlQuery = 'SELECT * FROM tags ORDER BY id asc';
    
    pool.query(sqlQuery, (selectQueryError, selectQueryResult) => {
      if( selectQueryError ) {
        console.error('Select Query Note Id Error: ', selectQueryError);
      }
      
      const tagsArray = selectQueryResult.rows;
      const ejsObj = {tagsArray: tagsArray};
      
      // res.send('testing...');
      res.render('tags', ejsObj);
    })
  };

  const getTagNotes = (req, res) => {
    console.log('GET Request: /tags/:tag')
    
    if (req.isUserLoggedIn === false) {
      res.status(403).send('Sorry an error was detected, you are not logged in.<br> If issue persists, please contact support.<br><br><a href="/login">Try again</a>');     
    }

    const selectedTag = req.params.tag;
    
    pool.query(`SELECT id FROM tags WHERE tag_name='${selectedTag}'`)
      .then((result) => {
        const selectedTagId = result.rows[0].id;

        return pool.query(`
        SELECT notes_tags.tag_id, notes_tags.note_id, notes.id, notes.identifier, notes.title, notes.title, notes.content
        FROM notes_tags
        INNER JOIN notes
        ON notes_tags.note_id = notes.id
        WHERE notes_tags.tag_id=${selectedTagId}`);
      })
      .then((result) => {
      const notesArray = result.rows;
      const ejsObj = {notesArray: notesArray};
      
      console.log(ejsObj);
      
      res.render('notes', ejsObj);
      })
  };

  const deleteTag = (req, res) => {
    console.log('GET Request: /tags/:tag/delete');

    const tag = req.params.tag;

    pool.query(`DELETE FROM tags WHERE tag_name='${tag}' returning id`)
      .then((result) => {
        const tagId = result.rows[0].id;
        return pool.query(`DELETE FROM notes_tags WHERE tag_id=${tagId}`)
      })
      .then((result) => res.redirect('/tags'))
      .catch((error) => console.error(error.stack));
  };

  return {
    deleteTag, getTagNotes, getAllTags
  };
};