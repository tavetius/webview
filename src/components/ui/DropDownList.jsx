import React, { useState, useEffect } from 'react';
import { CgChevronLeft } from 'react-icons/cg'

import { connect } from 'react-redux';
import { setDashboardSettings } from '../../utils/api';
const mapStateToProps = (state) => {
    return {
        userFullInfo: state.cloud.userFullInfo,
    };
};
const DropDownList = ({ label, data, userFullInfo, toggleMenu, isShowTitle, setStylePath}) => {
    const [active, setActive] = useState(null)
    const handleDropDownItem = (e, item) => {
        setActive(item);
        if (label == "Board Theme") {
            setDashboardSettings(userFullInfo.token, userFullInfo.userProfileId, userFullInfo.is_dark, userFullInfo.arrows_enabled, e.target.value, userFullInfo.pieces_theme);
        } else {
            setDashboardSettings(userFullInfo.token, userFullInfo.userProfileId, userFullInfo.is_dark, userFullInfo.arrows_enabled, userFullInfo.board_theme, e.target.value);
            setStylePath(`https://lichess1.org/assets/_TDotAa/piece-css/${item.name}.css`)
        }
    }

    return (
        <div className={isShowTitle ? "dropDownList" : 'mobile-dropDownList'} >
            {isShowTitle ? (<div className='dropMenu-back '>
                <button className='dropdown-btn' onClick={(e) => {
                    toggleMenu(e)
                }}>
                    <CgChevronLeft />
                    <span>{label}</span>
                </button>

            </div>)
                : null
            }
            <>
                {
                    data.map(item => {
                        return <button
                            onClick={(e) => handleDropDownItem(e, item)}
                            key={item.id} className={`dropDown-item ${active == item && 'active'}`}
                            value={item.name} title={item.name}
                            style={{ backgroundImage: `url(${item.src})` }}></button>
                    })

                }
            </>
        </div >
    )
}

export default connect(mapStateToProps)(DropDownList);