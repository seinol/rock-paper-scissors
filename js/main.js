function initApp() {
  'use strict';

  console.log("initApp");

  const HAND_ITEMS = ['Schere', 'Stein', 'Papier', 'Brunnen', 'Streichholz'];
  const MAX_RANK_ITEMS = 10;
  const NEXT_ROUND_COUNTER_TIME = 3;

  let server = false;

  let userHand = null;
  let enemyHand = null;

  // let playerName = "Anonymaus";

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
  const enemyHandText = document.getElementById('"js-enemy-hand');
  const backToHomeButton = document.getElementById('js-back-to-ranking-button');

  const historyContainer = document.getElementById('js-history');
  const historyTable = document.getElementById('js-history-table');

  function initView() {
    console.log("initView");
    HAND_ITEMS.forEach(function(item) {
      // TODO implement buttons init View!
    });
  }

  function updateView() {
    console.log("updateView");
  }

  // controller & helper functions
  function hideAllContainers() {
    startPageContainer.hidden = true;
    playGameContainer.hidden = true;
    historyContainer.hidden = true;
  }

  function showGame() {
    hideAllContainers();
    // playerNameText.innerText = playerNameInput.value();
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

  async function changeToServer() {
    //TODO implement ajax call to backend and update ranking content
    return await new Promise(resolve => setTimeout(resolve, 1000));
  }

  //attach eventListeners
  startGameButton.addEventListener('click', showGame)
  backToHomeButton.addEventListener('click', showStartPage);
  changeServerButton.addEventListener('click', changeServerState)

  // init view / display initial state
  initView();
  updateView();
}
