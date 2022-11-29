import { __x, __o } from '../tools/defaults';
import { linkMaster_selector, } from "../tools/atoms";
import { useRecoilValue, } from "recoil";
import Node from "./NodeComponent";

///////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function Link({linkID}:any){

  const linkMaster = useRecoilValue(linkMaster_selector(linkID)); // aggregates and updates from the following
  const proxyNode = {
    ...linkMaster.nodes.target,
    length:linkMaster.length,
    position:linkMaster.position,
    hasCanvas:linkMaster.hasCanvas,
    linkMaster:linkMaster.id
  }

  return(<>
    {
      __x
      && <Node proxyNode={proxyNode} pocketed={false}/>
    }
  </>)

}
