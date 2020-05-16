function initApp() {
  'use strict';

  const HAND_ITEMS = ['Schere', 'Stein', 'Papier', 'Brunnen', 'Streichholz'];
  const HAND_ITEMS_REFERENCE = ['js-scissors-hand-button', 'js-rock-hand-button',
    'js-paper-hand-button', 'js-fountain-hand-button', 'js-matchstick-hand-button'];
  const MAX_RANK_ITEMS = 10;
  const NEXT_ROUND_COUNTER_TIME = 3;
  const DEFAULT_USER_NAME = "Anonymaus";

  let server = false;

  let playerName = DEFAULT_USER_NAME;

  const startPageContainer = document.getElementById('js-start-page');
  const changeServerButton = document.getElementById('js-change-server-button');
  const loaderContainer = document.getElementById('js-loader');
  const rankingContainer = document.getElementById('js-ranking');
  const startGameContainer = document.getElementById('js-start-game');
  const playerNameInput = document.getElementById('js-player-name-input')
  const startGameButton = document.getElementById('js-start-game-button');

  const playGameContainer = document.getElementById('js-play-game');
  const playerNameText = document.getElementById('js-player-name');
  const handButtonsContainer = document.getElementById('js-play-game-hand');
  const nextRoundParagraph = document.getElementById('js-next-round');
  const nextRoundCounter = document.getElementById('js-next-round-counter');
  const userHandText = document.getElementById('js-user-hand');
  // const versusText = document.getElementById('js-next-round-counter');
  const enemyHandText = document.getElementById('js-enemy-hand');
  const backToHomeButton = document.getElementById('js-back-to-ranking-button');

  const historyContainer = document.getElementById('js-history');
  const historyTable = document.getElementById('js-history-table');

  function initView() {
    console.log("initView");
    let buttons = document.createElement("div");
    HAND_ITEMS_REFERENCE.forEach((referenceId, index) => {
      let button = document.createElement("button");
      button.setAttribute("id", referenceId);
      button.innerText = HAND_ITEMS[index];
      button.type = "button";
      buttons.appendChild(button);
    });
    handButtonsContainer.append(buttons);
  }

  function initLocalStorage() {
    window.localStorage.setItem("history", JSON.stringify([]));
    window.localStorage.setItem("userScores", JSON.stringify([]));
  }

  function updateView() {
    console.log("updateView");

    let history = JSON.parse(window.localStorage.getItem("history"));
    history.forEach(historyItem => {
      console.log(historyItem);
      //TODO implement history table update
    })

    //TODO implement ranking table update
  }

  // controller & helper functions
  function hideAllContainers() {
    startPageContainer.hidden = true;
    playGameContainer.hidden = true;
    historyContainer.hidden = true;
  }

  function showGame() {
    hideAllContainers();
    playerName = playerNameInput.value.length !== 0 ? playerNameInput.value : DEFAULT_USER_NAME;
    playerNameText.innerText = playerName + "!";
    updateLocalStorageItem("userScores", [playerName, 0]);
    playGameContainer.hidden = false;
    historyContainer.hidden = false;
  }

  function showStartPage() {
    hideAllContainers();
    startPageContainer.hidden = false;
  }

  async function changeServerState() {
    server = !server;
    if (server) {
      rankingContainer.hidden = true;
      loaderContainer.hidden = false;
      await changeToServer();
      loaderContainer.hidden = true;
      rankingContainer.hidden = false;
      changeServerButton.innerText = "Wechsel zu Lokal";
    } else {
      rankingContainer.hidden = false;
      changeServerButton.innerText = "Wechsel zu Server";
    }
  }

  function handSelect(event) {
    let userHandReferenceId = event.target.id
    let userHand = "";
    HAND_ITEMS_REFERENCE.forEach((value, index) => {
      if (userHandReferenceId === value) {
        userHandText.innerText = HAND_ITEMS[index];
        userHand = HAND_ITEMS[index];
      }
    })

    if (server) {
      //TODO implement server side
    } else {
      let randomHandReferenceId = getRandomAnswer();
      let randomHand = HAND_ITEMS[HAND_ITEMS_REFERENCE.indexOf(randomHandReferenceId)];
      enemyHandText.innerText = randomHand;
      if (userHandReferenceId === randomHandReferenceId) {
        userHandText.style.color = 'black';
        enemyHandText.style.color = 'black';
        updateLocalStorageItem("history", ["TIE", userHand, randomHand]);
      } else {
        if (checkIfUserWins(userHandReferenceId, randomHandReferenceId)) {
          userHandText.style.color = 'green';
          enemyHandText.style.color = 'red';
          updateLocalStorageItem("history", ["LOSE", userHand, randomHand]);
          //TODO implement updateUserScore
        } else {
          userHandText.style.color = 'red';
          enemyHandText.style.color = 'green';
          updateLocalStorageItem("history", ["WON", userHand, randomHand]);
        }
      }
    }
    updateView();
  }

  function checkIfUserWins(userChoice, computerChoice) {
    if (userChoice === "js-scissors-hand-button") {
      return computerChoice === "js-paper-hand-button" || computerChoice === "js-matchstick-hand-button";
    }
    if (userChoice === "js-rock-hand-button") {
      return computerChoice === "js-scissors-hand-button" || computerChoice === "js-matchstick-hand-button";
    }
    if (userChoice === "js-paper-hand-button") {
      return computerChoice === "js-rock-hand-button" || computerChoice === "js-fountain-hand-button";
    }
    if (userChoice === "js-fountain-hand-button") {
      return computerChoice === "js-rock-hand-button" || computerChoice === "js-scissors-hand-button";
    }
    if (userChoice === "js-matchstick-hand-button") {
      return computerChoice === "js-paper-hand-button" || computerChoice === "js-fountain-hand-button";
    }
    return false;
  }

  function updateLocalStorageItem(key, value) {
    let currentValue = JSON.parse(window.localStorage.getItem(key));
    currentValue.push(value);
    window.localStorage.setItem(key, JSON.stringify(currentValue))
  }

  function getRandomAnswer() {
    let min = Math.ceil(0);
    let max = Math.floor(HAND_ITEMS.length - 1);
    let randomHandIndex = Math.floor(Math.random() * (max - min + 1)) + min;
    return HAND_ITEMS_REFERENCE[randomHandIndex];
  }

  async function changeToServer() {
    //TODO implement ajax call to backend and update ranking content
    return await new Promise(resolve => setTimeout(resolve, 1000));
  }

// init view / display initial state
  initView();
  initLocalStorage();
  updateView();

//attach eventListeners
  startGameButton.addEventListener('click', showGame)
  backToHomeButton.addEventListener('click', showStartPage);
  changeServerButton.addEventListener('click', changeServerState)
  handButtonsContainer.querySelectorAll("button").forEach(element => {
      element.addEventListener('click', handSelect)
    }
  )
}
