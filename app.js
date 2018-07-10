require("dotenv").config();

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const express = require("express");
const favicon = require("serve-favicon");
const hbs = require("hbs");
const mongoose = require("mongoose");
const logger = require("morgan");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const flash = require("connect-flash");

const dbUrl = process.env.DBURL;

mongoose.Promise = Promise;
mongoose
  .connect(
    dbUrl,
    { useMongoClient: true }
  )
  .then(() => {
    console.log("Connected to Mongo!");
  })
  .catch(err => {
    console.error("Error connecting to mongo", err);
  });

const app_name = require("./package.json").name;
const debug = require("debug")(
  `${app_name}:${path.basename(__filename).split(".")[0]}`
);

const app = express();

// Middleware Setup
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  session({
    secret: "basic-auth-secret",
    cookie: { maxAge: 60000 },
    store: new MongoStore({
      mongooseConnection: mongoose.connection,
      ttl: 24 * 60 * 60 // 1 day
    }),
    resave: false,
    saveUninitialized: true
  })
);
app.use(flash());

require("./passport")(app);

// Express View engine setup

app.use(
  require("node-sass-middleware")({
    src: path.join(__dirname, "public"),
    dest: path.join(__dirname, "public"),
    sourceMap: true
  })
);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
app.use(express.static(path.join(__dirname, "public")));
app.use(favicon(path.join(__dirname, "public", "images", "favicon.ico")));

app.use((req, res, next) => {
  res.locals.title = "Express - Generated with IronGenerator";
  res.locals.user = req.user;
  if (req.user) {
    res.locals.isBoss = req.user.role === "Boss";
  }
  res.locals.message = req.flash("error");

  next();
});

const index = require("./routes/index");
app.use("/", index);
const auth = require("./routes/auth");
app.use("/auth/", auth);
const employees = require("./routes/employees");
app.use("/employees/", employees);
const coursesRouter = require("./routes/courseRouter");
app.use("/courses/", coursesRouter);
module.exports = app;
