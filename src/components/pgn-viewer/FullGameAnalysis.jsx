import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import {
  setComputedData,
  setFullAnalysisDepth,
  setFullAnalysisOn,
  setFullGameFenArr,
  setInitiateFullAnalysis,
} from '../../actions/cloud';
import Chess from 'chess.js';
import {
  addPgnToArr,
  applyFullAnalysisOnPGN,
  deleteVarsAndComments,
  setAnalyzingFenTabIndx,
} from '../../actions/board';
import { orderServer, stopServer } from '../../utils/api';
import StopAnalysisModal from './StopAnalysisModal';
import { getEnginesListFromAvailableServers } from '../../utils/engine-list-utils';
import { GoGraph } from 'react-icons/go';
import $ from 'jquery';

const chess = new Chess();

const mapStateToProps = (state) => {
  return {
    pgnStr: state.board.pgnStr,
    fen: state.board.fen,
    proAnalyzers: state.cloud.proAnalyzers,
    numPV: state.cloud.numPV,
    userFullInfo: state.cloud.userFullInfo,
    fullAnalysisOn: state.cloud.fullAnalysisOn,
    fenArr: state.cloud.fenArr,
    allPgnArr: state.board.allPgnArr,
    fullAnalysisDepth: state.cloud.fullAnalysisDepth,
    computedMoveScores: state.cloud.computedMoveScores,
    pgn: state.board.pgn,
  };
};

const FullGameAnalysis = (props) => {
  const {
    pgnStr,
    proAnalyzers,
    userFullInfo,
    fullAnalysisOn,
    setFullGameFenArr,
    fenArr,
    addPgnToArr,
    deleteVarsAndComments,
    allPgnArr,
    setAnalyzingFenTabIndx,
    setFullAnalysisDepth,
    fullAnalysisDepth,
    computedMoveScores,
    applyFullAnalysisOnPGN,
    pgn,
    setComputedData,
    availableServers,
    enginesOptionsList,
    setInitiateFullAnalysis,
  } = props;

  const [openStopAnalysisModal, setOpenAnalysisModal] = useState(false);
  const [selectDepth, setSelectDepth] = useState(fullAnalysisDepth);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [displayAnalyzeBtn, setDisplayAnalyzeBtn] = useState(true);
  const [skipLastMove, setSkipLastMove] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [loader, setLoader] = useState(true);
  const [pingAliveIntervalId, setPingAliveIntervalId] = useState(null);

  const allEngines = [
    getEnginesListFromAvailableServers(availableServers, userFullInfo),
  ];

  const stockfishEngines =
    allEngines && allEngines.length && allEngines[0]['stockfish10']
      ? allEngines[0]['stockfish10']
      : [];

  const unlimitedStockfish =
    stockfishEngines.length &&
    stockfishEngines.filter((stockfish) => {
      return stockfish.for_guests === true;
    });

  const getFenData = (pgn) => {
    chess.load_pgn(pgn);

    const history = chess.history();
    chess.reset();
    let fenArr = [];
    for (let i = 0; i < history.length; i++) {
      chess.move(history[i]);
      if (!chess.in_checkmate()) {
        fenArr.push(chess.fen());
        if (fenArr.length === history.length) {
          setSkipLastMove(false);
        }
      } else {
        setSkipLastMove(true);
      }
    }
    setFullGameFenArr(fenArr);
  };

  const getDataForSingleFen = (pa) => {
    pa.analyzer.send('stop');

    if (fenArr.length !== 0) {
      const fen = fenArr[0];
      pa.analyzer.send(`position fen ${fen}`);
      pa.analyzer.send(`go depth ${fullAnalysisDepth}`);
    }
  };

  const handleStopServer = (serverName) => {
    stopServer(serverName)
      .then((response) => {
        clearInterval(pingAliveIntervalId);
        if (response.error) {
          console.log('ERROR STOPPING');
          return;
        } else {
          console.log('Success stoped');
        }
      })
      .catch((e) => {
        console.error('IN CATCH', e);
      });
    setInitiateFullAnalysis(false);
  };

  const fullAnalysisHandler = () => {
    if (!fullAnalysisOn && proAnalyzers && proAnalyzers.length) {
      setOpenAnalysisModal(true);
      setModalMessage(
        'Please stop all active engines to run full-game analysis.'
      );
      return;
    }
    if (pgnStr.length <= 2) {
      setOpenAnalysisModal(true);
      setModalMessage("You haven't entered a game yet.");
      return;
    }
    setLoader(true);

    if (computedMoveScores.length) {
      setComputedData([]);
    }

    setAnalysisProgress(0);

    let nextTab = allPgnArr.length;

    addPgnToArr(pgnStr);
    deleteVarsAndComments();

    getFenData(pgnStr);
    const options = enginesOptionsList['stockfish10'];
    setAnalyzingFenTabIndx(nextTab);
    setInitiateFullAnalysis(true);
    setDisplayAnalyzeBtn(false);

    orderServer(unlimitedStockfish[0].cores, 'stockfish10', options)
      .then((response) => {
        if (response.error) {
          console.log('ERROR ORDERING');
          setAnalyzingFenTabIndx(null);
          setFullAnalysisOn(false);
          setInitiateFullAnalysis(false);
          setDisplayAnalyzeBtn(true);
          return;
        }
        _pingAliveServers()
      })
      .catch((e) => {
        console.log('IN CATCH', e);
      });
  };

  const fullAnalysisStopHandler = () => {
    setFullGameFenArr([]);
    setAnalyzingFenTabIndx(null);
    setComputedData([]);
    setFullAnalysisOn(false);
    setAnalysisProgress(0);
    setDisplayAnalyzeBtn(true);

    handleStopServer('stockfish10');
    clearInterval(pingAliveIntervalId);
    setPingAliveIntervalId(null);
  };

  const { servers } = userFullInfo;

  function _pingAliveServers() {
    const interval = setInterval(() => {
          $.ajax({
            url: `/api/ping_alive?engine=stockfish10`,
            method: 'GET',
            success() {
              console.log('Pinged');
            },
          });
    }, 5000);

    setPingAliveIntervalId(interval);
  }

  useEffect(() => {
    setDisplayAnalyzeBtn(!fullAnalysisOn);

    if (!fullAnalysisOn) {
      setAnalysisProgress(0);
    }
    if (!proAnalyzers) return;

    proAnalyzers.map((pa) => {
      getDataForSingleFen(pa);
    });
  }, [fullAnalysisOn]);

  useEffect(() => {
    if (fullAnalysisOn) {
      const progress = Math.round(
        (computedMoveScores.length / pgn.moves.length) * 100
      );
      setLoader(false);
      setAnalysisProgress(progress);
      applyFullAnalysisOnPGN();
      if (
        computedMoveScores.length ===
          pgn.moves.length - (skipLastMove ? 1 : 0) &&
        !fenArr.length
      ) {
        handleStopServer('stockfish10');
        setAnalysisProgress(0);
        setDisplayAnalyzeBtn(true);
        setAnalyzingFenTabIndx(null);
        setComputedData([]);
        setSkipLastMove(false);
      }
    }
  }, [computedMoveScores.length]);

  const setFullAnalysisDepthHandler = (depth) => {
    if (!fullAnalysisOn) {
      setFullAnalysisDepth(+depth);
      setSelectDepth(depth);
    }
  };

  return (
    <>
      <div className="full-analysis-mobile">
        Analyze your full game with one click.
      </div>
      <div className="full-analysis-section mt--10 ml-3">
        <p>Analyze your full game with one click.</p>
        <div className="d-flex flex-row">
          <label>Depth</label>
          <select
            id="depth"
            value={selectDepth}
            className="uploads-filter-opt"
            onChange={(e) => {
              setFullAnalysisDepthHandler(e.target.value);
            }}
          >
            <option value="20" selected={fullAnalysisDepth === 20}>
              20
            </option>
            <option value="30" selected={fullAnalysisDepth === 30}>
              30
            </option>
            <option value="40" selected={fullAnalysisDepth === 40}>
              40
            </option>
          </select>
        </div>
        <div className="full-analysis-progress">
          <div className="progress position-relative">
            <div
              className="progress-bar"
              role="progressbar"
              style={{ width: `${analysisProgress}%` }}
              aria-valuenow={analysisProgress}
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
            <small className="justify-content-center d-flex position-absolute w-100">
              {analysisProgress}%
            </small>
          </div>
        </div>
        {!displayAnalyzeBtn ? (
          <button
            className="stop-full-analysis"
            disabled={loader}
            onClick={fullAnalysisStopHandler}
          >
            {loader ? <div className="circle-loader"></div> : 'Stop'}
          </button>
        ) : (
          <button className="apply-btn" onClick={fullAnalysisHandler}>
            <GoGraph />
            Start
          </button>
        )}
        <StopAnalysisModal
          isOpen={openStopAnalysisModal}
          setIsOpen={setOpenAnalysisModal}
          message={modalMessage}
        />
      </div>
    </>
  );
};

export default connect(mapStateToProps, {
  setFullGameFenArr,
  addPgnToArr,
  deleteVarsAndComments,
  setAnalyzingFenTabIndx,
  setFullAnalysisDepth,
  applyFullAnalysisOnPGN,
  setComputedData,
  setInitiateFullAnalysis,
})(FullGameAnalysis);
