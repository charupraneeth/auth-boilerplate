const { urlencoded } = require("express");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 1337;
const { pool, connectionString } = require("./dbConfig");
const bcrypt = require("bcrypt");
const session = require("express-session");
require("dotenv").config();
const pgSession = require("connect-pg-simple")(session);

const {
  validateUserDetails,
  redirectLogin,
  redirectDashboard,
} = require("./middlewares");

// require("dotenv").config();
// app.use(express.json());
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    store: new pgSession({
      pool: pool,
      tableName: "session",
    }),
    name: process.env.SESSION_NAME,
    resave: false,
    cookie: {
      maxAge: parseInt(process.env.SESSION_LIFETIME),
      sameSite: true,
      secure: process.env.NODE_ENV === "production",
    },
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.listen(PORT, () => {
  console.log(`server listening on port : ${PORT}`);
});

app.get("/", redirectDashboard, (req, res) => {
  res.render("index");
});

app.get("/users/login", redirectDashboard, (req, res) => {
  res.render("login", { message: "" });
});

app.post("/users/login", redirectDashboard, async (req, res) => {
  const { email, password } = req.body;
  const errors = [];
  // get the users collection from DB
  const usersCollection = await pool.query(
    "select * from users where email=$1",
    [email]
  );

  // if length of collection is not 1 user exists
  if (usersCollection.rowCount < 1) {
    res.render("login", {
      message: "user does not exist, create a new account",
    });
  }
  // else user exists
  else {
    // try to login the user
    const user = usersCollection.rows[0];
    // check if passwords match
    const match = await bcrypt.compare(password, user.password);

    // if not matched
    if (!match) {
      res.render("login", { message: "email/password does'nt match" });
    }
    // else if passwords are matched
    else {
      req.session.userId = user.id;
      req.session.username = user.name;
      res.redirect("/users/dashboard");
    }
  }
});

app.get("/users/register", redirectDashboard, (req, res) => {
  res.render("register");
});

app.post("/users/register", redirectDashboard, async (req, res) => {
  const { username, email, password, password2 } = req.body;

  // check for errors in user details
  const errors = validateUserDetails(username, email, password, password2);

  // rendering register page with errors if any
  if (errors.length > 0) res.render("register", { errors });
  // else try adding user into DB
  else {
    try {
      const usersCollection = await pool.query(
        "SELECT * from users where email = $1",
        [email]
      );
      console.log(usersCollection.rowCount);

      // If the user already exists
      //render the login page with message
      if (usersCollection.rowCount) {
        res.render("login", { message: "user already exists" });
      }

      //else
      // hash the password and add the user to the DB
      else {
        const hashedPassword = await bcrypt.hash(password, 8);
        const user = await pool.query(
          "INSERT into users(name,email,password) VALUES($1,$2,$3)",
          [username, email, hashedPassword]
        );
        // console.log(hashedPassword);
        res.render("login", {
          message: "successfully created account now you can login",
        });
      }
    } catch (error) {
      console.log(error);
      res.render("register", { error });
    }
  }
});

app.get("/users/dashboard", redirectLogin, (req, res) => {
  res.render("dashboard", {
    username: req.session.username,
  });
});

app.get("/users/logout", redirectLogin, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect("/users/dashboard");
    }
    res.clearCookie(process.env.SESSION_NAME);
    res.redirect("/");
  });
});
app.post("/users/logout", redirectLogin, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect("/users/dashboard");
    }
    res.clearCookie(process.env.SESSION_NAME);
    res.redirect("/");
  });
});
