import { getSortedRanking, getRandomChoice } from "./service.js";

document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
  'use strict';

  const HAND_ITEMS = ['Schere', 'Stein', 'Papier', 'Brunnen', 'Streichholz'];
  const HAND_ITEMS_REFERENCE = ['js-scissors-hand-button', 'js-rock-hand-button', 'js-paper-hand-button',
    'js-fountain-hand-button', 'js-matchstick-hand-button'];
  const DEFAULT_USER_NAME = "Anonymaus";
  const NEXT_ROUND_COUNTER_TIME = 3;
  const MAX_RANK_ITEMS = 10;

  let server = false;
  let playerName = DEFAULT_USER_NAME;

  // DOM references
  const startPageContainer = document.getElementById('js-start-page');
  const changeServerButton = document.getElementById('js-change-server-button');
  const loaderContainer = document.getElementById('js-loader');
  const rankingContainer = document.getElementById('js-ranking');
  const rankingContent = document.getElementById('js-ranking-content');
  const playerNameInput = document.getElementById('js-player-name-input')
  const startGameButton = document.getElementById('js-start-game-button');

  const playGameContainer = document.getElementById('js-play-game');
  const playerNameText = document.getElementById('js-player-name');
  const handButtonsContainer = document.getElementById('js-play-game-hand');
  const nextRoundParagraph = document.getElementById('js-next-round');
  const nextRoundCounter = document.getElementById('js-next-round-counter');
  const userHandText = document.getElementById('js-user-hand');
  const versusText = document.getElementById('js-versus-text');
  const enemyHandText = document.getElementById('js-enemy-hand');
  const backToHomeButton = document.getElementById('js-back-to-ranking-button');

  const historyContainer = document.getElementById('js-history');
  const historyTable = document.getElementById('js-history-table');

  // view
  function initView() {
    let buttons = document.createElement("div");
    HAND_ITEMS_REFERENCE.forEach((referenceId, index) => {
      let button = document.createElement("button");
      button.setAttribute("id", referenceId);
      button.innerText = HAND_ITEMS[index];
      buttons.appendChild(button);
    });
    handButtonsContainer.append(buttons);
    clearView();
  }

  async function updateView() {
    changeServerButton.innerText = server ? "Wechsel zu Lokal" : "Wechsel zu Server";

    playerNameText.innerText = playerName + "!";

    let historyDataRows = historyTable.getElementsByClassName("js-history-row");
    if (historyDataRows.length >= MAX_RANK_ITEMS) {
      historyDataRows[historyDataRows.length - 1].remove();
    }
    let history = getLocalStorageItem("history");
    if (typeof history !== 'undefined' && history.length > 0) {
      let recentHistoryItem = history[0];
      let row = historyTable.insertRow(1);
      row.className = "js-history-row";
      let cellOne = row.insertCell(0);
      let cellTwo = row.insertCell(1);
      let cellThree = row.insertCell(2);
      cellOne.innerHTML = getResultHtmlSymbol(recentHistoryItem[0]);
      cellTwo.innerHTML = recentHistoryItem[1];
      cellThree.innerHTML = recentHistoryItem[2];
    }

    let counter = 0;
    let countOfWinningsBefore = 0;
    let countOfSkipped = 0;
    rankingContent.innerHTML = "";
    activateLoadingSpinner(true);
    if (server) {
      Object.values(await getSortedRanking()).forEach(userScore => {
        if (countOfWinningsBefore === userScore["win"]) {
          countOfSkipped++;
        } else {
          counter += countOfSkipped + 1;
          countOfSkipped = 0;
        }
        rankingContent.appendChild(getRankingTitle(userScore["win"], counter));
        rankingContent.appendChild(getRankingBody(userScore["user"]));
        countOfWinningsBefore = userScore["win"];

      })
    } else {
      getLocalStorageItem("userScores").forEach(userScore => {
        if (countOfWinningsBefore === userScore[1]) {
          countOfSkipped++;
        } else {
          counter += countOfSkipped + 1;
          countOfSkipped = 0;
        }
        rankingContent.appendChild(getRankingTitle(userScore[1], counter));
        rankingContent.appendChild(getRankingBody(userScore[0]));
        countOfWinningsBefore = userScore[1];
      });
    }
    activateLoadingSpinner(false);
  }

  function getRankingTitle(countOfWinnings, rank) {
    let rankingTitle = document.createElement("h4");
    rankingTitle.innerText = rank + ". Rang mit " + countOfWinnings + (countOfWinnings === 1 ? " Sieg" : " Siegen");
    return rankingTitle;
  }

  function getRankingBody(userName) {
    let rankingBody = document.createElement("p");
    rankingBody.innerText = userName;
    return rankingBody;
  }

  function clearView() {
    overwriteLocalStorageItem("history", []);
    historyTable.querySelectorAll(".js-history-row").forEach(row => row.remove());
    rankingContent.innerHTML = "";
    userHandText.innerText = "...";
    enemyHandText.innerText = "?"
    userHandText.classList.add("play-game__hand--black");
    enemyHandText.classList.add("play-game__hand--black");
    removeColorClasses();
  }

  // controller & helper functions
  function initLocalStorage() {
    if (getLocalStorageItem("history") === null || getLocalStorageItem("userScores") === null) {
      overwriteLocalStorageItem("history", []);
      overwriteLocalStorageItem("userScores", []);
    }
  }

  function hideAndClearAllContainers() {
    startPageContainer.hidden = true;
    playGameContainer.hidden = true;
    historyContainer.hidden = true;
    clearView();
  }

  function showGame() {
    hideAndClearAllContainers();
    playerName = playerNameInput.value.length > 0 ? playerNameInput.value : DEFAULT_USER_NAME;
    if (!server) {
      pushPlayerToLocalStorage(playerName);
    }
    playGameContainer.hidden = false;
    historyContainer.hidden = false;
    updateView();
  }

  function showStartPage() {
    hideAndClearAllContainers();
    startPageContainer.hidden = false;
    updateView();
  }

  function activateLoadingSpinner(state) {
    if (state) {
      rankingContainer.hidden = true;
      loaderContainer.hidden = false;
    } else {
      loaderContainer.hidden = true;
      rankingContainer.hidden = false;
    }
  }

  async function handleHandSelection(event) {
    let userHandReferenceId = event.target.id
    let userHand = "";
    HAND_ITEMS_REFERENCE.forEach((value, index) => {
      if (userHandReferenceId === value) {
        userHandText.innerText = HAND_ITEMS[index];
        userHand = HAND_ITEMS[index];
      }
    })

    updateHandButtonsDisabled(true);
    removeColorClasses();

    let randomHandReferenceId = await getRandomResult(userHand);
    handleGameResult(userHandReferenceId, randomHandReferenceId, userHand,
      HAND_ITEMS[HAND_ITEMS_REFERENCE.indexOf(randomHandReferenceId)]);

    updateView();
    waitingCounter();
  }

  function removeColorClasses() {
    userHandText.classList.remove("play-game__hand--green");
    enemyHandText.classList.remove("play-game__hand--green");
    userHandText.classList.remove("play-game__hand--red");
    enemyHandText.classList.remove("play-game__hand--red");
    userHandText.classList.remove("play-game__hand--black");
    enemyHandText.classList.remove("play-game__hand--black");
  }

  function handleGameResult(userHandReferenceId, randomHandReferenceId, userHand, randomHand) {
    enemyHandText.innerText = randomHand;

    // TODO possible optimization: 2d array with -1, 0 and 1 for lose, tie and win
    if (userHandReferenceId === randomHandReferenceId) {
      userHandText.classList.add("play-game__hand--black");
      enemyHandText.classList.add("play-game__hand--black");
      pushToLocalStorageItem("history", [0, userHand, randomHand], 10);
    } else {
      if (checkIfUserWins(userHandReferenceId, randomHandReferenceId)) {
        userHandText.classList.add("play-game__hand--green");
        enemyHandText.classList.add("play-game__hand--red");
        pushToLocalStorageItem("history", [1, userHand, randomHand], 10);

        if (!server) {
          let userScores = getLocalStorageItem("userScores");
          userScores.forEach((value, index) => {
            if (value[0] === playerName) {
              userScores[index][1] = value[1] + 1;
            }
          });
          userScores.sort((a, b) => {
            return a[1] === b[1] ? 0 : (a[1] > b[1] ? -1 : 1);
          });
          overwriteLocalStorageItem("userScores", userScores);
        }
      } else {
        userHandText.classList.add("play-game__hand--red");
        enemyHandText.classList.add("play-game__hand--green");
        pushToLocalStorageItem("history", [-1, userHand, randomHand], 10);
      }
    }
  }

  function waitingCounter() {
    nextRoundCounter.innerText = NEXT_ROUND_COUNTER_TIME.toString();
    versusText.hidden = true;
    nextRoundParagraph.hidden = false;

    let currentCount = NEXT_ROUND_COUNTER_TIME;
    let counter = setInterval(function () {
      if (currentCount <= 1) {
        clearInterval(counter);
        updateHandButtonsDisabled(false);
        nextRoundParagraph.hidden = true;
        versusText.hidden = false;

      }
      currentCount--;
      nextRoundCounter.innerText = currentCount.toString();
    }, 1000);
  }

  function updateHandButtonsDisabled(state) {
    HAND_ITEMS_REFERENCE.forEach(reference => {
      document.getElementById(reference).disabled = state;
    });
  }

  function getResultHtmlSymbol(result) {
    let resultSymbol = "";
    switch (result) {
      case 1:
        resultSymbol = "&#x2714;";
        break;
      case 0:
        resultSymbol = "=";
        break;
      case -1:
        resultSymbol = "&#x2718;";
        break;
    }
    return resultSymbol;
  }

  function checkIfUserWins(userChoice, computerChoice) {
    // TODO use 2d array
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

  // local storage helpers
  function pushToLocalStorageItem(key, value, limit) {
    let currentValue = JSON.parse(window.localStorage.getItem(key));
    currentValue.unshift(value);
    if (currentValue.length > limit) {
      currentValue.length = limit;
    }
    overwriteLocalStorageItem(key, currentValue);
  }

  function pushPlayerToLocalStorage(name) {
    let currentValue = JSON.parse(window.localStorage.getItem("userScores"));
    let userExists = false;
    currentValue.forEach(value => {
      userExists = value[0] === name;
    });
    if (!userExists) {
      currentValue.push([name, 0]);
      overwriteLocalStorageItem("userScores", currentValue);
    }
  }

  function getLocalStorageItem(key) {
    return JSON.parse(window.localStorage.getItem(key));
  }

  function overwriteLocalStorageItem(key, newValue) {
    window.localStorage.setItem(key, JSON.stringify(newValue));
  }

  async function getRandomResult(userHand) {
    if (server) {
      let responseData = await getRandomChoice(playerName, userHand);
      return HAND_ITEMS_REFERENCE[HAND_ITEMS.indexOf(responseData["choice"])];
    } else {
      let min = Math.ceil(0);
      let max = Math.floor(HAND_ITEMS.length - 1);
      return HAND_ITEMS_REFERENCE[Math.floor(Math.random() * (max - min + 1)) + min];
    }
  }

  // init view and display initial state
  initView();
  initLocalStorage();
  updateView();

  // attach eventListeners
  startGameButton.addEventListener('click', showGame);
  backToHomeButton.addEventListener('click', showStartPage);
  changeServerButton.addEventListener('click', () => {
    server = !server;
    updateView();
  });
  handButtonsContainer.querySelectorAll("button").forEach(element => {
      element.addEventListener('click', handleHandSelection)
    }
  );

}
