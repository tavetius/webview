import React, { useState, useEffect } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import Variations from './Variations';
import VariationActions from './VariationActions';
import Toolbar from './Toolbar';
import DesktopEnginesList from './DesktopEnginesList';
import MoveReference from './MoveReference';
import BoardReference from './BoardReference';
import VariationOptionsModal from './VariationOptionsModal';
import { IoMdFolder } from 'react-icons/io';
import { FaVideo, FaRegFilePdf } from 'react-icons/fa';
import { RiFile3Fill } from 'react-icons/ri';
import { GoGraph } from 'react-icons/go';
import { GiChessKing } from 'react-icons/gi';
import { SlGraph } from 'react-icons/sl';
import { connect } from 'react-redux';
import Uploads from './Uploads';
import MoveContextmenu from './MoveContextmenu';
import AnalysisArea from './AnalysisArea';
import VideosArea from './VideosArea';
import UploadsLimitModal from './UploadsLimitModal';
import {
  uploadFiles,
  setCurrentDirectory,
  setLoader,
  setGameReference,
  setMoveLoader,
  setReference,
  setUserUploads,
  setTourNextStep,
  setAnalyzingFenTabIndx,
  promoteVariation,
} from '../../actions/board';
import ActiveVarOptionsModal from './ActiveVarOptionsModal';
import CreateNewFolderModal from './CreateNewFolderModal';
import Onboarding from './Onboarding';
import OnboardingTutorial from './OnboardingTutorial';
import MultiTabNotations from './MultiTabNotations';
import PdfScanner from './PdfScanner';
import DecodeChess from '../common/DecodeChess';
import FullGameAnalysis from './FullGameAnalysis';
import useKeyPress from './KeyPress';

const mapStateToProps = (state) => {
  return {
    variationOpt: state.board.variationOpt,
    activeFileInfo: state.board.activeFileInfo,
    pgnStr: state.board.pgnStr,
    pgn: state.board.pgn,
    searchParams: state.board.searchParams,
    userFullInfo: state.cloud.userFullInfo,
    fen: state.board.fen,
    uploadFilterByPos: state.board.uploadFilterByPos,
    loader: state.board.loader,
    tourType: state.board.tourType,
    tourStepNumber: state.board.tourStepNumber,
    allPgnArr: state.board.allPgnArr,
    activePgnTab: state.board.activePgnTab,
    analyzingFenTabIndx: state.board.analyzingFenTabIndx,
    activeMove: state.board.activeMove,
    featureTab: state.board.featureTab,
  };
};

const SYMBOL_MODE_LS_OPTION = 'dashboard:symbolMode';
const ACTIVE_NOTATION = require('../../../public/assets/images/pgn-viewer/notation-active.svg');
const INACTIVE_NOTATION = require('../../../public/assets/images/pgn-viewer/notation-inactive.svg');
const ACTIVE_REFERENCE = require('../../../public/assets/images/pgn-viewer/reference-active.svg');
const INACTIVE_REFERENCE = require('../../../public/assets/images/pgn-viewer/reference-inactive.svg');

const DesktopPGNViewer = (props) => {
  const {
    variationOpt,
    activeFileInfo,
    pgnStr,
    fen,
    userFullInfo,
    handleAnalyze,
    fenToAnalyze,
    setFenToAnalyze,
    uploadFiles,
    setCurrentDirectory,
    activeTab,
    setActiveTab,
    setLoader,
    setGameReference,
    searchParams,
    setMoveLoader,
    setReference,
    setUserUploads,
    uploadFilterByPos,
    tourType,
    tourStepNumber,
    setTourNextStep,
    loader,
    allPgnArr,
    activePgnTab,
    analyzingFenTabIndx,
    setScannerImg,
    setAnalyzingFenTabIndx,
    pgn,
    activeMove,
    promoteVariation,
    featureTab,
  } = props;

  const [activeVarOpt, setActiveVarOpt] = useState(false);
  const [nextMove, setNextMove] = useState(null);
  const [symbolMode, setSymbolMode] = useState('');
  const [commentField, setCommentField] = useState(false);
  const [contextmenuCoords, setContextmenuCoords] = useState({
    x: 0,
    y: 0,
    reverse: false,
  });
  const [showMenu, setShowMenu] = useState(false);
  const [videoLimit, setVideoLimit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    message: '',
    percent: null,
  });

  const [createFolderModal, setCreateFolderModal] = useState(false);
  const [enginesOptionsList, setEnginesOptionsList] = useState({});
  const [availableServers, setAvailableServers] = useState([]);
  const [explanationsContainer, setExplanationsContainer] = useState(false);
  const [editComment, setEditComment] = useState({});
  const [newComment, setNewComment] = useState({});
  const [sortByName, setSortByName] = useState(false);

  const [ctrlKeyPressed, setCtrlKeyPressed] = useState(false);
  const [aKeyPressed, setAKeyPressed] = useState(false);
  const altKey = useKeyPress(18);
  const upKey = useKeyPress(38);

  useEffect(() => {
    if (featureTab !== null && +featureTab !== activeTab) {
      setActiveTab(+featureTab);
    }
  }, [featureTab]);

  const updateSymbolMode = (mode) => {
    setSymbolMode(mode);
    window.localStorage.setItem(SYMBOL_MODE_LS_OPTION, mode);
  };

  const regex = /(\d)+\s/g;
  useEffect(() => {
    var socket = new WebSocket(
      `wss://chessify.me/ws/upload_progress/${userFullInfo.username}/`
    );

    socket.onmessage = function (event) {
      var { data } = JSON.parse(event.data);
      if (data.progress) {
        const progressDetails = data.progress.match(regex);
        const progressPercent = Math.round(
          (progressDetails[0] / progressDetails[1]) * 100
        );
        if (progressPercent === 100) {
          setUploadProgress({
            message: '',
            percent: null,
          });
          setLoader('fileLoader');
          setUserUploads('/', userFullInfo);
        } else {
          setUploadProgress({
            message: data.progress,
            percent: progressPercent,
          });
        }
      }
    };
    socket.onerror = function (event, error) {
      console.log('FAILED', event);
    };
  }, []);

  useEffect(() => {
    if (window.localStorage.getItem(SYMBOL_MODE_LS_OPTION) === 'symbol') {
      updateSymbolMode('symbol');
    } else {
      updateSymbolMode('notation');
    }
  });

  useEffect(() => {
    if (!loader.length && createFolderModal) {
      setCreateFolderModal(false);
    }
  }, [loader]);

  const updateReferences = () => {
    setMoveLoader(true);
    setLoader('gameRefLoader');
    setGameReference(false, searchParams);
    setReference(fen, searchParams ? searchParams : '');
  };

  useEffect(() => {
    updateReferences();
    if (tourType === 'study' && tourStepNumber === 1) {
      setTourNextStep();
    }
  }, [fen]);

  useEffect(() => {
    updateReferences();
  }, []);

  useEffect(() => {
    if (uploadFilterByPos) {
      setLoader('fileLoader');
      setUserUploads('/', userFullInfo);
    }
  }, [fen]);

  useEffect(() => {
    setLoader('fileLoader');
    setUserUploads('/', userFullInfo);
  }, [uploadFilterByPos]);

  useEffect(() => {
    const downHandler = (event) => {
      if (event.which === 17) {
        setCtrlKeyPressed(true);
      }
      if (event.which === 65) {
        setAKeyPressed(true);
      }
    };

    window.addEventListener('keydown', downHandler);
    return () => {
      window.removeEventListener('keydown', downHandler);
    };
  }, [activeMove]);

  useEffect(() => {
    const isOpen = document.querySelectorAll('.modal-dialog').length > 0;
    if (aKeyPressed && ctrlKeyPressed && !isOpen) {
      if (
        !activeMove ||
        (Object.keys(activeMove).length === 0 &&
          activeMove.constructor === Object)
      ) {
        setAKeyPressed(false);
        setCtrlKeyPressed(false);
        return;
      }

      if (activeMove.comments && activeMove.comments.length === 0) {
        setCommentField(true);
        setAKeyPressed(false);
        setCtrlKeyPressed(false);
        return;
      }

      let hasText = false;
      let lastTextIndx = null;
      activeMove.comments.forEach((comment, indx) => {
        if (comment.text) {
          hasText = true;
          lastTextIndx = indx;
        }
      });

      if (!hasText) {
        setCommentField(true);
        setAKeyPressed(false);
        setCtrlKeyPressed(false);
        return;
      } else {
        setEditComment({
          id: activeMove.move_id,
          index: lastTextIndx,
        });
        setNewComment({
          comment: activeMove.comments[lastTextIndx].text,
          position: activeMove.comments[lastTextIndx].text.length - 1,
        });
      }
      setAKeyPressed(false);
      setCtrlKeyPressed(false);
    }
  }, [aKeyPressed, ctrlKeyPressed]);

  useEffect(() => {
    const isOpen = document.querySelectorAll('.modal-dialog').length > 0;
    if (altKey && upKey && !isOpen && activeTab === 0) {
      if (
        !activeMove ||
        (Object.keys(activeMove).length === 0 &&
          activeMove.constructor === Object)
      ) {
        return;
      }
      promoteVariation(activeMove);
    }
  }, [altKey, upKey]);

  const toggleSymbolChange = () =>
    updateSymbolMode(symbolMode === 'symbol' ? 'notation' : 'symbol');

  const getFileList = () => {
    let file = new File([pgnStr], activeFileInfo.file.key.split('/')[2], {
      type: 'application/vnd.chess-pgn',
    });

    let transfer = new DataTransfer();
    transfer.items.add(file);
    let fileList = transfer.files;
    return fileList;
  };

  const saveFileContentHandler = () => {
    setIsLoading(true);
    let fileList = getFileList();

    const path = '/' + activeFileInfo.path + '/';
    uploadFiles(path, fileList, userFullInfo).then(() => {
      setCurrentDirectory('/');
      setIsLoading(false);
    });
  };

  const switchAnalysisTabHandler = () => {
    setAnalyzingFenTabIndx(activePgnTab);
    handleAnalyze(activePgnTab);
  };

  return (
    <React.Fragment>
      <div className="dsk-pgn-viewer ml-3">
        <Tabs
          selectedIndex={activeTab}
          onSelect={(index) => setActiveTab(index)}
        >
          <div className="pgn-viewer-header">
            <TabList className="tab-style--1">
              <div>
                <Tab onClick={() => setActiveTab(0)}>
                  <img
                    src={activeTab === 0 ? ACTIVE_NOTATION : INACTIVE_NOTATION}
                    height={20}
                    width={20}
                    alt=""
                  />
                  <span>Notation</span>
                </Tab>
                <Tab
                  onClick={() => {
                    setActiveTab(1);
                    if (
                      (tourType === 'study' || tourType === 'prepare') &&
                      (tourStepNumber === 0 || tourStepNumber === -1)
                    ) {
                      setTourNextStep();
                    }
                  }}
                >
                  <div id="referenceTab">
                    <img
                      src={
                        activeTab === 1 ? ACTIVE_REFERENCE : INACTIVE_REFERENCE
                      }
                      height={20}
                      width={20}
                      alt=""
                    />
                    <span>Reference</span>
                  </div>
                </Tab>
                <Tab
                  onClick={() => {
                    setActiveTab(2);
                  }}
                >
                  <div id="uploadsTab">
                    <IoMdFolder
                      height={20}
                      width={20}
                      className="uploads"
                      style={{ color: activeTab === 2 ? '#358C65' : '#959D99' }}
                    />
                    <span>Uploads</span>
                  </div>
                </Tab>
                <Tab
                  onClick={() => {
                    setActiveTab(3);
                  }}
                >
                  <FaVideo
                    height={20}
                    width={20}
                    className="uploads"
                    style={{ color: activeTab === 3 ? '#358C65' : '#959D99' }}
                  />
                  <span>Video Search</span>
                </Tab>
                <Tab
                  onClick={() => {
                    setActiveTab(4);
                  }}
                >
                  <FaRegFilePdf
                    height={20}
                    width={20}
                    className="uploads"
                    style={{ color: activeTab === 4 ? '#358C65' : '#959D99' }}
                  />
                  <span>
                    PDF Scanner <sup>beta</sup>
                  </span>
                </Tab>
              </div>
            </TabList>
          </div>
          <div className="pgn-viewer-body">
            <TabPanel>
              <MultiTabNotations
                handleAnalyze={handleAnalyze}
                toggleSymbolChange={toggleSymbolChange}
                symbolMode={symbolMode}
              />
              <div>
                {Object.keys(activeFileInfo).length !== 0 &&
                activeFileInfo.file &&
                activeFileInfo.file.key &&
                allPgnArr[activePgnTab] &&
                allPgnArr[activePgnTab].tabFile &&
                allPgnArr[activePgnTab].tabFile.key ? (
                  <div className="d-flex flex-row justify-content-between">
                    <div className="uploaded-folder-title">
                      <RiFile3Fill className="uploaded-icons-file" />
                      <span>
                        {activeFileInfo.file.key.split('/')[1] +
                          '/' +
                          activeFileInfo.file.key.split('/')[2]}
                      </span>
                    </div>

                    <div className="d-flex flex-row justify-content-end uploaded-folder-func">
                      <button
                        className="apply-btn file-save-btn"
                        variant="primary"
                        type="button"
                        onClick={() => saveFileContentHandler()}
                      >
                        {isLoading ? (
                          <div className="circle-loader"></div>
                        ) : (
                          'Save'
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <></>
                )}
                <Variations
                  symbolModeEnabled={symbolMode === 'symbol'}
                  setContextmenuCoords={setContextmenuCoords}
                  showMenu={showMenu}
                  setShowMenu={setShowMenu}
                  editComment={editComment}
                  setEditComment={setEditComment}
                  newComment={newComment}
                  setNewComment={setNewComment}
                />
                {showMenu ? (
                  <MoveContextmenu
                    setCommentField={setCommentField}
                    top={contextmenuCoords.y}
                    left={contextmenuCoords.x}
                    reverse={contextmenuCoords.reverse}
                  />
                ) : (
                  <> </>
                )}
                <div>
                  <Toolbar
                    isCommentField={commentField}
                    setCommentField={setCommentField}
                  />
                </div>
              </div>
            </TabPanel>
            <TabPanel>
              <div className="d-flex flex-column">
                {pgn && pgn.moves && pgn.moves.length ? (
                  <Variations
                    symbolModeEnabled={symbolMode === 'symbol'}
                    setContextmenuCoords={setContextmenuCoords}
                    showMenu={showMenu}
                    setShowMenu={setShowMenu}
                    fromRef={true}
                  />
                ) : (
                  <></>
                )}
                <div>
                  <div className="reference-divider"></div>
                  <div className="reference-content">
                    <MoveReference />
                  </div>
                  <div className="reference-divider"></div>
                  <div className="reference-content">
                    <BoardReference setActiveTab={setActiveTab} />
                  </div>
                </div>
              </div>
            </TabPanel>
            <TabPanel>
              <Uploads
                setActiveTab={setActiveTab}
                uploadProgress={uploadProgress}
                setCreateFolderModal={setCreateFolderModal}
                sortByName={sortByName}
                setSortByName={setSortByName}
              />
            </TabPanel>
            <TabPanel>
              <VideosArea
                fen={fen}
                tabIsOpen={activeTab === 3}
                setVideoLimit={setVideoLimit}
              />
            </TabPanel>
            <TabPanel>
              <PdfScanner setScannerImg={setScannerImg} />
            </TabPanel>
          </div>
        </Tabs>
        <VariationActions
          activeTab={activeTab}
          activeVarOpt={activeVarOpt}
          isCommentField={commentField}
          editComment={editComment}
          setActiveVarOpt={setActiveVarOpt}
          setNextMove={setNextMove}
        />
        {variationOpt ? <VariationOptionsModal isOpen={variationOpt} /> : <></>}
        {activeVarOpt ? (
          <ActiveVarOptionsModal
            isOpen={activeVarOpt}
            setIsOpen={setActiveVarOpt}
            nextMove={nextMove}
          />
        ) : (
          <></>
        )}
      </div>
      <Tabs className="analysis-sec">
        <TabList className="tab-style--1 mt--10 ml-3">
          <Tab>
            <SlGraph /> Analysis
          </Tab>
          <Tab>
            <GoGraph /> Full Game Analysis
          </Tab>
          <Tab>
            <GiChessKing /> Decode Chess
          </Tab>
        </TabList>
        <TabPanel>
          {analyzingFenTabIndx === null ||
          analyzingFenTabIndx === activePgnTab ? (
            <div
              id="analysisAreaEngines"
              className="mt--10 ml-3 analysis-area-engines"
            >
              <AnalysisArea
                handleAnalyze={handleAnalyze}
                fenToAnalyze={fenToAnalyze}
                setFenToAnalyze={setFenToAnalyze}
                enginesOptionsList={enginesOptionsList}
              />
              <DesktopEnginesList
                handleAnalyze={handleAnalyze}
                fenToAnalyze={fenToAnalyze}
                setFenToAnalyze={setFenToAnalyze}
                enginesOptionsList={enginesOptionsList}
                setEnginesOptionsList={setEnginesOptionsList}
                availableServers={availableServers}
                setAvailableServers={setAvailableServers}
              />
            </div>
          ) : (
            <button
              className="ml-3 apply-btn switch-analysis-btn"
              onClick={() => switchAnalysisTabHandler()}
            >
              Bring Analysis Here
            </button>
          )}
        </TabPanel>
        <TabPanel>
          <FullGameAnalysis
            availableServers={availableServers}
            enginesOptionsList={enginesOptionsList}
          />
        </TabPanel>
        <TabPanel>
          <DecodeChess
            explanationsContainer={explanationsContainer}
            setExplanationsContainer={setExplanationsContainer}
          />
        </TabPanel>
      </Tabs>
      <UploadsLimitModal
        showModal={videoLimit}
        setShowModal={setVideoLimit}
        limitType="videoSearch"
      />
      <CreateNewFolderModal
        isOpen={createFolderModal}
        setIsOpen={setCreateFolderModal}
      />
      <Onboarding setActiveTab={setActiveTab} />
      <OnboardingTutorial />
    </React.Fragment>
  );
};

export default connect(mapStateToProps, {
  uploadFiles,
  setCurrentDirectory,
  setLoader,
  setGameReference,
  setMoveLoader,
  setReference,
  setUserUploads,
  setTourNextStep,
  setAnalyzingFenTabIndx,
  promoteVariation,
})(DesktopPGNViewer);
