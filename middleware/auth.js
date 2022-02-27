// ======================================== //
// ===== ====  Helper Functions  ==== ===== //
// ======================================== //

const checkLogin = (req, res, next) => {
  // console.log('req.cookies:', req.cookies);
  req.isUserLoggedIn = false;
  
  if (req.cookies.loggedInHash) {
    req.isUserLoggedIn = true;
  }

  next();
};

export default checkLogin;