import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { addMoveNumbersToSans } from '../../utils/chess-utils';
import {
  doMove,
  setActiveMove,
  setAnalyzingFenTabIndx,
} from '../../actions/board';
import {
  updateNumPV,
  setPauseAnalysisUpdate,
  switchAnalysisColor,
} from '../../actions/cloud';
import { ENGINES } from '../../constants/cloud-params';
import { coreToKNode, ENGINES_NAMES } from '../../utils/engine-list-utils';
import { showEngineInfo } from '../../utils/utils';
import { stopServer } from '../../utils/api';
import * as Sentry from '@sentry/react';

import { IoIosAdd, IoIosRemove, IoIosLock, IoIosUnlock } from 'react-icons/io';

const mapStateToProps = (state) => {
  return {
    fen: state.board.fen,
    numPV: state.cloud.numPV,
    freeAnalyzer: state.cloud.freeAnalyzer,
    proAnalyzers: state.cloud.proAnalyzers,
    userFullInfo: state.cloud.userFullInfo,
    orderedCores: state.cloud.orderedCores,
    activePgnTab: state.board.activePgnTab,
    analyzingFenTabIndx: state.board.analyzingFenTabIndx,
    switchedTabAnalyzeFen: state.board.switchedTabAnalyzeFen,
    activeMove: state.board.activeMove,
    fullAnalysisOn: state.cloud.fullAnalysisOn,
    isColorSwitched: state.cloud.isColorSwitched,
  };
};

const getEngineName = (analyzer) => {
  if (
    analyzer.analysis &&
    analyzer.analysis.depth === '1' &&
    analyzer.analysis.variations &&
    analyzer.analysis.variations[0] &&
    analyzer.analysis.variations[0].nps === '0'
  ) {
    return 'Syzygy';
  }

  let engineName = `${ENGINES[analyzer.analysis.engine]} ${
    analyzer.temp ? '(Free)' : ''
  } `;

  // LCZero run Stockfish temporary
  if (analyzer.analysis.engine === 'lc0' && analyzer.temp) {
    engineName = `${ENGINES.Stockfish} (Free)`;
  }

  return engineName;
};

const AnalysisBlock = ({
  engine,
  analysis,
  fenToAnalyze,
  doMove,
  numPV,
  updateNumPV,
  engineName,
  setPauseAnalysisUpdate,
  activeMove,
  setActiveMove,
  isColorSwitched,
}) => {
  const [lockAnalysis, setLockAnalysis] = useState(false);

  const handleMoveClick = (moves, index) => {
    if (isColorSwitched) return;
    for (let i = 0; i <= index; i++) {
      const move = moves[i][0];
      doMove(move);
    }
  };

  const handleAnalyzeLineClick = (event, pgn) => {
    event.preventDefault();
    if (isColorSwitched) return;
    setPauseAnalysisUpdate(true);
    const lastActiveMove = activeMove;
    for (let i = 0; i < pgn.length; i++) {
      const move = pgn[i][0];
      doMove(move);
    }
    setActiveMove(lastActiveMove);
    setPauseAnalysisUpdate(false);
  };

  const handleLockAnalysis = () => {
    setLockAnalysis(!lockAnalysis);
  };

  return (
    <div className="analysis-block">
      <div className="displayed-analyze-info">
        <div className="title rbt-section-title">
          <span>{`${engine}`}</span>
          <span>{`depth: ${analysis.depth}`}</span>
          <span>{`speed: ${
            analysis.variations &&
            analysis.variations[0] &&
            Math.floor(parseInt(analysis.variations[0].nps) / 1000)
          } kN/s`}</span>
          <span>{`nodes: ${
            analysis.variations &&
            analysis.variations[0] &&
            analysis.variations[0].nodes &&
            (analysis.variations[0].nodes / 1000000).toFixed(2)
          } MN`}</span>
          <span>{`tbhits: ${
            analysis.variations &&
            analysis.variations[0] &&
            analysis.variations[0].tbhits
          }`}</span>
        </div>
        <div className="pv-btn-wrapper ">
          <button
            className="pv-btn"
            disabled={lockAnalysis}
            onClick={() => {
              updateNumPV({ [engineName]: 1 });
            }}
          >
            <IoIosAdd />
          </button>
          <span className="pv-value">{numPV[engineName]}</span>
          <button
            className="pv-btn"
            disabled={lockAnalysis}
            onClick={() => {
              updateNumPV({ [engineName]: -1 });
            }}
          >
            <IoIosRemove />
          </button>
        </div>
      </div>
      <ul className="list-style--1" style={{ whiteSpace: 'nowrap' }}>
        {analysis.variations.map((variation, indx) => {
          try {
            if (
              indx === 0 ||
              (analysis.variations &&
                analysis.variations[0] &&
                analysis.variations[0].nps !== '0') ||
              analysis.depth !== '1'
            ) {
              return (
                <li
                  onContextMenu={(e) =>
                    handleAnalyzeLineClick(e, variation.pgn)
                  }
                >
                  <span className="result">{`(${variation.score}) `}</span>
                  {variation.pgn &&
                    addMoveNumbersToSans(
                      fenToAnalyze,
                      variation.pgn
                    ).map((moveObj, i) => (
                      <button
                        disabled={lockAnalysis}
                        className="analyze-move"
                        onClick={() => handleMoveClick(variation.pgn, i)}
                      >{`${moveObj.move_number} ${moveObj.move} `}</button>
                    ))}
                </li>
              );
            } else {
              return <></>;
            }
          } catch (error) {
            console.log('VARIATION SCORE ERROR', analysis.variations);
            Sentry.captureException(error, {
              extra: {
                variations: analysis.variations,
              },
            });
            return <></>;
          }
        })}
      </ul>
    </div>
  );
};

const AnalysisArea = ({
  fen,
  handleAnalyze,
  doMove,
  freeAnalyzer,
  proAnalyzers,
  updateNumPV,
  numPV,
  userFullInfo,
  orderedCores,
  setAnalyzingFenTabIndx,
  activePgnTab,
  analyzingFenTabIndx,
  switchedTabAnalyzeFen,
  setPauseAnalysisUpdate,
  activeMove,
  setActiveMove,
  fullAnalysisOn,
  enginesOptionsList,
  switchAnalysisColor,
  isColorSwitched,
}) => {
  const [xKeyPressed, setXKeyPressed] = useState(false);
  const [spaceKeyPressed, setSpaceKeyPressed] = useState(false);

  useEffect(() => {
    const downHandler = ({ which }) => {
      if (which === 88) {
        setXKeyPressed(true);
      } else if (which === 32) {
        setSpaceKeyPressed(true);
      }
    };

    window.addEventListener('keydown', downHandler);
    return () => {
      window.removeEventListener('keydown', downHandler);
    };
  }, []);

  let initFenToAnalyze =
    activePgnTab === analyzingFenTabIndx || analyzingFenTabIndx === null
      ? fen
      : switchedTabAnalyzeFen;
  let fenToAnalyze = initFenToAnalyze;
  if (isColorSwitched) {
    fenToAnalyze = initFenToAnalyze.includes(' w ')
      ? initFenToAnalyze.replace(' w ', ' b ')
      : initFenToAnalyze.replace(' b ', ' w ');
  }

  useEffect(() => {
    switchAnalysisColor(false);
  }, [fen]);

  useEffect(() => {
    if (fullAnalysisOn) return;
    let identifier = setTimeout(() => {
      setTimeout(() => handleAnalyze(), 0);
    }, 0);

    return () => {
      clearTimeout(identifier);
    };
  }, [fen, analyzingFenTabIndx, isColorSwitched]);

  const handleStopServer = (serverName, analyzers) => {
    return stopServer(serverName)
      .then((response) => {
        if (analyzers.length === 1) {
          setTimeout(() => setAnalyzingFenTabIndx(null), 4000);
        }
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
  };

  const checkCores = (info) => {
    return (
      <h6 className="preparing-server-info-title ">{showEngineInfo(info)}</h6>
    );
  };

  const analyzers =
    proAnalyzers && !fullAnalysisOn
      ? proAnalyzers
      : freeAnalyzer && !fullAnalysisOn
      ? [freeAnalyzer]
      : [];

  const getEngineNameWithOpt = (name) => {
    try {
      console.log('enginesOptionsList, name', enginesOptionsList, name);
      const engine = enginesOptionsList[name].engine;

      if (!engine || (engine && !engine.options)) return ENGINES_NAMES[name];
      return engine.options[0];
    } catch (error) {
      Sentry.captureException(error, {
        extra: {
          enginesOptionsList: enginesOptionsList,
          name: name,
        },
      });
      return ENGINES_NAMES[name];
    }
  };

  useEffect(() => {
    const identifier = setTimeout(() => {
      if (
        spaceKeyPressed &&
        !fullAnalysisOn &&
        analyzers &&
        analyzers.length &&
        analyzers[0] &&
        analyzers[0].isAnalysing &&
        analyzers[0].analysis.variations &&
        analyzers[0].analysis.variations[0] &&
        (analyzingFenTabIndx === activePgnTab || analyzingFenTabIndx === null)
      ) {
        const pgnFirst = analyzers[0].analysis.variations[0].pgn;
        const move = pgnFirst[0][0];
        doMove(move);
        setSpaceKeyPressed(false);
      }
    }, 100);
    return () => {
      clearTimeout(identifier);
    };
  }, [spaceKeyPressed]);

  useEffect(() => {
    const identifier = setTimeout(() => {
      if (
        xKeyPressed &&
        !fullAnalysisOn &&
        analyzers &&
        analyzers.length &&
        analyzers[0] &&
        analyzers[0].isAnalysing &&
        (analyzingFenTabIndx === activePgnTab || analyzingFenTabIndx === null)
      ) {
        switchAnalysisColor(!isColorSwitched);
        setXKeyPressed(false);
      }
    }, 100);
    return () => {
      clearTimeout(identifier);
    };
  }, [xKeyPressed]);

  return (
    <React.Fragment>
      {analyzers.map((analyzer) => {
        if (
          !analyzer ||
          !userFullInfo.servers ||
          !(userFullInfo.servers && analyzer.name in userFullInfo.servers)
        )
          return null;
        return (
          <div className="main-container-wrapper" key={analyzer.analyzer.url}>
            <div className="analyze-area">
              <div className="active-analyze-info">
                {orderedCores[analyzer.name] !==
                userFullInfo.servers[analyzer.name][0].cores ? (
                  <div className="analyze-info">
                    {checkCores(userFullInfo.servers[analyzer.name][2])}
                  </div>
                ) : (
                  <div className="analyze-info-items">
                    <div className="analyze-info-item">
                      <span className="engine-name-wrapper">
                        {getEngineNameWithOpt(analyzer.name)}
                      </span>
                    </div>
                    <div className="analyze-info-core-item-wraper">
                      <span>Server:&nbsp;</span>
                      {coreToKNode(
                        null,
                        userFullInfo.servers[analyzer.name][0],
                        analyzer.name
                      )}
                    </div>
                    <div className="analyze-info-item-wrapper">
                      {userFullInfo.servers[analyzer.name][0].price_per_minute}
                      <span>&nbsp;coins/min</span>
                    </div>
                  </div>
                )}

                <div className="stop-analyze-button-wrapper">
                  <button
                    className="stop-analyze-button"
                    onClick={() => {
                      handleStopServer(analyzer.name, analyzers);
                    }}
                  >
                    Stop
                  </button>
                </div>
              </div>
              {analyzer.analysis && (
                <AnalysisBlock
                  key={analyzer.analyzer.url}
                  engine={getEngineName(analyzer)}
                  analysis={analyzer.analysis}
                  fenToAnalyze={fenToAnalyze}
                  doMove={doMove}
                  updateNumPV={updateNumPV}
                  numPV={numPV}
                  engineName={analyzer.name}
                  setPauseAnalysisUpdate={setPauseAnalysisUpdate}
                  activeMove={activeMove}
                  setActiveMove={setActiveMove}
                  isColorSwitched={isColorSwitched}
                />
              )}
            </div>
          </div>
        );
      })}
    </React.Fragment>
  );
};

export default connect(mapStateToProps, {
  doMove,
  updateNumPV,
  setAnalyzingFenTabIndx,
  setPauseAnalysisUpdate,
  setActiveMove,
  switchAnalysisColor,
})(AnalysisArea);
