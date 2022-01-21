let clientsArr = [];
const connectedClients = [];
const disconnectedClientsArr = [];

/* ------------ Containers ------------ */

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

const addNewUserDataRow = (client, type) => {
  if (type === "connected") {
    connectedClients.push(client);
  } else if (type === "disconnected") {
    disconnectedClientsArr.push(client);
  }
  displayUserData(type);
};

const removeUserDataRow = (client, type) => {
  if (type === "connected") {
    const index = connectedClients.indexOf(client);
    connectedClients.splice(index, 1);
  } else if (type === "disconnected") {
    const index = disconnectedClientsArr.indexOf(client);
    disconnectedClientsArr.splice(index, 1);
  }
  displayUserData(type);
};

const displayUserData = (type) => {
  if (type === "connected") {
    connectedListCont.innerHTML = "";
    connectedClients.forEach((client) => {
      const element = createUserDataRow(client);
      connectedListCont.insertAdjacentHTML("afterbegin", element);
    });
  } else if (type === "disconnected") {
    disconnectedListCont.innerHTML = "";
    disconnectedClientsArr.forEach((client) => {
      const element = createUserDataRow(client);
      disconnectedListCont.insertAdjacentHTML("afterbegin", element);
    });
  }
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
      const currUser = e.target.parentElement.parentElement.parentElement;
      const userID = currUser.id;

      currUser.remove();
      socket.emit("notifyServerToRemoveClient", userID);
    });
  });

  // Display client's commercials
  const displayBtn = document.querySelectorAll(".btn_edit--client");
  displayBtn.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const currUser = e.target.parentElement.parentElement.parentElement;
      const userID = currUser.id;

      clientsArr.forEach((client) => {
        if (client.screen === userID) {
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
          editComm(comm, client, currComm);
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
  const element = `<div class="commercial_card" id="${comm.id}">
    <h1 class="commercial_num">Commercial ${comm.id}</h1>
    <p class="durationComm">${comm.duration}</p>
    <p class="imgUrlComm">${comm.imgUrl}</p>
    <img class='commercial_img' src="${comm.img}" alt="">
    <div class="button_box">
      <button class='btn btn_edit--comm'><img class="editIcon" src="./icons/editIconB.png"/></button>
      <button class='btn btn_remove--comm'><img class="removeIcon" src="./icons/removeIconB.png"/></button>
      <button class='btn btn_save--comm'><img class="saveIcon" src="./icons/saveIcon.png"/></button>
    </div>
  </div>`;

  return element;
}

function editComm(comm, client, commElement) {
  const duration = commElement.querySelector(".durationComm");
  const imgUrl = commElement.querySelector(".imgUrlComm");

  const durationInput = createInputElement("duration", duration.innerHTML);
  commElement.replaceChild(durationInput, duration);

  // imgURL
  const imgUrlInput = createInputElement("imgUrl", imgUrl.innerHTML);
  commElement.replaceChild(imgUrlInput, imgUrl);
}

function saveComm(comm, client, currComm) {
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
  socket.emit("notifyServerToEditClient", client);
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
const addNewClientBtn = document.querySelector(".addBtn--client");
const addNewCommBtn = document.querySelector(".addBtn--comm");

const clientModal = `
      <h1>Add new client</h1>
      <form class="addNewClient">
        <div class="rowForm">
          <lable class="nameLable">Client Name: </lable>
          <input type="text" class="newNameInput">
        </div>
      </form>
`;
const commercialModal = `
      <h1>Add new client</h1>
      <form class="addNewClient">
        <div class="rowForm">
          <lable class="nameLable">Client: </lable>
          <input type="text" class="clientInput">
        </div>
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

const openModal = function (type) {
  modal.innerHTML = "";
  modal.insertAdjacentHTML(
    "afterbegin",
    `<button class="close-modal">&times;</button>
  <button class="saveDetails"><img class="saveIcon" src="./icons/saveIconB.png"/></button>`
  );
  if (type === "client") {
    modal.insertAdjacentHTML("beforeend", clientModal);
  } else if (type === "commercial") {
    modal.insertAdjacentHTML("beforeend", commercialModal);
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
  if (type === "client") {
    saveNewClient();
  } else if (type === "commercial") {
    saveNewComm();
  }
  closeModal();
};

const saveNewClient = function () {
  const newClientName = document.querySelector(".newNameInput");
  const newClient = {
    screen: newClientName.value,
  };

  clientsArr.push(newClient);
  displayClients();

  socket.emit("notifyServerToAddClient", newClient);
};

const saveNewComm = function () {
  const clientInput = document.querySelector(".clientInput");
  const durationInput = document.querySelector(".durationInput");
  const imgUrlInput = document.querySelector(".imgURLInput");

  const client = getClient(clientInput.value);
  // console.log(client);
  if (client == null) {
    alert("Client not found..");
    return;
  }
  const newCommercial = {
    id: client.commeracials.length + 1,
    duration: durationInput.value,
    imgUrl: imgUrlInput.value,
    img: "./photos/Hanukkah.jpg",
  };

  client.commeracials.push(newCommercial);
  displayComm(client);
  socket.emit("notifyServerToAddCommercial", client.screen, newCommercial);
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

addNewClientBtn.addEventListener("click", () => {
  openModal("client");
});

addNewCommBtn.addEventListener("click", () => {
  openModal("commercial");
});

displayClients();
