function initApp() {
  'use strict';

  const HAND_ITEMS = ['Schere', 'Stein', 'Papier', 'Brunnen', 'Streichholz'];
  const HAND_ITEMS_REFERENCE = ['js-scissors-hand-button', 'js-rock-hand-button', 'js-paper-hand-button',
    'js-fountain-hand-button', 'js-matchstick-hand-button'];
  const SERVER_BASE_URL = "https://us-central1-schere-stein-papier-ee0c9.cloudfunctions.net";
  const DEFAULT_USER_NAME = "Anonymaus";
  const NEXT_ROUND_COUNTER_TIME = 3;
  const MAX_RANK_ITEMS = 10;

  let server = false;
  let playerName = DEFAULT_USER_NAME;

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

  function initView() {
    let buttons = document.createElement("div");
    HAND_ITEMS_REFERENCE.forEach((referenceId, index) => {
      let button = document.createElement("button");
      button.setAttribute("id", referenceId);
      button.innerText = HAND_ITEMS[index];
      buttons.appendChild(button);
    });
    handButtonsContainer.append(buttons);
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
      cellOne.innerHTML = recentHistoryItem[0];
      cellTwo.innerHTML = recentHistoryItem[1];
      cellThree.innerHTML = recentHistoryItem[2];
    }

    let counter = 1;
    rankingContent.innerHTML = "";
    activateLoadingSpinner(true);
    if (server) {
      let response = await fetch(SERVER_BASE_URL + "/widgets/ranking", {
        method: 'get'
      });
      let responseData = await response.json();
      let sortedRankingList = Object.values(responseData).sort((a, b) => b['win'] - a['win']).slice(0, 10);
      sortedRankingList.forEach(userScore => {
        let rankingTitle = document.createElement("h4");
        rankingTitle.innerText =
          counter + ". Rang mit " + userScore["win"] + (userScore["win"] === 1 ? " Sieg" : " Siegen");
        let rankingBody = document.createElement("p");
        rankingBody.innerText = userScore["user"];
        rankingContent.appendChild(rankingTitle);
        rankingContent.appendChild(rankingBody);
        counter++;
      })
    } else {
      getLocalStorageItem("userScores").forEach(userScore => {
        let rankingTitle = document.createElement("h4");
        rankingTitle.innerText = counter + ". Rang mit " + userScore[1] + (userScore[1] === 1 ? " Sieg" : " Siegen");
        let rankingBody = document.createElement("p");
        rankingBody.innerText = userScore[0];
        rankingContent.appendChild(rankingTitle);
        rankingContent.appendChild(rankingBody);
        counter++;
      });
    }
    activateLoadingSpinner(false);
  }

  function clearView() {
    historyTable.querySelectorAll(".js-history-row").forEach(row => row.remove());
    rankingContent.innerHTML = "";
    userHandText.innerText = "...";
    enemyHandText.innerText = "?"
    userHandText.style.color = 'black';
    enemyHandText.style.color = 'black';
  }

  function initLocalStorage() {
    if (getLocalStorageItem("history") === null || getLocalStorageItem("userScores") === null) {
      window.localStorage.setItem("history", JSON.stringify([]));
      window.localStorage.setItem("userScores", JSON.stringify([]));
    }
  }

  // controller & helper functions
  function hideAllContainers() {
    startPageContainer.hidden = true;
    playGameContainer.hidden = true;
    historyContainer.hidden = true;
    clearView();
  }

  function showGame() {
    hideAllContainers();
    playerName = playerNameInput.value.length > 0 ? playerNameInput.value : DEFAULT_USER_NAME;
    if (!server) {
      pushPlayerToLocalStorage(playerName);
    }
    playGameContainer.hidden = false;
    historyContainer.hidden = false;
    updateView();
  }

  function showStartPage() {
    hideAllContainers();
    startPageContainer.hidden = false;
    overwriteLocalStorageItem("history", []);
    updateView();
  }

  async function handSelect(event) {
    let userHandReferenceId = event.target.id
    let userHand = "";
    HAND_ITEMS_REFERENCE.forEach((value, index) => {
      if (userHandReferenceId === value) {
        userHandText.innerText = HAND_ITEMS[index];
        userHand = HAND_ITEMS[index];
      }
    })

    updateHandButtonsDisabled(true);

    let randomHandReferenceId = await getRandomAnswer(userHand);
    let randomHand = HAND_ITEMS[HAND_ITEMS_REFERENCE.indexOf(randomHandReferenceId)];
    enemyHandText.innerText = randomHand;
    if (userHandReferenceId === randomHandReferenceId) {
      userHandText.style.color = 'black';
      enemyHandText.style.color = 'black';
      pushToLocalStorageItem("history", ["TIE", userHand, randomHand], 10);
    } else {
      if (checkIfUserWins(userHandReferenceId, randomHandReferenceId)) {
        userHandText.style.color = 'green';
        enemyHandText.style.color = 'red';
        pushToLocalStorageItem("history", ["WIN", userHand, randomHand], 10);
        let userScores = getLocalStorageItem("userScores");
        userScores.forEach((value, index) => {
          if (value[0] === playerName) {
            userScores[index][1] = value[1] + 1;
          }
        });
        userScores.sort(userScoresSorting);
        userScores.reverse();
        if (!server) {
          overwriteLocalStorageItem("userScores", userScores);
        }
      } else {
        userHandText.style.color = 'red';
        enemyHandText.style.color = 'green';
        pushToLocalStorageItem("history", ["LOSE", userHand, randomHand], 10);
      }
    }
    updateView();
    waitingCounter();
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

  function userScoresSorting(a, b) {
    if (a[1] === b[1]) {
      return 0;
    } else {
      return (a[1] < b[1]) ? -1 : 1;
    }
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

  function pushToLocalStorageItem(key, value, limit) {
    let currentValue = JSON.parse(window.localStorage.getItem(key));
    currentValue.unshift(value);
    if (currentValue.length > limit) {
      currentValue.length = limit;
    }
    window.localStorage.setItem(key, JSON.stringify(currentValue));
  }

  function pushPlayerToLocalStorage(name) {
    let currentValue = JSON.parse(window.localStorage.getItem("userScores"));
    let userExists = false;
    currentValue.forEach(value => {
      userExists = value[0] === name;
    });
    if (!userExists) {
      currentValue.push([name, 0]);
      window.localStorage.setItem("userScores", JSON.stringify(currentValue));
    }
  }

  function getLocalStorageItem(key) {
    return JSON.parse(window.localStorage.getItem(key));
  }

  function overwriteLocalStorageItem(key, newValue) {
    window.localStorage.setItem(key, JSON.stringify(newValue));
  }

  async function getRandomAnswer(userHand) {
    if (server) {
      const response =
        await fetch(SERVER_BASE_URL + "/widgets/play?playerName=" + playerName + "&playerHand=" + userHand, {
          method: 'get'
        });
      let responseData = await response.json();
      return HAND_ITEMS_REFERENCE[HAND_ITEMS.indexOf(responseData["choice"])];
    } else {
      let min = Math.ceil(0);
      let max = Math.floor(HAND_ITEMS.length - 1);
      return HAND_ITEMS_REFERENCE[Math.floor(Math.random() * (max - min + 1)) + min];
    }
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

  // init view / display initial state
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
      element.addEventListener('click', handSelect)
    }
  );

}
