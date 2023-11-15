import * as tf from '@tensorflow/tfjs-core';
import * as tflite from '@tensorflow/tfjs-tflite';
import { INITIAL_FEN } from '../constants/board-params';

tflite.setWasmPath(
  'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.8/dist/'
);

export function correctionFen(fen) {
  if (
    fen.length &&
    fen[fen.length - 6] &&
    fen[fen.length - 6].match(/[a-z]/i)
  ) {
    return (
      fen.substring(0, fen.length - 6) +
      '-' +
      fen.substring(fen.length - 5 + '-'.length)
    );
  }
  return fen;
}

export function recoverLastSession(restoreAllPgnArr, setFen, setFeatureTab) {
  const activeTab = sessionStorage.getItem('chessify_active_notation_tab');
  const analysisNotationTab = sessionStorage.getItem(
    'chessify_analysis_notation_tab'
  );
  const notationPgnTabArr = JSON.parse(
    sessionStorage.getItem('chessify_notation_tab_arr')
  );

  if (
    (activeTab || activeTab === 0) &&
    notationPgnTabArr &&
    notationPgnTabArr.length &&
    ((notationPgnTabArr[activeTab].tabPgnStr &&
      notationPgnTabArr[activeTab].tabPgnStr.length > 2) ||
      notationPgnTabArr.length > 1)
  ) {
    let loadLast = window.confirm('Load the last session?');

    if (loadLast === true) {
      restoreAllPgnArr(notationPgnTabArr, activeTab, analysisNotationTab);
    } else {
      sessionStorage.removeItem('chessify_active_notation_tab');
      sessionStorage.removeItem('chessify_analysis_notation_tab');
      sessionStorage.removeItem('chessify_notation_tab_arr');
      restoreLink(setFen, setFeatureTab);
    }
  } else {
    restoreLink(setFen, setFeatureTab);
  }
}

const restoreLink = (setFen, setFeatureTab) => {
  const url = new URL(window.location.href);
  const activeTabFromUrl =
    url.searchParams.get('activeTab') !== null
      ? url.searchParams.get('activeTab')
      : 0;
  const fenFromUrl =
    url.searchParams.get('fen') !== null ? url.searchParams.get('fen') : INITIAL_FEN;

  if (fenFromUrl.length) {
    const fen = correctionFen(fenFromUrl);
    setFen(fen);
  }
  setFeatureTab(activeTabFromUrl);
};

export function showEngineInfo(type) {
  switch (type) {
    case 'Normal':
      return 'The server will connect in 2-3 minutes. Meanwhile, you can analyze on 10MN/s server for Free.';
    case 'Delayed':
      return 'Sorry, additional 2-3 minutes are needed for server allocation.';
    case 'Try Later':
      return 'Sorry, but this time your order could not be completed. Please try later.';
    default:
      return 'Free analysis on a server of up to 100,000 kN/s speed';
  }
}

export function clearSavedAnalyzeInfoFromSessionStorage() {
  if (sessionStorage.getItem('latest_analyze_info')) {
    sessionStorage.removeItem('latest_analyze_info');
  }
}

export function checkForUnlimitedPopUp(userFullInfo) {
  let needsAnalyzeCheck = false;
  if (!userFullInfo.servers) return needsAnalyzeCheck;

  const isSubscriptionUnlim =
    userFullInfo.subscription &&
    (parseInt(userFullInfo.subscription.product_id) === 22 ||
      parseInt(userFullInfo.subscription.product_id) === 23 ||
      parseInt(userFullInfo.subscription.product_id) === 25 ||
      parseInt(userFullInfo.subscription.product_id) === 33 ||
      parseInt(userFullInfo.subscription.product_id) === 34 ||
      parseInt(userFullInfo.subscription.product_id) === 35 ||
      parseInt(userFullInfo.subscription.product_id) === 36 ||
      parseInt(userFullInfo.subscription.product_id) === 37 ||
      parseInt(userFullInfo.subscription.product_id) === 38 ||
      parseInt(userFullInfo.subscription.product_id) === 39 ||
      parseInt(userFullInfo.subscription.product_id) === 40 ||
      parseInt(userFullInfo.subscription.product_id) === 41 ||
      parseInt(userFullInfo.subscription.product_id) === 42);

  for (const [engine, params] of Object.entries(userFullInfo.servers)) {
    if (
      params[0] &&
      (params[0].cores === 32 ||
        params[0].cores === 16 ||
        (params[0].cores === 100 && isSubscriptionUnlim))
    ) {
      needsAnalyzeCheck = true;
    }
  }
  return needsAnalyzeCheck;
}

export function filterUnlimitedServerNames(userFullInfo) {
  let servers = userFullInfo.servers;
  if (!servers) return [];

  let unlimitedNames = [];

  const isSubscriptionUnlim =
    userFullInfo.subscription &&
    (parseInt(userFullInfo.subscription.product_id) === 22 ||
      parseInt(userFullInfo.subscription.product_id) === 23 ||
      parseInt(userFullInfo.subscription.product_id) === 25);

  for (const [engine, params] of Object.entries(userFullInfo.servers)) {
    if (
      params[0] &&
      (params[0].cores === 32 ||
        params[0].cores === 16 ||
        (params[0].cores === 100 && isSubscriptionUnlim))
    ) {
      unlimitedNames.push(engine);
    }
  }
  return unlimitedNames;
}

export function switchToBoard(
  setFen,
  setBoardOrientation,
  setEditMode,
  isEditMode,
  setPgn,
  fen
) {
  const url_string = window.location.href;
  const url = new URL(url_string);
  const fenFromUrl = url.searchParams.get('fen');
  const orientation = window.LichessEditor.getOrientation();
  if (fenFromUrl && fenFromUrl !== fen) {
    window.confirm(
      'Your current position will be reset. Are you sure you want set new position?'
    ) && setFen(correctionFen(fenFromUrl));
  }
  setBoardOrientation(orientation);
  setEditMode(!isEditMode);
}

export function matchFenWithPopularPosition(boardFen, popularPositionArray) {
  return popularPositionArray.find(
    ({ fen }) => fen === correctionFen(boardFen)
  );
}

export function disableDecodeChessButton(userFullInfo) {
  const { balance, decode_trial_passed, decode_chess } = userFullInfo;
  if (decode_trial_passed === false) {
    return false;
  }
  if (decode_chess !== null || balance >= 20) {
    return false;
  }
  return true;
}

export function showDecodeChessSpecialOfferSection(userFullInfo) {
  const { decode_chess } = userFullInfo;
  if (decode_chess === null) {
    return true;
  }
  return false;
}

const YOUTUBE_PLAYLIST_ITEMS_API =
  'https://www.googleapis.com/youtube/v3/playlistItems';
const YOUTUBE_API_KEY = 'AIzaSyBi8PP8aBM0u1Z7c7SKI6rcoO6t7fXtF6c';
const PLAYLIST_ID = 'PL4hIB5mj1H1EQRWnjwgVfNUSJzgr9Wiml';

export async function getServerSideProps() {
  const res = await fetch(
    `${YOUTUBE_PLAYLIST_ITEMS_API}?part=snippet&maxResults=50&playlistId=${PLAYLIST_ID}&key=${YOUTUBE_API_KEY}`
  );
  const data = await res.json();
  return data;
}

export const dataURIToBlob = (dataURI) => {
  let byteString = atob(dataURI.split(',')[1]);
  let mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  let arrayBuffer = new ArrayBuffer(byteString.length);
  let _ia = new Uint8Array(arrayBuffer);
  for (let i = 0; i < byteString.length; i++) {
    _ia[i] = byteString.charCodeAt(i);
  }
  let dataView = new DataView(arrayBuffer);
  let blob = new Blob([dataView], { type: mimeString });
  return blob;
};

export const detectBoards = async (img, model) => {
  let inputTensor = tf.browser.fromPixels(img);

  inputTensor = tf.image.resizeBilinear(inputTensor, [300, 300]);
  inputTensor = tf.cast(inputTensor, 'int32');
  inputTensor = tf.expandDims(inputTensor);

  const result = model.predict(inputTensor);

  let boxes = Array.from(await result['TFLite_Detection_PostProcess'].data());
  let scores = Array.from(
    await result['TFLite_Detection_PostProcess:2'].data()
  );

  let boxes2D = [];

  for (let i = 0; i < boxes.length / 4; i++) {
    boxes2D.push([
      boxes[i * 4],
      boxes[i * 4 + 1],
      boxes[i * 4 + 2],
      boxes[i * 4 + 3],
    ]);
  }

  const clean = await tf.image.nonMaxSuppressionAsync(
    boxes2D,
    scores,
    20,
    0.3,
    0.98
  );

  const cleanIndx = clean.dataSync();

  let validDetections = [];

  cleanIndx.forEach((cIndex) => {
    validDetections.push({
      top: boxes2D[cIndex][0],
      left: boxes2D[cIndex][1],
      bottom: boxes2D[cIndex][2],
      right: boxes2D[cIndex][3],
    });
  });
  return validDetections;
};

export default {
  clearSavedAnalyzeInfoFromSessionStorage,
  recoverLastSession,
  showEngineInfo,
  checkForUnlimitedPopUp,
  switchToBoard,
  correctionFen,
  matchFenWithPopularPosition,
  disableDecodeChessButton,
  showDecodeChessSpecialOfferSection,
  getServerSideProps,
  dataURIToBlob,
  detectBoards,
};
