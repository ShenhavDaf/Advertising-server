"use strict";

/* ---------------express declarations--------------- */
const path = require("path");
const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);

const port = process.env.PORT || 8080;
app.use(express.json());
app.use(express.static(__dirname + "/photos"));
app.use(express.static(__dirname + "/"));

/* ---------------mongodb declarations--------------- */
const mongodb = require("mongodb");
const { emit } = require("process");
const uri = "mongodb://127.0.0.1:27017";
const client = new mongodb.MongoClient(uri);

const databaseName = "commercialsDB";
const collectionName = "Clients";
const adminCollection = "Admin";

let screensNamesArr = [];
let mongoData = [];

/* ---------------mongodb connection--------------- */
client.connect((err) => {
  if (err) {
    console.log("***Connection with mongodb failed ");
    console.log(err);
  } else console.log("***Connection with mongodb created");

  const db = client.db(databaseName);

  /* ------If the ADMIN collection already exists------ */
  db.collection(adminCollection).insertMany([{ id: 0 }], function () {
    if (db.listCollections({ name: adminCollection }).hasNext()) {
      db.dropCollection(adminCollection, function (err) {
        if (err) console.log(err);
      });

      db.createCollection(adminCollection, function (err, res) {
        if (err) console.log(err);
      });
    }

    db.collection(adminCollection).insertMany(
      [
        {
          role: "admin",
          userName: "abc",
          password: 1234,
        },
      ],
      (error) => {
        if (error) return console.log("***Could not insert\n", error);
      }
    );
  });

  /* --------If the collection already exists-------- */
  db.collection(collectionName).insertMany([{ id: 0 }], function () {
    if (db.listCollections({ name: collectionName }).hasNext()) {
      db.dropCollection(collectionName, function (err) {
        if (err) console.log(err);
      });

      db.createCollection(collectionName, function (err, res) {
        if (err) console.log(err);
      });
    }

    /* --------Insert data into the collection-------- */
    db.collection(collectionName).insertMany(
      [
        {
          screen: "screen-1",
          commeracials: [
            {
              id: 1,
              img: "./Hanukkah.jpg",
              imgUrl: "https://i.ytimg.com/vi/0IqiRIsplOA/maxresdefault.jpg",
              duration: 1000,
            },
            {
              id: 2,
              img: "./RoshHashanah.jpg",
              imgUrl:
                "https://i.pinimg.com/originals/99/b0/7a/99b07ac3aa6483343346c17b4cfe87ff.jpg",
              duration: 2000,
            },
          ],
        },
        {
          screen: "screen-2",
          commeracials: [
            {
              id: 1,
              img: "./TuBshvat.jpg",
              imgUrl:
                "https://g3d5t8s9.stackpathcdn.com/wp-content/uploads/2020/02/tubishvat.jpg.webp",
              duration: 2000,
            },
            {
              id: 2,
              img: "./Purim.png",
              imgUrl:
                "https://scontent.fsdv1-2.fna.fbcdn.net/v/t1.18169-9/28379206_1875774915779650_2119237281829391344_n.png?_nc_cat=110&ccb=1-5&_nc_sid=730e14&_nc_ohc=q3n9vVyGUUwAX-Vrm6P&_nc_oc=AQmgRUhEoe42nNVMiWR03xJpzVikySV02Xy0EEul1Tln_wtnHSTqGKqoVsxtIYSSaZQ&_nc_ht=scontent.fsdv1-2.fna&oh=00_AT_EA8cDKxjSwyF84WJaaIs7b5pE8tJtq4RLSmYXyBxrrQ&oe=61EA7705",
              duration: 2000,
            },
          ],
        },
        {
          screen: "screen-3",
          commeracials: [
            {
              id: 1,
              img: "./Passover.jpg",
              imgUrl: "https://www.ies.org.il/images/passover.jpg",
              duration: 2000,
            },
            {
              id: 2,
              img: "./Sukkot.png",
              imgUrl:
                "https://cdn.w600.comps.canstockphoto.com/happy-sukkot-icon-set-flat-cartoon-eps-vector_csp50440247.jpg",
              duration: 2000,
            },
            {
              id: 3,
              img: "./HappyPurim.png",
              imgUrl:
                "https://chabad-purim.org.il/wp-content/uploads/2021/10/%D7%A4%D7%95%D7%A8%D7%99%D7%9D-%D7%A0%D7%99%D7%99%D7%93.png",
              duration: 2000,
            },
          ],
        },
      ],
      (error) => {
        if (error) return console.log("***Could not insert\n", error);

        /* ------------save screens names------------ */
        db.collection(collectionName)
          .find()
          .toArray(function (err, result) {
            result.forEach((doc) => {
              // console.log(doc.screen);
              screensNamesArr.push(doc.screen);
              mongoData.push(doc);
            });
          });
      }
    );
  });
});

/* ---------------express use--------------- */
server.listen(port);
console.log(`***Server started running at http://localhost: ${port}`);

/* ---------------'localhost:8080'--------------- */
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "/homePage.html"));
});

/* --------------'localhost:8080/screen-x'-------------- */
app.get("/:uid", function (request, response) {
  let id = request.params.uid;

  // if (id == 'screen-1' || id == 'screen-2' || id == 'screen-3')

  if (screensNamesArr.includes(id)) connectToSocket(response, id);
  else if (id === "admin") adminFunc(response);
  else response.sendFile(path.join(__dirname, "/homePage.html"));
});

/* -------------------- user login -------------------- */
function connectToSocket(response, screenName) {
  let dbo;
  let randID;

  io.sockets.on("connection", function (socket) {
    client.connect(function (err, db) {
      dbo = db.db(databaseName);
      var datetime = new Date().toString().slice(0, 24);
      randID = Math.trunc(Math.random() * 1000000) + 1;

      var obj = {
        id: randID,
        user: screenName,
        LoginTime: datetime,
        LogoutTime: "Still connected",
      };

      dbo.collection("usersData").insertOne(obj, function (err, res) {
        if (err) console.log(err);
      });

      dbo
        .collection(collectionName)
        .find({ screen: screenName })
        .toArray(function (err, result) {
          if (err) console.log(err);

          socket.name = screenName;
          socket.emit("getJson", result, screenName);
        });
    });

    /* ----------------- update admin -------------- */
    io.sockets.emit("connectedUser", screenName);
    /* ----------------- disconnect -------------- */
    myDisconnect(socket, dbo, randID);
  });
  response.sendFile(path.join(__dirname, "/screen.html"));
}

/* -------------------- user logout -------------------- */
function myDisconnect(socket, dbo, randID) {
  socket.on("disconnect", function () {
    io.sockets.emit("disconnectUser", socket.name);
    console.log(`${socket.name} disconnected!`);

    var datetime = new Date().toString().slice(0, 24);

    dbo
      .collection("usersData")
      .updateOne({ id: randID }, { $set: { LogoutTime: datetime } });
  });
}

/* -------------------- admin login -------------------- */
function adminFunc(response) {
  io.sockets.on("connection", function (socket) {
    client.connect(function (err, db) {
      const dbo = db.db(databaseName);

      dbo
        .collection(adminCollection)
        .find({ role: "admin" })
        .toArray(function (err, result) {
          if (err) console.log(err);

          // console.log(result[0].userName);
          // console.log(result[0].password);

          socket.emit(
            "getAdmin",
            result[0].userName,
            result[0].password,
            mongoData
          );
        });

      socket.on("notifyServerToRemoveClient", function (screenName) {
        dbo
          .collection(collectionName)
          .deleteMany({
            screen: screenName,
          })
          .then((result) => {
            if (result.deletedCount === 1) {
              console.log("Successfully deleted one document.");
            } else {
              console.log(
                "No documents matched the query. Deleted 0 documents."
              );
            }
          });
      });

      socket.on("notifyServerToEditClient", function (client) {
        dbo
          .collection(collectionName)
          .updateMany(
            { screen: client.screen },
            {
              $set: { commeracials: client.commeracials },
            }
          )
          .then((result) => {
            if (result.deletedCount === 1) {
              console.log("Successfully deleted one document.");
            } else {
              console.log(
                "No documents matched the query. Deleted 0 documents."
              );
            }
          });
      });

      socket.on("notifyServerToRemoveComm", function (client, Commid) {
        Commid = Number(Commid);
        dbo
          .collection(collectionName)
          .updateMany(
            { screen: client.screen },
            { $pull: { commeracials: { id: Commid } } }
          );
      });

      socket.on("notifyServerToAddCommercial", function (screenName) {
        console.log("22222222222");
        dbo.collection(collectionName).updateMany(
          { screen: screenName },
          {
            $push: {
              commeracials: {
                id: 3,
                img: ".COCOCO",
                imgUrl: "http://LALALA",
                duration: 55555,
              },
            },
          }
        );
      });
      socket.on("notifyServerToAddNewClient", function () {
        console.log("3333333333");
        dbo.collection(collectionName).insertOne({
          screen: "screen-4",
          commeracials: {
            id: 1,
            img: ".TUTUTTU",
            imgUrl: "http://YAYAYAYA",
            duration: 3333333,
          },
        });
      });
    });
  });

  response.sendFile(path.join(__dirname, "/admin.html"));
}

function sendUserDataToAdmin(socket, screenName) {
  socket.on("userConnect", function () {
    console.log("sfsf");
    io.sockets.emit("connectedUser", screenName);
  });
}
