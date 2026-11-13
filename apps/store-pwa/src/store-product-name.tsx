import {useLayoutEffect,useRef,useState} from "react";
import "./store-product-name.css";

type Measurement = {element:HTMLElement;text:string;signature:string;apply:(wrapped:boolean)=>void};
const pending=new Set<Measurement>();
let frame=0;
function schedule(job:Measurement) {
 pending.add(job);
 if(frame)return;
 frame=requestAnimationFrame(flush);
}
function flush() {
 frame=0;
 const jobs=[...pending];pending.clear();
 // Read all source geometry before inserting mirrors; one layout serves the list.
 const measured=jobs.flatMap(job=>{
  const {element}=job;if(!element.isConnected||element.clientWidth<1)return [];
  const width=element.clientWidth,style=getComputedStyle(element);
  const size=style.getPropertyValue("--product-name-size").trim()||"14px",line=style.getPropertyValue("--product-name-line").trim()||"20px";
  const signature=JSON.stringify([width,job.text,size,line,style.fontFamily,style.fontWeight,style.letterSpacing]);
  if(signature===job.signature)return [];
  job.signature=signature;
  return [{job,width,size,line,fontFamily:style.fontFamily,fontWeight:style.fontWeight,letterSpacing:style.letterSpacing}];
 });
 if(!measured.length)return;
 const container=document.createElement("div");
 Object.assign(container.style,{position:"fixed",visibility:"hidden",pointerEvents:"none",left:"-10000px",top:"0"});
 const mirrors=measured.map(item=>{
  const mirror=document.createElement("span");
  Object.assign(mirror.style,{display:"block",width:`${item.width}px`,fontFamily:item.fontFamily,fontWeight:item.fontWeight,fontSize:item.size,lineHeight:item.line,letterSpacing:item.letterSpacing,whiteSpace:"normal",overflowWrap:"anywhere"});
  mirror.textContent=item.job.text;container.append(mirror);return mirror;
 });
 document.body.append(container);
 const wrapped=mirrors.map((mirror,index)=>mirror.getBoundingClientRect().height>parseFloat(measured[index]!.line)+1);
 container.remove();
 measured.forEach((item,index)=>{if(item.job.element.isConnected)item.job.apply(wrapped[index]!);});
}

/** Measure at the normal size; cache width/style so shrinking cannot loop. */
export function StoreProductName({text}:{text:string}) {
 const ref=useRef<HTMLSpanElement>(null),[wrapped,setWrapped]=useState(false);
 useLayoutEffect(()=>{
  const element=ref.current;if(!element)return;
  let active=true;
  const job:Measurement={element,text,signature:"",apply:next=>setWrapped(old=>old===next?old:next)};
  schedule(job);
  const observer=typeof ResizeObserver!=="undefined"?new ResizeObserver(()=>schedule(job)):null;
  observer?.observe(element);
  document.fonts?.ready.then(()=>{if(active){job.signature="";schedule(job);}});
  return()=>{active=false;observer?.disconnect();pending.delete(job);if(!pending.size&&frame){cancelAnimationFrame(frame);frame=0;}};
 },[text]);
 return <span ref={ref} className="store-product-name" data-wrapped={wrapped||undefined}>{text}</span>;
}
