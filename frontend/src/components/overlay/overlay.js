import React, { Component, Fragment, useEffect, useState, useRef, useContext } from "react";
import { GrLanguage, GrClose } from "react-icons/gr";
import './overlay.css'

import { Toast } from 'primereact/toast';


function Overlay({ closePopupOverlay, popupChild, isExpanded, closeOverlayTitle, customToastRef, customToastRefClassName }) {

    const toastRef = useRef(null);

    const handleClose = () => {

    }

    return (

        <div className="micrositeOverlay">
            <div className={`micrositeOuter ${isExpanded ? " maximize" : " minimize"}`}>
                <button type="button" className={"micrositeClose overlayCloseButton"} onClick={closePopupOverlay ? closePopupOverlay : handleClose} title={closeOverlayTitle ? closeOverlayTitle : "Close"}>
                    <GrClose className="closeSearchBtn" tooltip="Close" />
                </button>
                <Toast 
                ref={customToastRef ? customToastRef : toastRef}
                 position="bottom-right" className={customToastRefClassName ? customToastRefClassName : 'toastPopUpDefault'} />
                {popupChild && popupChild}
            </div>
        </div>
    )
}

export default Overlay