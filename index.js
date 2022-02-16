let clientsArr = [];
let currUserId;

/* ------------ Containers ------------ */

const body = document.body;
const loginElem = document.querySelector(".login");
const connectedListCont = document.querySelector(".client_list--connected");
const disconnectedListCont = document.querySelector(
  ".client_list--disconnected"
);
const clientsContainer = document.querySelector(".clients_container");
const commContainer = document.querySelector(".commercials_container");

/* ------------ User data functions ------------ */

const createUserDataRow = (clientName) => {
  const element = `
    <div class="client_row" >
              <p class="client_name">${clientName}</p>
      </div>
    `;
  return element;
};

const displayUserData = (connectedarr, disconnectedArr) => {
  connectedListCont.innerHTML = "";
  connectedarr.forEach((client) => {
    const element = createUserDataRow(client);
    connectedListCont.insertAdjacentHTML("afterbegin", element);
  });

  disconnectedListCont.innerHTML = "";
  disconnectedArr.forEach((client) => {
    const element = createUserDataRow(client);
    disconnectedListCont.insertAdjacentHTML("afterbegin", element);
  });
};

/* ------------ Clients functions ------------ */

const displayClients = () => {
  clientsContainer.innerHTML = "";
  clientsArr.forEach((client) => {
    const element = createClientRow(client);
    clientsContainer.insertAdjacentHTML("afterbegin", element);
  });

  // Remove client
  const removeBtn = document.querySelectorAll(".btn_remove--client");
  removeBtn.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      currUser = e.target.parentElement.parentElement.parentElement;
      console.log(currUser.id);
      socket.emit("notifyServerToRemoveClient", currUser.id);
      currUser.remove();
      commContainer.innerHTML = "";
    });
  });

  // Display client's commercials
  const displayBtn = document.querySelectorAll(".btn_edit--client");
  displayBtn.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const currUser = e.target.parentElement.parentElement.parentElement;
      currUserId = currUser.id;

      clientsArr.forEach((client) => {
        if (client.screen === currUserId) {
          displayComm(client);
        }
      });
    });
  });
};

const createClientRow = (client) => {
  const element = `
    <div class="client_card" id="${client.screen}">
              <p class="client_name">${client.screen}</p>
              <div class="button_box">
                <button class='btn btn_edit--client'><img class="editIcon" src="./icons/editIconB.png"/></button>
                <button class='btn btn_remove--client'><img class="removeIcon" src="./icons/removeIconB.png"/></button>
              </div>
    </div>
    `;
  return element;
};

/* ------------ Commercials functions ------------ */

function displayComm(client) {
  const screenName = document.querySelector(".screenName");
  screenName.innerHTML = client.screen;
  commContainer.innerHTML = "";

  client.commeracials.forEach((comm) => {
    const element = createCommercialsRow(comm);
    commContainer.insertAdjacentHTML("afterbegin", element);
  });

  const removeCommBtn = document.querySelectorAll(".btn_remove--comm");
  const editCommBtn = document.querySelectorAll(".btn_edit--comm");
  const saveCommBtn = document.querySelectorAll(".btn_save--comm");

  // Remove specific commercial from client
  removeCommBtn.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();

      const currComm = e.target.parentElement.parentElement.parentElement;
      const commID = currComm.id;

      client.commeracials.forEach((comm) => {
        if (comm.id === Number(currComm.id)) {
          client.commeracials.pop(comm);
        }
      });

      currComm.remove();
      socket.emit("notifyServerToRemoveComm", client, commID);
    });
  });

  // Edit spesific commercial
  editCommBtn.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const currComm = e.target.parentElement.parentElement.parentElement;
      const commID = currComm.id;

      client.commeracials.forEach((comm) => {
        if (comm.id === Number(commID)) {
          editComm(currComm);
        }
      });
    });
  });

  // Save commercial
  saveCommBtn.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const currComm = e.target.parentElement.parentElement.parentElement;
      const commID = currComm.id;

      client.commeracials.forEach((comm) => {
        if (comm.id === Number(commID)) {
          saveComm(comm, client, currComm);
        }
      });
    });
  });
}

function createCommercialsRow(comm) {
  const img = `${comm.imgUrl}`;

  const element = `<div class="commercial_card" id="${comm.id}">
    <h1 class="commercial_num">Commercial ${comm.id}</h1>
    <p class="durationComm">${comm.duration}</p>
    <p class="imgUrlComm">${comm.imgUrl}</p>
    <img class='commercial_img' src="${img}" alt="">
    <div class="button_box">
      <button class='btn btn_edit--comm'><img class="editIcon" src="./icons/editIconB.png"/></button>
      <button class='btn btn_remove--comm'><img class="removeIcon" src="./icons/removeIconB.png"/></button>
      <button class='btn btn_save--comm'><img class="saveIcon" src="./icons/saveIcon.png"/></button>
    </div>
  </div>`;

  return element;
}

function editComm(commElement) {
  const duration = commElement.querySelector(".durationComm");
  const imgUrl = commElement.querySelector(".imgUrlComm");

  const durationInput = createInputElement("duration", duration.innerHTML);
  commElement.replaceChild(durationInput, duration);

  // imgURL
  const imgUrlInput = createInputElement("imgUrl", imgUrl.innerHTML);
  commElement.replaceChild(imgUrlInput, imgUrl);
}

function saveComm(comm, client, currComm) {
  console.log(currComm);
  if (!inputIsExist(currComm.children)) {
    return;
  }

  const durationInput = currComm.querySelector(".durationInput");
  comm.duration = Number(durationInput.value);
  const newDurationElem = createParagraphElement(
    "durationComm",
    durationInput.value
  );
  // imgURL
  const imgUrlInput = currComm.querySelector(".imgUrlInput");
  comm.imgUrl = imgUrlInput.value;
  const newImgUrlElem = createParagraphElement("imgUrlComm", imgUrlInput.value);

  currComm.replaceChild(newDurationElem, durationInput);
  currComm.replaceChild(newImgUrlElem, imgUrlInput);

  const img = currComm.querySelector(".commercial_img");
  img.src = `${imgUrlInput.value}`;

  console.log(client.commeracials[currComm.id - 1]); // the changed commercial.
  socket.emit(
    "notifyServerToEditComm",
    client.screen,
    client.commeracials[currComm.id - 1]
  );
}

const createInputElement = function (type, value) {
  const durationInputElem = document.createElement("input");
  durationInputElem.type = "text";
  durationInputElem.classList.add(`${type}Input`);
  durationInputElem.classList.add("input");
  durationInputElem.value = value;
  return durationInputElem;
};

const createParagraphElement = function (className, value) {
  const durationPElem = document.createElement("p");
  durationPElem.classList.add(className);
  durationPElem.innerHTML = value;
  return durationPElem;
};

const inputIsExist = function (classArr) {
  for (let i = 0; i < classArr.length; i++) {
    if (classArr[i].classList.contains("input")) {
      return true;
    }
  }
  return false;
};

/* ------------ Modal's functions ------------ */

const modal = document.querySelector(".modal");
const overlay = document.querySelector(".overlay");
const addNewCommBtn = document.querySelector(".addBtn--comm");

const commercialModal = `
      <h1>Add new commercial</h1>
      <form class="addNewClient">
        <div class="rowForm">
          <lable class="nameLable">Duration: </lable>
          <input type="text" class="durationInput">
        </div>
        <div class="rowForm">
          <lable class="nameLable">Image URL: </lable>
          <input type="text" class="imgURLInput">
        </div>
      </form>
`;

const changeDetails = `
      <h1 class="changeDetailsTitle">Add new user name and password</h1>
      <form class="addNewClient">
        <div class="rowForm">
          <lable class="nameLable">User name: </lable>
          <input type="text" class="newUsernameInput">
        </div>
        <div class="rowForm">
          <lable class="nameLable">Password: </lable>
          <input type="text" class="newPasswordInput">
        </div>
      </form>
`;

const openModal = function (type) {
  modal.innerHTML = "";
  modal.insertAdjacentHTML(
    "afterbegin",
    `<button class="close-modal">&times;</button>
  <button class="saveDetails"><img class="saveIcon" src="./icons/saveIconB.png"/></button>`
  );

  if (type === "commercial") {
    modal.insertAdjacentHTML("beforeend", commercialModal);
  } else if (type === "change details") {
    modal.insertAdjacentHTML("beforeend", changeDetails);
  }

  modal.classList.remove("hidden");
  overlay.classList.remove("hidden");

  const btnCloseModal = document.querySelector(".close-modal");
  const saveBtn = document.querySelector(".saveDetails");
  btnCloseModal.addEventListener("click", closeModal);
  saveBtn.addEventListener("click", () => {
    saveDetails(type);
  });
};

const closeModal = function () {
  modal.classList.add("hidden");
  overlay.classList.add("hidden");
};

const saveDetails = function (type) {
  if (type === "commercial") {
    saveNewComm();
  } else if (type === "change details") {
    saveNewDetails();
  }
  closeModal();
};

const saveNewComm = function () {
  const durationInput = document.querySelector(".durationInput");
  const imgUrlInput = document.querySelector(".imgURLInput");

  const client = getClient(currUserId);

  if (client == null) {
    alert("You must choose client first");
    return;
  } else if (durationInput.value == "" || imgUrlInput.value == "") {
    alert("You did not enter all values");
  } else {
    const newCommercial = {
      id: client.commeracials.length + 1,
      duration: Number(durationInput.value),
      imgUrl: imgUrlInput.value,
      img: `${imgUrlInput.value}`,
      // img: './photos/Hanukkah.jpg',
    };

    client.commeracials.push(newCommercial);
    displayComm(client);
    socket.emit("notifyServerToAddCommercial", client.screen, newCommercial);
  }
};

const getClient = function (name) {
  console.log(name);
  let clientToUpdate;
  clientsArr.forEach((client) => {
    if (client.screen === name) {
      clientToUpdate = client;
    }
  });
  return clientToUpdate;
};

let newAdminName, newAdminPass;

const saveNewDetails = function () {
  const newUsername = document.querySelector(".newUsernameInput");
  const newPassword = document.querySelector(".newPasswordInput");

  if (newUsername.value === "" || newPassword.value === "") {
    alert("You must enter username and password");
  } else {
    if (isNaN(newPassword.value)) {
      alert("The Password must be a number");
    } else {
      newAdminName = newUsername.value;
      newAdminPass = newPassword.value;

      socket.emit(
        "notifyServerToChangeAdminPassword",
        newUsername.value,
        newPassword.value
      );
    }
  }
};

addNewCommBtn.addEventListener("click", () => {
  openModal("commercial");
});

const login = `
<div class="login">
      <p class="loginText">Log in to get started..</p>
      <form class="login_form">
        <input
          type="text"
          placeholder="User name"
          class="login_input login_input--user"
        />
        <input
          type="text"
          placeholder="Password"
          maxlength="4"
          class="login_input login_input--password"
        />
        <button class="login_btn">&#10148;</button>
      </form>
    </div>
`;

const adminConnected = `
<div class="buttons">
      <p class="loginText">Admin connected</p>
      <button class="btn btn_settings">
        <img class="settingsIcon" src="./icons/settingsIcon.png" />
        Settings
      </button>
    </div>
`;

const adminInit = () => {
  main.style.visibility = "visible";

  inputLoginUsername.disabled = true;
  inputLoginPin.disabled = true;
  loginBtn.disabled = true;

  body.removeChild(loginElem);
  body.insertAdjacentHTML("afterbegin", adminConnected);
  addEventListenerToButtons();
};

const addEventListenerToButtons = () => {
  const changeDetailsBtn = document.querySelector(".btn_settings");
  changeDetailsBtn.addEventListener("click", () => {
    openModal("change details");
  });
};
