import { __x, __o } from '../tools/defaults';
import { useInterval, recolor, resetApp } from '../tools/functions';
import {
  scale_atom,
  atlas_selector,
  selectedNodeID_atom,
  canvasID_atom,
  node_atom,
  link_atom,
  pocketID_atom,
} from "../tools/atoms";
import { atom, selector, useRecoilState, useRecoilValue, useSetRecoilState, } from "recoil";
import {
  memo,
  useState,
  useEffect,
  useRef,
} from 'react';
import React from 'react';

//import './../App.scss';

import Link from "./LinkComponent";
import Node from "./NodeComponent";
import Login from "./LoginComponent";

import Draggable from 'react-draggable';
import * as localStorage from 'store2';

////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function Frame(){

  const scale = useRecoilValue(scale_atom);
  const selectedNodeID = useRecoilValue(selectedNodeID_atom);

  const [ canvasID, canvasIDΔ ] = useRecoilState(canvasID_atom); // change which canvas is active
  const [ canvasNode, canvasNodeΔ ] = useRecoilState(node_atom(canvasID));

  const [ pocketID, pocketIDΔ ] = useRecoilState(pocketID_atom);
  const [ pocketNode, pocketNodeΔ ] = useRecoilState(node_atom(pocketID));


  const textRef = useRef(null);
  const componentRef = useRef(null);

  function proxyNode(passedNode:any, x:any, y:any ){
    return({
      ...passedNode,
      length:{x:x,y:y,},
      hasCanvas:true,
    })
  }

  //console.log(`proxy`,proxyNode(canvasNode))

  const baseStyle:React.CSSProperties = {
    position:`absolute`,
    left:`0px`, right:`0px`,
    height:`60px`,
    display:`flex`,
    backgroundColor:recolor(canvasNode.color, {lum:-10,sat:null,hue:null,}),
    outline:`2px solid ${recolor(canvasNode.color, {lum:-30,sat:null,hue:null,})}`,
    alignItems:`center`, justifyContent:`center`,
    userSelect:`none`,
    zIndex:4,
  }

  useEffect(()=>{
    const handleKey = (e:any)=>{
      if(pocketID && !selectedNodeID){
        switch(e.key){
          case "Delete":
          case "Escape":
            pocketIDΔ(null)
          break;
          case "Enter":
            //textEditableΔ(true)
          break;
        }
      }
    }
    window.addEventListener('keyup', handleKey);
    return ()=>{
      window.removeEventListener('keyup', handleKey);
    };
  },[
    pocketID,
    selectedNodeID,
  ]);

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////

  return (
    <>
      {
        __o
        && canvasNode
        && <Node proxyNode={proxyNode( canvasNode, 3+3**2/4, 1+1**2/4 )} onCanvas={true}/>
      }
      {
        __x
        && pocketNode
        && <Node proxyNode={proxyNode( pocketNode, 3, 1 )} inPocket={true}/>
      }

  {/*///////////////////////////////////////////////////////////////////////////////////////////////////////////*/}

      <div
        style={{
			...baseStyle,
			top:`0px`,
			fontSize:`150%`,
		}}
        onClick={(e)=>{ // add limited orphan protection; if none of its nodes are links, it's in danger
          if(
            __x
            //&& !editingText
            && !(e.altKey)
          ){
            if(
              false
              //e.ctrlKey
            ){
              //editingTextΔ(true);
              //textInputValueΔ(canvasNode.text);
              //pocketIDΔ(null)
            }
            else{
              if(canvasID !== "N 0"){// you're not on the origin
                if(!pocketID){ // nothing in pocket
                  pocketIDΔ(canvasID) // save current location as the return point
                }
                if(pocketID == "N 0"){
                  pocketIDΔ(canvasID)
                }
                canvasIDΔ("N 0") // go to origin
              }
            }
          }
        }}
        onDoubleClick={(e)=>{
          if(
            __x
            && e.altKey
            //&& canvasNode.id == "N 0"
          ){
            resetApp()
          }
        }}
      >

			<Login/>

        <div
          style={{
            display:`flex`, flexDirection:`row`,
            width:`200px`, height:`50px`,
            lineHeight:`${100}%`,
          }}
        >
          {
            __x
            && canvasNode.icon
            && <div style={{
                display:`flex`,
                alignItems:`center`, justifyContent:`center`,
                width:`${50}px`,
                fontSize:`${140}%`,
            }}>
              <span style={{paddingBottom:`2px`,}}>
                {canvasNode.icon}
              </span>
            </div>
          }
          {
            __x
            && <div style={{
                display:`flex`,
                alignItems:`center`, justifyContent:`center`,
                //outline:`1px solid black`,
                width:`150px`,
                height:`100%`,
            }}>
              <span style={{
                fontSize:`${90}%`,
                paddingBottom:`${1}px`,
                paddingRight:`${((canvasNode.icon)?scale.unit:0)/6}px`,
                margin:`${0}px`
              }}>
                {
                  __o
                  ||(
                    __x
                    && <span style={{
                      pointerEvents:`none`,
                      fontWeight:`bold`,
                    }}>
                      {canvasNode.text}
                    </span>
                  )
                  ||(
                    __x
                    && <textarea
                      style={{
                        resize:`none`,
                        overflow:`hidden`,
                      }}
                      rows={1}
                      cols={8}

                      onChange={(e)=>{
                        //textInputValueΔ(e.target.value)
                        //textChangedΔ(true)
                      }}
                    />
                  )
                }
              </span>
            </div>
          }




        </div>

      </div>

  {/*///////////////////////////////////////////////////////////////////////////////////////////////////////////*/}

      <div
			style={{
				...baseStyle,
				bottom:`0px`,
				//paddingTop:`4px`,
			}}
      />


    </>
  )

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////

}
