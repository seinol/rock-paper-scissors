const SERVER_BASE_URL = "https://us-central1-schere-stein-papier-ee0c9.cloudfunctions.net";

export const getRandomChoice = async function (playerName, userHand) {
  const response =
    await fetch(SERVER_BASE_URL + "/widgets/play?playerName=" + playerName + "&playerHand=" + userHand, {
      method: 'get'
    });
  return await response.json();
}

export const getRanking = async function () {
  let response = await fetch(SERVER_BASE_URL + "/widgets/ranking", {
    method: 'get'
  });
  return await response.json();
}

export const getSortedRanking = async function () {
  return Object.values(await getRanking()).sort((a, b) => b['win'] - a['win']).slice(0, 10)
}
