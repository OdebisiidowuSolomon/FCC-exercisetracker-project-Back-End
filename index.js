const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const app = express();
const cors = require("cors");
require("dotenv").config();

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static("public"));

// Models

const UserSchema = mongoose.Schema({
  username: String,
});

const ExerciseSchema = mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: Date,
});

const LogSchema = mongoose.Schema({
  username: String,
  count: Number,
  log: [
    {
      description: String,
      duration: Number,
      date: Date,
    },
  ],
});

const User = mongoose.model("User", UserSchema);
const Exercise = mongoose.model("Exercise", ExerciseSchema);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/users", (req, res) => {
  User.find()
    .then((resp) => {
      res.json(resp);
    })
    .catch((err) => res.json({ error: "Something went wrong" }));
});

app.post("/api/users", (req, res) => {
  let { username } = req.body;
  if (username) {
    User.find({ username }).then((resp) => {
      if (resp.length === 0) {
        let _user = new User({ username });

        _user
          .save()
          .then((user) => res.json({ ...user }))
          .catch((err) => res.json({ message: "something went wrong" }));
      } else {
        res.json({ ...resp[0]._doc });
      }
    });
  } else res.json({ error: "Invalid input" });
});

app.post("/api/users/:id/exercises", (req, res) => {
  let { description, duration, date } = req.body;
  let _id = req.body[":_id"];

  if ((description, duration, _id)) {
    Exercise.find({ _id })
      .then((resp) => {
        if (resp.length === 0) {
          try {
            User.find({ _id }).then((users) => {
              let username = users[0].username;
              if (!date) {
                date = new Date().toDateString();
              } else if (
                date &&
                date.split("-")[1] &&
                new Date(date) != "Invalid Date"
              ) {
                let dateObj = new Date(date);
                if (dateObj.getTime()) {
                  date = dateObj.toDateString();
                }
              }
              console.log(date);
              let _exercise = new Exercise({
                username,
                description,
                duration,
                date,
              });
              _exercise
                .save()
                .then((exercise) =>
                  res.json({
                    ...exercise._doc,
                    date: new Date(date).toDateString(),
                  })
                )
                .catch((err) =>
                  res.json({
                    error: "something went wrong",
                    messsage: err.message,
                  })
                );
            });
          } catch (err) {
            res.send(err);
          }
        } else {
          res.json({ ...resp[0]._doc });
        }
      })
      .catch({ error: "No User Found" });
  } else res.json({ error: "Invalid input" });
});

app.get("/api/users/:id/logs", (req, res) => {
  const _id = req.params.id;
  const { from, to, limit } = req.query;
  console.log(from, to, limit);
  console.log(_id, isNaN(_id));
  if (_id) {
    User.find({ _id })
      .then((users) => {
        let user = users[0];
        Exercise.find({ username: user.username })
          .limit(limit ? limit : null)
          .then((exercises) => {
            let _exercises = exercises.map(
              ({ date, description, duration }) => ({
                description,
                duration,
                date: new Date(date).toDateString(),
              })
            );
            if (from && new Date(from) != "Invalid Date") {
              let _fromDate = new Date(from).getTime();
              _exercises = _exercises
              .filter((exercise) => {
                  return new Date(exercise.date).getTime() >= _fromDate;
                })
            }
            if (to && new Date(to) != "Invalid Date") {
              let _toDate = new Date(to).getTime();
              _exercises = _exercises
                .filter((exercise) => {
                  return new Date(exercise.date).getTime() <= _toDate;
                })
            }

            let _jsonObject = {
              _id,
              username: user.username,
              count: exercises.length,
              log: _exercises,
            }

            if(from) {
              _jsonObject['from'] = new Date(from).toDateString()
            } 
            
            if(to) {
              _jsonObject['to'] = new Date(to).toDateString()
            }

            return res.json(_jsonObject);
          });
      })
      .catch((err) => res.json({ error: "Something went wrong" }));
  } else {
    res.json({ error: "Something went wrong" });
  }
});

mongoose
  .connect(process.env.MONGO_URI)
  .then((res) => {
    const listener = app.listen(process.env.PORT || 3000, () => {
      console.log("Your app is listening on port " + listener.address().port);
    });
  })
  .catch((err) => console.log(err));
