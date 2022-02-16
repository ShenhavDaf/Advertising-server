'use strict';

/* ---------------express declarations--------------- */
const path = require('path');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const port = process.env.PORT || 8080;
app.use(express.json());
app.use(express.static(__dirname + '/photos'));
app.use(express.static(__dirname + '/'));

/* ---------------mongodb declarations--------------- */
const mongodb = require('mongodb');
const { emit } = require('process');
const { syncBuiltinESMExports } = require('module');
const { system } = require('nodemon/lib/config');
const { resolve } = require('path');
const cli = require('nodemon/lib/cli');
const uri = 'mongodb://127.0.0.1:27017';
const client = new mongodb.MongoClient(uri);

const databaseName = 'commercialsDB';
const collectionName = 'Clients';
const adminCollection = 'Admin';

/* ---------------Arrays declarations--------------- */
let screensNamesArr = [];
const connectedClientsArr = [];
let mongoData = [];
const disconnectedArr = ['screen-1', 'screen-2', 'screen-3'];

/* ---------------mongodb connection--------------- */
client.connect((err) => {
  if (err) {
    console.log('***Connection with mongodb failed ');
    console.log(err);
  } else console.log('***Connection with mongodb created');

  const db = client.db(databaseName);

  /* ------If the USERS DATA collection already exists------ */
  db.collection('usersData').insertMany([{ id: 0 }], function () {
    if (db.listCollections({ name: 'usersData' }).hasNext()) {
      db.dropCollection('usersData', function (err) {
        if (err) console.log(err);
      });

      db.createCollection('usersData', function (err) {
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
          role: 'admin',
          userName: 'abc',
          password: 1234,
        },
      ],
      (error) => {
        if (error) return console.log('***Could not insert\n', error);
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
          screen: 'screen-1',
          commeracials: [
            {
              id: 1,
              imgUrl:
                'https://cdn.osxdaily.com/wp-content/uploads/2019/08/test-the-impossible-mac-advertisment.jpg',
              duration: 1000,
            },
            {
              id: 2,
              imgUrl:
                'https://www.gizmochina.com/wp-content/uploads/2021/09/iPhone-13-Pro-featured.png',
              duration: 2000,
            },
          ],
        },
        {
          screen: 'screen-2',
          commeracials: [
            {
              id: 1,
              imgUrl:
                'https://m.media-amazon.com/images/M/MV5BMjkzMzM1YWEtYzI5YS00ZGMyLWE5NjAtYzhiYWZmNDY2ODJjXkEyXkFqcGdeQXVyMjA0OTk3OTg@._V1_.jpg',
              duration: 4000,
            },
            {
              id: 2,
              imgUrl:
                'https://www.incimages.com/uploaded_files/image/1920x1080/chickenbigmac_220981.png',
              duration: 2000,
            },
          ],
        },
        {
          screen: 'screen-3',
          commeracials: [
            {
              id: 1,
              imgUrl:
                'https://cached.imagescaler.hbpl.co.uk/resize/scaleWidth/815/cached.offlinehbpl.hbpl.co.uk/news/OMC/719F37E0-A7DC-4633-75ECEB408400BC61.jpg',
              duration: 1000,
            },
            {
              id: 2,
              imgUrl: 'https://i.ytimg.com/vi/xlXw4hC2fmA/maxresdefault.jpg',
              duration: 3000,
            },
            {
              id: 3,
              imgUrl:
                'https://www.natalieportman.com/wp-content/uploads/2013/08/missdiorleparfum.jpg',
              duration: 5000,
            },
          ],
        },
      ],
      (error) => {
        if (error) return console.log('***Could not insert\n', error);

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
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '/homePage.html'));
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

app.get('/:uid', async function (request, response) {
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
  } else if (currId === 'admin' && adminTime == null) {
    id = 'admin';
    adminTime = currDatetime;
    await callConnectToAdminSocket(response, id);
  } else if (currId === 'admin' && adminTime != currDatetime) {
    id = 'admin';
    adminTime = currDatetime;
    await callConnectToAdminSocket(response, id);
  } else {
    response.sendFile(path.join(__dirname, '/homePage.html'));
  }
});

/* --------------------------------------------------------- */
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

/* -------------------- Clients connection -------------------- */
let htmlName;
function connectToSocket(response, screenName) {
  flag = true;
  flagConn = false;

  io.sockets.on('connection', async function (socket) {
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
      io.sockets.emit('connectedUser', connectedClientsArr, disconnectedArr);
    } else if (id === 'admin') {
      io.sockets.emit('connectedUser', connectedClientsArr, disconnectedArr);
    }
  });
  if (id === 'admin') {
    htmlName = 'admin';
  } else {
    htmlName = 'screen';
  }
  response.sendFile(path.join(__dirname, `/${htmlName}.html`));
  flag = false;
}

/* ---------------Admin connection--------------- */
function connectToAdminSocket(response, screenName) {
  adminFlag = true;
  flagAdminConn = false;

  io.sockets.on('connection', async function (socket) {
    if (id === 'admin') {
      await callAdminConnection(socket, screenName);
    }
  });
  response.sendFile(path.join(__dirname, '/admin.html'));
  adminFlag = false;
}

/* ---------------Update 'usersData' collection--------------- */
function callConnection(socket, screenName) {
  let dbo;
  let randID;

  if (flagConn == false) {
    flagConn = true;

    client.connect(function (err, db) {
      dbo = db.db(databaseName);
      randID = Math.trunc(Math.random() * 1000000) + 1;

      var obj = {
        id: randID,
        user: screenName,
        LoginTime: datetime,
        LogoutTime: 'Still connected',
      };

      if (id === obj.user) {
        dbo.collection('usersData').insertOne(obj, function (err, res) {
          if (err) console.log(err);
        });
      }

      dbo
        .collection(collectionName)
        .find({ screen: screenName })
        .toArray(function (err, result) {
          if (err) console.log(err);

          socket.name = screenName;
          socket.emit('getJson', result, screenName);
        });
    });
    /* ----------------- client disconnect -------------- */
    myDisconnect(socket, dbo, randID);
  }
}

/* ---------------Admin functionality--------------- */
function callAdminConnection(socket, screenName) {
  if (flagAdminConn == false) {
    flagAdminConn = true;
    client.connect(function (err, db) {
      const dbo = db.db(databaseName);

      dbo
        .collection(adminCollection)
        .find({ role: 'admin' })
        .toArray(function (err, result) {
          if (err) console.log(err);

          /* ---------------Call 'admin.html'--------------- */
          socket.emit(
            'getAdmin',
            result[0].userName,
            result[0].password,
            mongoData,
            connectedClientsArr,
            disconnectedArr
          );
        });

      socket.on('notifyServerToRemoveClient', function (screenName) {
        mongoData = mongoData.filter((c) => c.screen !== screenName);

        dbo
          .collection(collectionName)
          .deleteMany({
            screen: screenName,
          })
          .then((result) => {
            if (result.deletedCount === 1) {
              console.log('Successfully deleted one document.');
            } else {
              console.log(
                'No documents matched the query. Deleted 0 documents.'
              );
            }
          });

        for (let i = 0; i < screensNamesArr.length; i++) {
          if (screensNamesArr[i] === screenName) {
            screensNamesArr.splice(i, 1);
          }
        }
      });

      socket.on('notifyServerToEditComm', function (screenName, editedComm) {
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
              'commeracials.id': editedComm.id,
            },
            {
              $set: {
                'commeracials.$': {
                  id: editedComm.id,
                  imgUrl: editedComm.imgUrl,
                  duration: Number(editedComm.duration),
                },
              },
            }
          )
          .then((result) => {
            if (result.matchedCount === 1) {
              console.log('Successfully updated one document.');
            } else {
              console.log(
                'No documents matched the query. Updated 0 documents.'
              );
            }
          });
      });

      socket.on('notifyServerToRemoveComm', function (client, Commid) {
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
        'notifyServerToAddCommercial',
        function (screenName, commercial) {
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

      socket.on(
        'notifyServerToChangeAdminPassword',
        function (adminName, adminPassword) {
          dbo
            .collection(adminCollection)
            .updateOne(
              { role: 'admin' },
              { $set: { userName: adminName, password: Number(adminPassword) } }
            );
        }
      );
    });

    /* ---------------Admin disconnection--------------- */
    socket.on('disconnect', function () {
      console.log('admin disconnected');
    });
  }
}

/* -------------------- Clients disconnection -------------------- */
function myDisconnect(socket, dbo, randID) {
  socket.on('disconnect', function () {
    let index = connectedClientsArr.indexOf(socket.name);
    connectedClientsArr.splice(index, 1);
    index = connectedClientsArr.indexOf(socket.name);
    if (index === -1) disconnectedArr.push(socket.name);

    io.sockets.emit('disconnectUser', connectedClientsArr, disconnectedArr);
    var datetime = new Date().toString().slice(0, 24);

    dbo
      .collection('usersData')
      .updateOne({ id: randID }, { $set: { LogoutTime: datetime } });
  });
}
