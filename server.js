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
const { syncBuiltinESMExports } = require("module");
const { system } = require("nodemon/lib/config");
const { resolve } = require("path");
const cli = require("nodemon/lib/cli");
const uri = "mongodb://127.0.0.1:27017";
const client = new mongodb.MongoClient(uri);

const databaseName = "commercialsDB";
const collectionName = "Clients";
const adminCollection = "Admin";

let screensNamesArr = [];
const connectedClientsArr = [];
const disconnectedArr = ["screen-1", "screen-2", "screen-3"];
let mongoData = [];
// let screen1Arr=[];
// let screen2Arr=[];
// let screen3Arr=[];

/* ---------------mongodb connection--------------- */
client.connect((err) => {
  if (err) {
    console.log("***Connection with mongodb failed ");
    console.log(err);
  } else console.log("***Connection with mongodb created");

  const db = client.db(databaseName);

  /* ------If the USERS DATA collection already exists------ */
  db.collection("usersData").insertMany([{ id: 0 }], function () {
    if (db.listCollections({ name: "usersData" }).hasNext()) {
      db.dropCollection("usersData", function (err) {
        if (err) console.log(err);
      });

      db.createCollection("usersData", function (err, res) {
        if (err) console.log(err);
      });
    }
  });

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
              imgUrl: "https://i.ytimg.com/vi/0IqiRIsplOA/maxresdefault.jpg",
              duration: 1000,
            },
            {
              id: 2,
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
              imgUrl:
                "https://cdn.fedweb.org/fed-99/2/Happy-Tu-BShevat-img07.jpg",
              duration: 4000,
            },
            {
              id: 2,
              imgUrl:
                "https://static1.bigstockphoto.com/9/8/2/large2/289393843.jpg",
              duration: 2000,
            },
          ],
        },
        {
          screen: "screen-3",
          commeracials: [
            {
              id: 1,
              imgUrl: "https://www.ies.org.il/images/passover.jpg",
              duration: 1000,
            },
            {
              id: 2,
              imgUrl:
                "https://cdn.w600.comps.canstockphoto.com/happy-sukkot-icon-set-flat-cartoon-eps-vector_csp50440247.jpg",
              duration: 3000,
            },
            {
              id: 3,
              imgUrl:
                "https://chabad-purim.org.il/wp-content/uploads/2021/10/%D7%A4%D7%95%D7%A8%D7%99%D7%9D-%D7%A0%D7%99%D7%99%D7%93.png",
              duration: 5000,
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

let id;
let datetime;
let flag = false;
let flagConn = false;
let flagEmit = false;
let adminTime;
let adminFlag = false;
let flagAdminConn = false;
// let isAdminConnected = false;

app.get("/:uid", async function (request, response) {
  let currId = request.params.uid;
  let currDatetime = new Date().toString().slice(0, 24);

  if (screensNamesArr.includes(currId)) {
    // first screen
    if (id == null && datetime == null) {
      id = currId;
      datetime = currDatetime;
      await callConnectToSocket(response, currId);
    }
    // same screen at new tab
    else if (id === currId && datetime !== currDatetime) {
      await callConnectToSocket(response, id);
      datetime = currDatetime;
    }
    // other screen
    else if (id !== currId) {
      id = currId;
      datetime = currDatetime;
      await callConnectToSocket(response, currId);
    }
  } else if (currId === "admin" && adminTime == null) {
    id = "admin";
    adminTime = currDatetime;
    await callConnectToAdminSocket(response, id);
  } else if (currId === "admin" && adminTime != currDatetime) {
    id = "admin";
    adminTime = currDatetime;
    // isAdminConnected = true;
    await callConnectToAdminSocket(response, id);
  } else {
    response.sendFile(path.join(__dirname, "/homePage.html"));
  }
});

function callConnectToSocket(response, id) {
  if (flag == false) {
    connectToSocket(response, id);
  }
}

function callConnectToAdminSocket(response, id) {
  if (adminFlag == false) {
    connectToAdminSocket(response, id);
  }
}

/* -------------------- user login -------------------- */
let htmlName;
function connectToSocket(response, screenName) {
  flag = true;
  flagConn = false;

  io.sockets.on("connection", async function (socket) {
    flagEmit = false;
    if (id === screenName) {
      await callConnection(socket, screenName);
    }

    if (id === screenName && flagEmit === false) {
      flagEmit = true;

      connectedClientsArr.push(screenName);
      const index = disconnectedArr.indexOf(screenName);
      if (index !== -1) {
        disconnectedArr.splice(index, 1);
      }
      io.sockets.emit("connectedUser", connectedClientsArr, disconnectedArr);
      console.log(connectedClientsArr);
    } else if (id === "admin") {
      console.log(connectedClientsArr);
      io.sockets.emit("connectedUser", connectedClientsArr, disconnectedArr);
    }
  });
  if (id === "admin") {
    htmlName = "admin";
  } else {
    htmlName = "screen";
  }
  response.sendFile(path.join(__dirname, `/${htmlName}.html`));
  flag = false;
}

function connectToAdminSocket(response, screenName) {
  adminFlag = true;
  flagAdminConn = false;

  io.sockets.on("connection", async function (socket) {
    if (id === "admin") {
      await callAdminConnection(socket, screenName);
    }
  });
  response.sendFile(path.join(__dirname, "/admin.html"));
  adminFlag = false;
}

function callConnection(socket, screenName) {
  let dbo;
  let randID;

  if (flagConn == false) {
    flagConn = true;

    client.connect(function (err, db) {
      console.log("hello client!!");
      dbo = db.db(databaseName);
      randID = Math.trunc(Math.random() * 1000000) + 1;

      var obj = {
        id: randID,
        user: screenName,
        LoginTime: datetime,
        LogoutTime: "Still connected",
      };

      if (id === obj.user) {
        dbo.collection("usersData").insertOne(obj, function (err, res) {
          if (err) console.log(err);
        });
      }

      dbo
        .collection(collectionName)
        .find({ screen: screenName })
        .toArray(function (err, result) {
          if (err) console.log(err);

          socket.name = screenName;
          socket.emit("getJson", result, screenName);
        });
    });
    /* ----------------- disconnect -------------- */
    myDisconnect(socket, dbo, randID);
  }
}

function callAdminConnection(socket, screenName) {
  if (flagAdminConn == false) {
    flagAdminConn = true;
    client.connect(function (err, db) {
      console.log("inside admin connect");
      const dbo = db.db(databaseName);

      dbo
        .collection(adminCollection)
        .find({ role: "admin" })
        .toArray(function (err, result) {
          if (err) console.log(err);

          socket.emit(
            "getAdmin",
            result[0].userName,
            result[0].password,
            mongoData,
            connectedClientsArr,
            disconnectedArr
          );
        });

      socket.on("notifyServerToRemoveClient", function (screenName) {
        mongoData = mongoData.filter((c) => c.screen !== screenName);

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

        for (let i = 0; i < screensNamesArr.length; i++) {
          console.log("screen is - " + screenName);
          if (screensNamesArr[i] === screenName) {
            screensNamesArr.splice(i, 1);
          }
        }
      });

      // TODO: change name
      socket.on("notifyServerToEditComm", function (screenName, editedComm) {
        const client = mongoData.find((c) => c.screen === screenName);
        client.commeracials.forEach((comm) => {
          if (comm.id === editedComm.id) {
            comm.duration = Number(editedComm.duration);
            comm.imgUrl = editedComm.imgUrl;
          }
        });

        dbo
          .collection(collectionName)
          .updateMany(
            {
              screen: screenName,
              "commeracials.id": editedComm.id,
            },
            {
              $set: {
                "commeracials.$": {
                  id: editedComm.id,
                  imgUrl: editedComm.imgUrl,
                  duration: Number(editedComm.duration),
                },
              },
            }
          )
          .then((result) => {
            if (result.matchedCount === 1) {
              console.log("Successfully updated one document.");
            } else {
              console.log(
                "No documents matched the query. Updated 0 documents."
              );
            }
          });
      });

      socket.on("notifyServerToRemoveComm", function (client, Commid) {
        mongoData = mongoData.filter((c) => c.screen !== client.screen);
        client.commeracials = client.commeracials.filter(
          (comm) => comm.id !== Commid
        );
        mongoData.push(client);

        Commid = Number(Commid);
        dbo
          .collection(collectionName)
          .updateMany(
            { screen: client.screen },
            { $pull: { commeracials: { id: Commid } } }
          );
      });

      socket.on(
        "notifyServerToAddCommercial",
        function (screenName, commercial) {
          console.log("screen : " + screenName);
          console.log("commercial : " + commercial);

          const client = mongoData.find((c) => c.screen === screenName);
          client.commeracials.push(commercial);

          dbo.collection(collectionName).updateMany(
            { screen: screenName },
            {
              $push: {
                commeracials: commercial,
              },
            }
          );
        }
      );
      // socket.on("notifyServerToAddClient", function (newClient) {
      //   dbo.collection(collectionName).insertOne({
      //     screen: newClient.screen,
      //     commeracials: [],
      //   });
      // });
      socket.on(
        "notifyServerToChangeAdminPassword",
        function (adminName, adminPassword) {
          dbo
            .collection(adminCollection)
            .updateOne(
              { role: "admin" },
              { $set: { userName: adminName, password: Number(adminPassword) } }
            );
        }
      );
    });
    socket.on("disconnect", function () {
      console.log("admin disconnected");
    });
  }
}

/* -------------------- user logout -------------------- */
function myDisconnect(socket, dbo, randID) {
  socket.on("disconnect", function () {
    console.log(11111);
    let index = connectedClientsArr.indexOf(socket.name);
    connectedClientsArr.splice(index, 1);
    index = connectedClientsArr.indexOf(socket.name);
    console.log("index: " + index);
    if (index === -1) disconnectedArr.push(socket.name);

    console.log(connectedClientsArr, disconnectedArr);
    io.sockets.emit("disconnectUser", connectedClientsArr, disconnectedArr);
    console.log(`${socket.name} disconnected!`);

    var datetime = new Date().toString().slice(0, 24);

    dbo
      .collection("usersData")
      .updateOne({ id: randID }, { $set: { LogoutTime: datetime } });
  });
}

/* -------------------- admin login -------------------- */
// function adminFunc(response) {
//   io.sockets.on("connection", function (socket) {
//     console.log("hello");
//     client.connect(function (err, db) {
//       const dbo = db.db(databaseName);

//       dbo
//         .collection(adminCollection)
//         .find({ role: "admin" })
//         .toArray(function (err, result) {
//           if (err) console.log(err);

//           socket.emit(
//             "getAdmin",
//             result[0].userName,
//             result[0].password,
//             mongoData
//           );
//         });

//       socket.on("notifyServerToRemoveClient", function (screenName) {
//         dbo
//           .collection(collectionName)
//           .deleteMany({
//             screen: screenName,
//           })
//           .then((result) => {
//             if (result.deletedCount === 1) {
//               console.log("Successfully deleted one document.");
//             } else {
//               console.log(
//                 "No documents matched the query. Deleted 0 documents."
//               );
//             }
//           });

//         for (let i = 0; i < screensNamesArr.length; i++) {
//           console.log("screen is - " + screenName);
//           if (screensNamesArr[i] === screenName) {
//             screensNamesArr.splice(i, 1);
//           }
//         }
//       });

//       /*OLD*/
//       // socket.on("notifyServerToEditClient", function (client) {
//       //   dbo
//       //     .collection(collectionName)
//       //     .updateMany(
//       //       { screen: client.screen },
//       //       {
//       //         $set: { commeracials: client.commeracials },
//       //       }
//       //     )
//       //     .then((result) => {
//       //       if (result.deletedCount === 1) {
//       //         console.log("Successfully deleted one document.");
//       //       } else {
//       //         console.log(
//       //           "No documents matched the query. Deleted 0 documents."
//       //         );
//       //       }
//       //     });
//       // });

//       /*NEW*/
//       socket.on("notifyServerToEditClient", function (screenName, editedComm) {
//         console.log(editedComm.id);
//         dbo
//           .collection(collectionName)
//           .updateMany(
//             {
//               screen: screenName,
//               "commeracials.id": editedComm.id,
//             },
//             {
//               $set: {
//                 "commeracials.$": {
//                   id: editedComm.id,
//                   img: editedComm.img,
//                   imgUrl: editedComm.imgUrl,
//                   duration: Number(editedComm.duration),
//                 },
//               },
//             }
//           )
//           .then((result) => {
//             if (result.matchedCount === 1) {
//               console.log("Successfully updated one document.");
//             } else {
//               console.log(
//                 "No documents matched the query. Updated 0 documents."
//               );
//             }
//           });
//       });

//       socket.on("notifyServerToRemoveComm", function (client, Commid) {
//         Commid = Number(Commid);
//         dbo
//           .collection(collectionName)
//           .updateMany(
//             { screen: client.screen },
//             { $pull: { commeracials: { id: Commid } } }
//           );
//       });

//       socket.on(
//         "notifyServerToAddCommercial",
//         function (screenName, commercial) {
//           console.log("screen : " + screenName);
//           console.log("commercial : " + commercial);
//           dbo.collection(collectionName).updateMany(
//             { screen: screenName },
//             {
//               $push: {
//                 commeracials: commercial,
//               },
//             }
//           );
//         }
//       );
//       socket.on("notifyServerToAddClient", function (newClient) {
//         dbo.collection(collectionName).insertOne({
//           screen: newClient.screen,
//           commeracials: [],
//         });
//       });
//       socket.on(
//         "notifyServerToChangeAdminPassword",
//         function (adminName, adminPassword) {
//           dbo
//             .collection(adminCollection)
//             .updateOne(
//               { role: "admin" },
//               { $set: { userName: adminName, password: Number(adminPassword) } }
//             );
//         }
//       );
//     });
//   });

//   response.sendFile(path.join(__dirname, "/admin.html"));
// }

// function sendUserDataToAdmin(socket, screenName) {
//   socket.on("userConnect", function () {
//     io.sockets.emit("connectedUser", screenName);
//   });
// }
