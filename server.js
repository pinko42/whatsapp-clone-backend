//import express from "express";
const express = require("express");
const mongoose = require("mongoose");
const Pusher = require("pusher");
const Messages = require("./dbMessages");

const app = express();

const port = process.env.PORT || 9000;

const pusher = new Pusher({
  appId: "***",
  key: "****",
  secret: "****",
  cluster: "eu",
  useTLS: true,
});

//middleware

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

// db config
const connectdb =
  "your db ";

mongoose.connect(connectdb, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.once("open", () => {
  console.log("db connected");
  const msgCollection = db.collection("messagecontents");
  const changeStream = msgCollection.watch();

  changeStream.on("change", (change) => {
    console.log(change);
    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        received: messageDetails.received,
        timestamp: messageDetails.timestamp,
      });
    } else {
      console.log("eeror ocurred in triggers");
    }
  });
});

app.get("/", (req, res) => res.status(200).send("hello world"));

app.get("/messages/sync", (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
      console.log(err);
    } else {
      res.status(200).send(data);
    }
  });
});

app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;
  Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});
app.listen(port, () => console.log(`app running on port ${port}`));
