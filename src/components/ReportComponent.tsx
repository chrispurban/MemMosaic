import { __x, __o } from '../tools/defaults';
//import { } from '../tools/functions';
import {
  scale_atom,
  atlas_selector,
  selectedNodeID_atom,
  canvasID_atom,
  node_atom,
  link_atom,
  pocketID_atom,
  view_atom,
} from "../tools/atoms";
import { atom, selector, useRecoilState, useRecoilValue, useSetRecoilState, } from "recoil";
import {
  memo,
  useState,
  useEffect,
  useRef,
} from 'react';

//import './../App.scss';

import Link from "./LinkComponent";
import Draggable from 'react-draggable';

import * as localStorage from 'store2';

////////////////////////////////////////////////////////////////////////////////////////////

export default function Report(){

  const [ view, viewΔ ] = useRecoilState(view_atom);
  const [ scale, scaleΔ ] = useRecoilState(scale_atom);
  const selectedNodeID = useRecoilValue(selectedNodeID_atom);
  const atlas = useRecoilValue(atlas_selector);

//////////////////////////////////////////////////////////////////////////////////////////////

  function getView(){
    const foundView = {
      pxAbsolute: window.innerHeight,
      XpxUnits: Math.floor((window.innerHeight/2)/10),
      pxExtra: Math.round(((((window.innerHeight/2)/10))%1)*10),
    }
    viewΔ(foundView)
  }
  useEffect(()=>{getView()},[]);
  useEffect(()=>{
    window.addEventListener("resize", getView);
    return () => window.removeEventListener("resize", getView);
  });

  //////////////////////////////////////////////////////////////////////////////////////////////

  /*
  useEffect(()=>{
    const handleWheel = (event)=>{
      //console.log(event)
      scaleΔ(
        (s)=>{
          let scrollRate = 20
          console.log(Math.round(event.deltaY/scrollRate))
          return {...s,
            unit:s.unit-Math.round(event.deltaY/scrollRate)
          }
        }
      )
    }
    window.addEventListener('wheel', handleWheel);
    return ()=>{
      window.removeEventListener('wheel', handleWheel);
    }
  },[scale])
  */

  useEffect(()=>{
    const handleKey = (e:any)=>{
      if(e.key == "Home"){
        //console.clear()
        //console.log(`atlas`,atlas)
        //console.log(`selected`,selectedNodeID)
        //console.log(`view`,view)
        //console.log(`width`,window.outerWidth)
      }
    }
    window.addEventListener('keyup', handleKey);
    return ()=>{
      window.removeEventListener('keyup', handleKey);
    };
  },[
    atlas,
    selectedNodeID,
    view,
  ])

  //////////////////////////////////////////////////////////////////////////////////////////////

/*
    <div style={{
      position:`absolute`,
      zIndex:5000,
      backgroundColor:`green`,
      left:'0', top:'0',
      width:'200px', height:`${view.pxAbsolute-10}px`,
    }}>

    </div>
*/

  return(
    <>
    </>
  )

}
