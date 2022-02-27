const SALT = process.env.MY_ENV_VAR;
import jsSHA from "jssha";
import pool from "../database.js";
import { DateTime } from 'luxon';

let dt = DateTime.now();

export default function initMainControlller(db) {
  
  const getDashboard = (req, res) => {
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
  
  const getLanding = (req, res) => {
    console.log('GET Request: /');
    console.log(req.isUserLoggedIn);
    if (req.isUserLoggedIn === true) {
      res.redirect(`/dashboard/${req.cookies.username}`)
    }
    res.render('landing');
  };

  const getLogin = (req, res) => {
    console.log('GET Request: /login');
    if (req.isUserLoggedIn === true) {
      res.redirect(`/dashboard/${req.cookies.username}`)
    }

    res.render('login');
  };

  const postLogin = (req, res) => {
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

  const getLogout = (req, res) => {
    console.log('GET Request: /logout')
    res.clearCookie('loggedInHash');
    res.clearCookie('username');
    res.clearCookie('id');
    res.redirect('/');
  };

  const getSignup = (req, res) => {
    console.log('GET Request: /signup');
    if (req.isUserLoggedIn === true) {
      res.redirect(`/dashboard/${req.cookies.username}`)
    }
    res.render('signup');
  };

  const postSignup = (req, res) => {
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

  return {
    getDashboard, getLanding, getLogin, postLogin, getLogout, getSignup, postSignup,
  }
}