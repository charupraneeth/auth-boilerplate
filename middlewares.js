function validateUserDetails(username, email, password, password2) {
  // adding errors filter
  // if any field is empty
  const errors = [];
  if (!username || !email || !password || !password2)
    errors.push({ message: "Please enter all the fields" });

  // if length of password is less than 6
  if (password.length < 6)
    errors.push({ message: "password should be atleast 6 characters" });

  // if both the passwords do not match
  if (password !== password2)
    errors.push({ message: "passwords do not match" });
  return errors;
}

function redirectLogin(req, res, next) {
  if (!req.session.userId) {
    res.render("login", {
      message: "user should be logged in to view this page",
    });
  } else {
    next();
  }
}

function redirectDashboard(req, res, next) {
  if (req.session.userId) {
    res.redirect("/users/dashboard");
  } else {
    next();
  }
}
module.exports = {
  validateUserDetails,
  redirectLogin,
  redirectDashboard,
};
