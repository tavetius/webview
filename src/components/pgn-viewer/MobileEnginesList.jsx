import React, { useEffect, useState, useRef } from 'react';
import { connect } from 'react-redux';
import CustomDropDown from '../common/CustomDropDown';
import SavedAnalysisArea from './SavedAnalysisArea';
import { setOrderedCores, setSavedAnalyzeInfo } from '../../actions/cloud';
import {
  getEnginesListFromAvailableServers,
  showAnalyzeButton,
  ENGINES_NAMES,
} from '../../utils/engine-list-utils';
import {
  getAvailableServers,
  getEnginesOptions,
  orderServer,
  pingAlive,
} from '../../utils/api';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import Accordion from 'react-bootstrap/Accordion';
import $ from 'jquery';
import { setAnalyzingFenTabIndx } from '../../actions/board';
import StopAnalysisModal from './StopAnalysisModal';
import CoinsCardModal from './CoinsCardModal';

const mapStateToProps = (state) => {
  return {
    freeAnalyzer: state.cloud.freeAnalyzer,
    proAnalyzers: state.cloud.proAnalyzers,
    userFullInfo: state.cloud.userFullInfo,
    orderedCores: state.cloud.orderedCores,
    savedAnalyzeInfo: state.cloud.savedAnalyzeInfo,
    activePgnTab: state.board.activePgnTab,
    initiateFullAnalysis: state.cloud.initiateFullAnalysis,
  };
};

const loadingOrderedServer = () => {
  return (
    <div class="lds-ellipsis">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
};

const DisplayEngineOption = ({
  engineName,
  enginesOptionsList,
  handleOptionChange,
  engineNameStyleClassName,
  needOption,
}) => {
  const [cpuctValue, setCpuctValue] = useState();
  const [contemptValue, setContemptValue] = useState();
  const engineOptions = enginesOptionsList[engineName];
  const optionLabels = engineOptions ? Object.keys(engineOptions) : [];

  const hnadleCpuctChnage = (e, option, engineName, type) => {
    if (e.target.value < 0 || e.target.value > 100) {
      return;
    }
    handleEngineOptionChnage(e.target, option, engineName, type);
    setCpuctValue(e.target.value);
  };
  const hnadleContemptChnage = (e, option, engineName, type) => {
    if (e.target.value < 0 || e.target.value > 100) {
      return;
    }
    handleEngineOptionChnage(e.target, option, engineName, type);
    setContemptValue(e.target.value);
  };
  const decrementCpuctValue = (option, engineName, type) => {
    const inputNumber = document.getElementById('cpuct');
    inputNumber.stepDown(1);
    const val = document.getElementById('cpuct').value;
    setCpuctValue(val);
    handleEngineOptionChnage({ value: val }, option, engineName, type);
  };

  const incrementCpuctValue = (option, engineName, type) => {
    const inputNumber = document.getElementById('cpuct');
    inputNumber.stepUp(1);
    const val = document.getElementById('cpuct').value;
    setCpuctValue(val);
    handleEngineOptionChnage({ value: val }, option, engineName, type);
  };

  const decrementContemptnValue = (option, engineName, type) => {
    const inputNumber = document.getElementById('contempt');
    inputNumber.stepDown(1);
    const val = document.getElementById('contempt').value;
    setContemptValue(val);
    handleEngineOptionChnage({ value: val }, option, engineName, type);
  };

  const incrementContempValue = (option, engineName, type) => {
    const inputNumber = document.getElementById('contempt');
    inputNumber.stepUp(1);
    const val = document.getElementById('contempt').value;
    setContemptValue(val);
    handleEngineOptionChnage({ value: val }, option, engineName, type);
  };

  const handleEngineOptionChnage = (event, option, engine, type) => {
    const { value } = event;
    if (type === 'option') {
      enginesOptionsList[engine][option].options.sort(function (x, y) {
        return x === value ? -1 : y === value ? 1 : 0;
      });
    } else if (type === 'number') {
      const num = typeof value === 'number' ? parseFloat(value) : value;
      const { valid_range } = enginesOptionsList[engine][option];
      if (!num || (valid_range[0] <= num && num <= valid_range[1])) {
        enginesOptionsList[engine][option].options[0] = num;
      }
    } else if (type === 'boolean') {
      const checked = event.target.checked;
      enginesOptionsList[engine][option].options[0] = checked;
    }
    handleOptionChange(enginesOptionsList);
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        width: 'max-content',
        flexDirection: 'row-reverse',
      }}
    >
      {optionLabels.map((option, index) => {
        return needOption !== 'boolean' ? (
          <>
            {engineOptions[option].type === 'option' && (
              <>
                <CustomDropDown
                  option={option}
                  engineName={engineName}
                  type={engineOptions[option].type}
                  items={engineOptions[option].options}
                  handleEngineOptionChnage={handleEngineOptionChnage}
                  engineNameStyleClassName={engineNameStyleClassName}
                />
              </>
            )}

            {engineOptions[option].type === 'number' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                }}
                className="d-flex align-items-center"
              >
                <label
                  style={{ margin: 0 }}
                  htmlFor={
                    engineOptions[option].description.includes('Contempt')
                      ? 'contempt'
                      : 'cpuct'
                  }
                >
                  {option}:{' '}
                </label>
                <input
                  id={
                    engineOptions[option].description.includes('Contempt')
                      ? 'contempt'
                      : 'cpuct'
                  }
                  min={engineOptions[option].valid_range[0]}
                  max={engineOptions[option].valid_range[1]}
                  step="0.1"
                  type="number"
                  value={
                    engineOptions[option].description.includes('Contempt')
                      ? contemptValue || engineOptions[option].options[0]
                      : cpuctValue || engineOptions[option].options[0]
                  }
                  onChange={(e) => {
                    engineOptions[option].description.includes('Contempt')
                      ? hnadleContemptChnage(
                          e,
                          option,
                          engineName,
                          engineOptions[option].type
                        )
                      : hnadleCpuctChnage(
                          e,
                          option,
                          engineName,
                          engineOptions[option].type
                        );
                  }}
                  className="option-number-input"
                />
                <div className="d-flex mr-2">
                  <button
                    className="number-option-button"
                    onClick={() => {
                      engineOptions[option].description.includes('Contempt')
                        ? decrementContemptnValue(
                            option,
                            engineName,
                            engineOptions[option].type
                          )
                        : decrementCpuctValue(
                            option,
                            engineName,
                            engineOptions[option].type
                          );
                    }}
                  >
                    <IoIosArrowBack />
                  </button>
                  <button
                    className="number-option-button"
                    onClick={() => {
                      engineOptions[option].description.includes('Contempt')
                        ? incrementContempValue(
                            option,
                            engineName,
                            engineOptions[option].type
                          )
                        : incrementCpuctValue(
                            option,
                            engineName,
                            engineOptions[option].type
                          );
                    }}
                  >
                    <IoIosArrowForward />
                  </button>
                </div>
              </form>
            )}
          </>
        ) : (
          <div
            style={{
              display: 'flex',
              width: 'max-content',
              alignItems: 'center',
            }}
          >
            {engineOptions[option].type === 'boolean' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                }}
              >
                <label
                  style={{
                    margin: 0,
                    verticalAlign: 'unset',
                  }}
                  htmlFor="syzygy"
                >
                  {option}:{' '}
                </label>
                <input
                  onClick={(e) => {
                    handleEngineOptionChnage(
                      e,
                      option,
                      engineName,
                      engineOptions[option].type
                    );
                  }}
                  type="checkbox"
                  value={engineOptions[option].options[0]}
                  defaultChecked={engineOptions[option].options[0]}
                  className="syzygy-checkbox-input"
                />
              </form>
            )}
          </div>
        );
      })}
    </div>
  );
};

const MobileEnginesList = (props) => {
  const {
    userFullInfo,
    orderedCores,
    setOrderedCores,
    savedAnalyzeInfo,
    setSavedAnalyzeInfo,
    setAnalyzingFenTabIndx,
    activePgnTab,
    initiateFullAnalysis,
    enginesOptionsList,
    setEnginesOptionsList,
    availableServers,
    setAvailableServers,
  } = props;
  const enginesEndRef = useRef(null);
  const [pingAliveIntervalId, setPingAliveIntervalId] = useState(null);
  const [availableServersIntervalId, setAvailableServersIntervalId] = useState(
    null
  );
  const [isServerOrdering, setIsServerOrdering] = useState({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [coreIndex, setCoreIndex] = useState({
    asmfish: 0,
    stockfish10: 0,
    sugar: 0,
    lc0: 0,
    berserk: 0,
    koivisto: 0,
    rubichess: 0,
    shashchess: 0,
    komodo: 0,
  });
  const [openStopAnalysisModal, setOpenAnalysisModal] = useState(false);
  const [loader, setLoader] = useState(true);
  const [openCoinsModal, setOpenCoinsModal] = useState(false);

  useEffect(() => {
    if (isExpanded) scrollToBottom();
    _getEnginesOptions();
  }, [isExpanded]);

  useEffect(() => {
    const savedAnalyzeInfoFromSessionStorage = JSON.parse(
      sessionStorage.getItem('latest_analyze_info')
    );
    _getAvailableServers();
    _pingAliveServers();

    if (servers && Object.keys(servers).length > 0) {
      if (localStorage.getItem('ordered_cores')) {
        setOrderedCores(JSON.parse(localStorage.getItem('ordered_cores')));
      }
    } else {
      sessionStorage.removeItem('ordered_cores');
    }

    if (savedAnalyzeInfoFromSessionStorage) {
      setSavedAnalyzeInfo(savedAnalyzeInfoFromSessionStorage);
    }

    return () => {
      clearInterval(availableServersIntervalId);
      clearInterval(pingAliveIntervalId);
      setAvailableServersIntervalId(null);
      setPingAliveIntervalId(null);
    };
  }, [userFullInfo]);

  const { servers } = userFullInfo;

  const scrollToBottom = () => {
    enginesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  };

  const enginesStockfishLc0 = Object.keys(
    getEnginesListFromAvailableServers(availableServers, userFullInfo)
  ).filter(
    (serverName) => serverName === 'lc0' || serverName === 'stockfish10'
  );

  const restEngineList = Object.keys(
    getEnginesListFromAvailableServers(availableServers, userFullInfo)
  ).filter(
    (serverName) => serverName !== 'lc0' && serverName !== 'stockfish10'
  );
  const engineList = [
    getEnginesListFromAvailableServers(availableServers, userFullInfo),
  ];
  const updateEnginesList = (availableServersList) => {
    setAvailableServers(availableServersList);
  };

  const _getAvailableServers = () => {
    const interval = setInterval(() => {
      getAvailableServers()
        .then((serversList) => {
          updateEnginesList(serversList);
        })
        .catch((e) => {
          console.error(e);
        });
    }, 3000);

    setAvailableServersIntervalId(interval);
  };

  const _getEnginesOptions = () => {
    getEnginesOptions()
      .then((enginesOptionsList) => {
        setEnginesOptionsList(enginesOptionsList);
      })
      .catch((e) => {
        console.error(e);
      });
  };
  const handelCoreChange = (indexValue, name) => {
    if (loader) {
      const newObj = { ...coreIndex };
      newObj[name] = indexValue;
      setCoreIndex(newObj);
    }
  };

  const handleOrderServer = (item, serverName) => {
    setLoader(false);
    if (item == undefined) {
      delete isServerOrdering[serverName];
      setIsServerOrdering(isServerOrdering);
      console.log('ERROR ORDERING');
      return;
    }
    const { cores } = item;
    setAnalyzingFenTabIndx(activePgnTab);
    const orderedEngineCores = { ...orderedCores };
    const options = enginesOptionsList[serverName];
    if (servers && Object.keys(servers).length >= 1) {
      const newObj = { ...coreIndex };
      for (let [key, value] of Object.entries(newObj)) {
        if (key != 'stockfish10' && key !== 'lcO' && value == 1) {
          newObj[key] = 0;
        }
        if (
          key == 'stockfish10' &&
          (value == 4 ||
            engineList[0][serverName].findIndex(
              (items) => items.cores == 16
            ) !== -1)
        ) {
          newObj[key] = 0;
        }
      }

      setCoreIndex(newObj);
    }
    isServerOrdering[serverName] = true;
    setIsServerOrdering(isServerOrdering);

    orderServer(cores, serverName, options)
      .then((response) => {
        if (response.error) {
          delete isServerOrdering[serverName];
          setIsServerOrdering(isServerOrdering);
          console.log('ERROR ORDERING');
          return;
        }
        setLoader(true);
        _getEnginesOptions();
        delete isServerOrdering[serverName];
        orderedEngineCores[serverName] = cores;
        setIsServerOrdering(isServerOrdering);
        setOrderedCores(orderedCores);
        localStorage.setItem(
          'ordered_cores',
          JSON.stringify(orderedEngineCores)
        );
        setLoader(true);
      })
      .catch((e) => {
        delete isServerOrdering[serverName];
        setIsServerOrdering(isServerOrdering);
        setLoader(true);
        console.log('IN CATCH', e);
      });
  };

  const _pingAliveServers = () => {
    const interval = setInterval(() => {
      // pingAlive(userFullInfo)
      //   .then((response) => {
      //     if (response.error) {
      //       console.log('ERROR STOPPING');
      //       return;
      //     } else {
      //       console.log('Pinged');
      //     }
      //   })
      //   .catch((e) => {
      //     console.error('IN CATCH', e);
      //   });
      if (servers && Object.keys(servers).length > 0) {
        const engines = Object.keys(servers);

        for (let i = 0; i < engines.length; i++) {
          $.ajax({
            url: `/api/ping_alive?engine=${engines[i]}`,
            method: 'GET',
            success() {
              console.log('Pinged');
            },
          });
        }
      }
    }, 5000);

    setPingAliveIntervalId(interval);
  };

  const handleOptionChange = (optionsList) => {
    setEnginesOptionsList(optionsList);
  };

  return (
    <>
      {enginesStockfishLc0.map((name, index) => {
        return (
          <div
            className="main-container-wrapper"
            key={index}
            style={{
              display: servers[name] && !initiateFullAnalysis ? 'none' : '',
            }}
          >
            {engineList.map((engine, index) => {
              return (
                <div key={index}>
                  <div className="mb-engines-list-info mb-2">
                    <div className="analyze-info-item">
                      {name === 'stockfish10' ? (
                        <DisplayEngineOption
                          engineName={name}
                          engineNameStyleClassName={'engine-name-wrapper'}
                          enginesOptionsList={enginesOptionsList}
                          handleOptionChange={handleOptionChange}
                        />
                      ) : (
                        <h6 className="engine-name-wrapper">
                          {ENGINES_NAMES[name]}
                        </h6>
                      )}
                    </div>
                    {name !== 'stockfish10' && (
                      <div className="mb-analyze-info-item-wrapper lso">
                        <DisplayEngineOption
                          engineName={name}
                          enginesOptionsList={enginesOptionsList}
                          handleOptionChange={handleOptionChange}
                        />
                      </div>
                    )}
                    {name !== 'lc0' && (
                      <div className="analyze-info-core-item-wraper">
                        <span style={{ margin: 'auto 0px' }}>
                          Server:&nbsp;
                        </span>
                        <CustomDropDown
                          coreIndex={coreIndex}
                          type={'cores'}
                          items={engine[name]}
                          engineName={name}
                          userFullInfo={userFullInfo}
                          handelCoreChange={handelCoreChange}
                          openCoinsModal={openCoinsModal}
                          setOpenCoinsModal={setOpenCoinsModal}
                        />
                      </div>
                    )}
                  </div>
                  <div className="mb-engines-list-info-bottom mb-2">
                    <div>
                      <DisplayEngineOption
                        engineName={name}
                        enginesOptionsList={enginesOptionsList}
                        handleOptionChange={handleOptionChange}
                        needOption="boolean"
                      />
                    </div>
                    <div className="analyze-button-wrapper">
                      {isServerOrdering[name] && loadingOrderedServer()}
                      {servers &&
                        (!servers[name] || initiateFullAnalysis) &&
                        !isServerOrdering[name] &&
                        showAnalyzeButton(
                          userFullInfo,
                          engineList[0][name][coreIndex[name]],
                          (
                            engineList[0][name][coreIndex[name]] ||
                            engineList[0][name][0]
                          ).price_per_minute
                        ) &&
                        (!initiateFullAnalysis ? (
                          <button
                            className={
                              loader
                                ? 'analyze-button'
                                : 'analyze-button-loader'
                            }
                            disabled={!loader}
                            onClick={() => {
                              handleOrderServer(
                                engineList[0][name][coreIndex[name]],
                                name
                              );
                            }}
                          >
                            Analyze
                          </button>
                        ) : (
                          <button
                            id={`${
                              ENGINES_NAMES[name].includes('Stockfish')
                                ? 'analyzeStockfishBtn'
                                : ''
                            }`}
                            className={
                              loader
                                ? 'analyze-button'
                                : 'analyze-button-loader'
                            }
                            disabled={!loader}
                            onClick={() => {
                              setOpenAnalysisModal(true);
                            }}
                          >
                            Analyze
                          </button>
                        ))}
                      {servers &&
                        !servers[name] &&
                        !isServerOrdering[name] &&
                        !showAnalyzeButton(
                          userFullInfo,
                          engineList[0][name][coreIndex[name]],
                          (
                            engineList[0][name][coreIndex[name]] ||
                            engineList[0][name][0]
                          ).price_per_minute
                        ) && (
                          <button
                            className="analyze-button-disabled"
                            onClick={() => {
                              setOpenCoinsModal(true);
                            }}
                          >
                            Analyze
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              );
            })}
            {savedAnalyzeInfo &&
              savedAnalyzeInfo.map((info, index) => {
                if (info.name === name && info.analysis) {
                  console.log('INFO NAME ' + info.name + ' name ' + name);
                  return <SavedAnalysisArea key={index} serverName={name} />;
                }
                return null;
              })}
          </div>
        );
      })}
      <Accordion>
        <Accordion.Item eventKey="0" className="accordion-item">
          <Accordion.Button
            className="accordion-button accord-btn-mb mt-2"
            onClick={() => {
              setIsExpanded(!isExpanded);
            }}
          >
            More Engines
            {!isExpanded &&
              restEngineList.map((serverName, index) => (
                <span key={index}>
                  &nbsp;&nbsp;{ENGINES_NAMES[serverName]}&nbsp;&nbsp;
                </span>
              ))}
          </Accordion.Button>
          {restEngineList.map((name, index) => (
            <Accordion.Body
              className="accordion-body"
              key={index}
              style={{
                display: servers[name] && !initiateFullAnalysis ? 'none' : '',
              }}
            >
              <div className="main-container-wrapper">
                <div>
                  {engineList.map((engine, index) => {
                    return (
                      <div key={index}>
                        <div className="mb-engines-list-info mb-2">
                          {enginesOptionsList[name] &&
                          enginesOptionsList[name].engine ? (
                            <DisplayEngineOption
                              engineName={name}
                              engineNameStyleClassName={'engine-name-wrapper'}
                              enginesOptionsList={enginesOptionsList}
                              handleOptionChange={handleOptionChange}
                            />
                          ) : (
                            <div className="analyze-info-item">
                              <h6 className="engine-name-wrapper">{name}</h6>
                            </div>
                          )}
                          <div className="analyze-info-core-item-wraper">
                            <span style={{ margin: 'auto 0px' }}>
                              Server:&nbsp;
                            </span>
                            <CustomDropDown
                              coreIndex={coreIndex}
                              type={'cores'}
                              items={engine[name]}
                              engineName={name}
                              userFullInfo={userFullInfo}
                              handelCoreChange={handelCoreChange}
                            />
                          </div>
                        </div>
                        <div className="mb-engines-list-info-bottom mb-2">
                          <div>
                            <DisplayEngineOption
                              engineName={name}
                              enginesOptionsList={enginesOptionsList}
                              handleOptionChange={handleOptionChange}
                              needOption="boolean"
                            />
                          </div>
                          <div className="analyze-button-wrapper">
                            {isServerOrdering[name] && loadingOrderedServer()}
                            {servers &&
                              (!servers[name] || initiateFullAnalysis) &&
                              !isServerOrdering[name] &&
                              showAnalyzeButton(
                                userFullInfo,
                                engineList[0][name][coreIndex[name]],
                                (
                                  engineList[0][name][coreIndex[name]] ||
                                  engineList[0][name][0]
                                ).price_per_minute
                              ) &&
                              (!initiateFullAnalysis ? (
                                <button
                                  id={`${
                                    ENGINES_NAMES[name].includes('Stockfish')
                                      ? 'analyzeStockfishBtn'
                                      : ''
                                  }`}
                                  className={
                                    loader
                                      ? 'analyze-button'
                                      : 'analyze-button-loader'
                                  }
                                  disabled={!loader}
                                  onClick={() => {
                                    handleOrderServer(
                                      engineList[0][name][coreIndex[name]],
                                      name
                                    );
                                  }}
                                >
                                  Analyze
                                </button>
                              ) : (
                                <button
                                  className="analyze-button"
                                  onClick={() => {
                                    setOpenAnalysisModal(true);
                                  }}
                                >
                                  Analyze
                                </button>
                              ))}
                            {servers &&
                              !servers[name] &&
                              !isServerOrdering[name] &&
                              !showAnalyzeButton(
                                userFullInfo,
                                engineList[0][name][coreIndex[name]],
                                (
                                  engineList[0][name][coreIndex[name]] ||
                                  engineList[0][name][0]
                                ).price_per_minute
                              ) && (
                                <button className="analyze-button-disabled">
                                  Analyze
                                </button>
                              )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {savedAnalyzeInfo &&
                  savedAnalyzeInfo.map((info, index) => {
                    if (info.name === name && info.analysis) {
                      return (
                        <SavedAnalysisArea key={index} serverName={name} />
                      );
                    }
                    return null;
                  })}
              </div>
            </Accordion.Body>
          ))}
        </Accordion.Item>
        <div ref={enginesEndRef} />
      </Accordion>
      <CoinsCardModal
        showModal={openCoinsModal}
        setShowModal={setOpenCoinsModal}
      />
      <StopAnalysisModal
        isOpen={openStopAnalysisModal}
        setIsOpen={setOpenAnalysisModal}
        message={
          'Please stop full-game analysis to analyse the current position.'
        }
      />
    </>
  );
};

export default connect(mapStateToProps, {
  setOrderedCores,
  setSavedAnalyzeInfo,
  setAnalyzingFenTabIndx,
})(React.memo(MobileEnginesList));
