import { __x, __o, } from '../tools/defaults';
import { useInterval, recolor, resetApp, } from '../tools/functions';
import {
  scale_atom,
  view_atom,
  link_atom,
  node_atom,
  canvasID_atom,
  pocketID_atom,
  atlas_selector,
  selectedNodeID_atom,
} from "../tools/atoms";
import { atom, selector, useRecoilState, useRecoilValue, useSetRecoilState, } from "recoil";
import { memo, useState, useEffect, useRef, } from 'react';
import { useDeviceSelectors } from 'react-device-detect';

//import './../App.scss';

import Draggable from 'react-draggable';

import localStorage from 'store2';



export default function Note({proxyNode, inPocket, inHeader}:any){

	return(<>
		hello
	</>)

}