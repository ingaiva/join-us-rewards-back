var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const result =require('dotenv').config();


//Middleware//
var cors = require("./middleware/cors");

const mongoose = require("mongoose");
mongoose.connect(`mongodb:${process.env.DB_HOST}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Nos Routes //
var admin = require("./routes/admin");
var catalogue = require("./routes/catalogue");

var userRouter = require("./routes/user");

var app = express();

// view engine setup

app.use(cors.handle);
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// URL //
app.use("/admin", admin);
app.use("/user", userRouter);
app.use("/catalogue", catalogue);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
