import React from 'react';
import { connect } from 'react-redux';
import { MdEdit, MdCheck } from 'react-icons/md';
import { BsArrowRightShort } from 'react-icons/bs';
import { switchToBoard } from '../../utils/utils';
import { setEditMode } from '../../actions/board';
import QuickEdit from './QuickEdit';
import { correctionFen } from '../../utils/utils';

const mapStateToProps = (state) => {
  return {
    isEditMode: state.board.isEditMode,
  };
};

const EditArea = ({
  fen,
  orientation,
  setFen,
  setEditMode,
  setBoardOrientation,
  setPgn,
  isEditMode,
  soundMode,
  updateSoundMode,
  setScannerImg,
  scannerImg,
  setDisplayScannerImg,
}) => {
  const switchEditMode = () => {
    window.LichessEditor.setFen(fen);
    window.LichessEditor.setOrientation(orientation);
    setEditMode(!isEditMode);
  };

  const rotateBoard = () => {
    const url = new URL(window.location.href);
    const fenFromUrl = url.searchParams.get('fen');
    const fen = correctionFen(fenFromUrl);

    const splitFen = fen.split(' ')[0];
    const reverseFen = splitFen.split('').reverse().join('');
    const flipedBoardFen = reverseFen + fen.replace(splitFen, '');

    let newOrient = orientation === 'white' ? 'black' : 'white';
    setBoardOrientation(newOrient);
    window.LichessEditor.setOrientation(newOrient);

    window.LichessEditor.setFen(flipedBoardFen);
    setFen(flipedBoardFen);
  };

  return (
    <div className="edit-sec">
      {isEditMode ? (
        <>
          <button
            className="white-button og-img"
            onClick={() => {
              setEditMode(false);
            }}
          >
            Cancel
          </button>
          <button
            className="white-button og-img"
            onClick={() => {
              rotateBoard();
            }}
          >
            Rotate A1 <BsArrowRightShort /> H8
          </button>
          {scannerImg.length ? (
            <>
              <button
                className="white-button og-img"
                onClick={() => {
                  setDisplayScannerImg();
                }}
              >
                See Original Image
              </button>
            </>
          ) : (
            <></>
          )}
          <button
            className="white-button done-editor-btn"
            onClick={() => {
              switchToBoard(
                setFen,
                setBoardOrientation,
                setEditMode,
                isEditMode,
                setPgn,
                fen
              );
              setScannerImg('');
            }}
          >
            Done
          </button>
        </>
      ) : (
        <div className="d-flex flex-row">
          <button className="white-button" onClick={switchEditMode}>
            <MdEdit size={18} /> Edit
          </button>
          <QuickEdit
            setFen={setFen}
            setBoardOrientation={setBoardOrientation}
            orientation={orientation}
            updateSoundMode={updateSoundMode}
            soundMode={soundMode}
            setScannerImg={setScannerImg}
          />
        </div>
      )}
    </div>
  );
};

export default connect(mapStateToProps, { setEditMode })(EditArea);
