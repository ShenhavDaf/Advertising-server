const commercialsArr = [];
let clientsArr = [];

const connectedClients = [];
const disconnectedClientsArr = [];

/* -- Containers -- */
const connectedListCont = document.querySelector(".client_list--connected");
const disconnectedListCont = document.querySelector(
  ".client_list--disconnected"
);
const clientsContainer = document.querySelector(".clients_container");
const commContainer = document.querySelector(".commercials_container");

/* -- Buttons -- */
const addNewClientBtn = document.querySelector(".addBtn--client");
const addNewCommBtn = document.querySelector(".addBtn--comm");
addNewClientBtn.addEventListener("click", (e) => {
  e.preventDefault();
  displayUserData("connected");
  displayUserData("disconnected");
  socket.emit("notifyServerToAddNewClient");

  displayClients();
});

/* ORTAL - added to check if the notifyServerToAddCommercial in mongo works
 * it needs to get an input from the admin(TODO) 
this button suposed to be hidden until the admin press the edit button */
addNewCommBtn.addEventListener("click", (e) => {
  e.preventDefault();
  console.log("111111111");
  socket.emit("notifyServerToAddCommercial", "screen-1");
  displayClients();
});

// removeBtn.forEach((btn) => {
//   btn.addEventListener('click', (e) => {
//     e.preventDefault();
//     console.log('mshvfba,');
//     console.log(e.target.parentElement);
//   });
// });

/* -- User data functions -- */
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

/* -- Clients functions -- */

const displayClients = () => {
  clientsContainer.innerHTML = "";
  clientsArr.forEach((client) => {
    const element = createClientRow(client);
    clientsContainer.insertAdjacentHTML("afterbegin", element);
  });

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
                <button class='btn btn_edit--client'><img class="editIcon" src="./editIconB.png"/></button>
                <button class='btn btn_remove--client'><img class="removeIcon" src="./removeIconB.png"/></button>
              </div>
    </div>
    `;
  return element;
};

// Add new client
// Edit client
// Remove client

/* -- Commercials functions -- */

// Add new commercial

function displayComm(client) {
  const input = document.getElementById("clientNameInput");

  input.placeholder = client.screen;

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

      const currComm = e.target.parentElement.parentElement;
      const commID = currComm.id;

      currComm.remove();

      socket.emit("notifyServerToRemoveComm", client, commID);
    });
  });

  // Edit spesific commercial (text+ image url)
  editCommBtn.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const currComm = e.target.parentElement.parentElement;
      const commID = currComm.id;

      client.commeracials.forEach((comm) => {
        if (comm.id === Number(commID)) {
          editComm(comm, client);
        }
      });
    });
  });

  // Save commercial (text+ image url)
  saveCommBtn.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const currComm = e.target.parentElement;

      console.log("from save");
      console.log(currComm);
      const commID = currComm.id;

      // console.log(client.commeracials);

      client.commeracials.forEach((comm) => {
        console.log(comm.id);
        console.log(commID);
        if (comm.id === Number(commID)) {
          saveComm(comm, client);
        }
      });
    });
  });
}

function createCommercialsRow(comm) {
  const element = `<div class="commercial_card" id="${comm.id}">
  <h1 class="commercial_num">Commercial ${comm.id}</h1>
  <input type="text" id="durationInput" placeholder="${comm.duration}" />
  <input type="text" id="urlInput" placeholder="${comm.imgUrl}" />
  <img class='commercial_img' src="${comm.img}" alt="" style="width: 50px; height: 50px;>
  <div class="button_box">
    <button class='btn btn_edit--comm'><img class="editIcon" src="./editIconB.png"/></button>

    <button class='btn btn_remove--comm'><img class="removeIcon" src="./removeIconB.png"/></button>
    
    <button class='btn btn_save--comm'><img class="removeIcon" src="./removeIconB.png"/>SAVE</button>
  </div>
</div>`;

  return element;
}

function editComm(comm, client) {
  const clientNameInput = document.getElementById("clientNameInput");
  const durationInput = document.getElementById("durationInput");
  const urlInput = document.getElementById("urlInput");

  clientNameInput.value = client.screen;
  durationInput.value = comm.duration;
  urlInput.value = comm.imgUrl;

  // console.log(durationInput);
}

function saveComm(comm, client) {
  const clientNameInput = document.getElementById("clientNameInput");
  const durationInput = document.getElementById("durationInput");
  const urlInput = document.getElementById("urlInput");

  client.screen = clientNameInput.value;
  comm.duration = Number(durationInput.value);
  comm.imgUrl = urlInput.value;

  // console.log(durationInput);

  socket.emit("notifyServerToEditClient", client);
}
