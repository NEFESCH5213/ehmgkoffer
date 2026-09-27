// Minimal QR encoder: byte mode, EC level L, versions 1–6, mask 0. Returns {path, size} for an SVG.
(function(){
const CAP=[null,[19,7,1],[34,10,1],[55,15,1],[80,20,1],[108,26,1],[136,18,2]]; // [data cw, ec per block, blocks]
function mul(x,y){let z=0;for(let i=7;i>=0;i--){z=(z<<1)^((z>>>7)*0x11d);z^=((y>>>i)&1)*x;}return z&255;}
function divisor(n){const r=new Array(n).fill(0);r[n-1]=1;let root=1;for(let i=0;i<n;i++){for(let j=0;j<n;j++){r[j]=mul(r[j],root);if(j+1<n)r[j]^=r[j+1];}root=mul(root,2);}return r;}
function remainder(data,div){const r=new Array(div.length).fill(0);for(const b of data){const f=b^r.shift();r.push(0);for(let j=0;j<div.length;j++)r[j]^=mul(div[j],f);}return r;}
window.qrMini=function(text){
 const bytes=Array.from(new TextEncoder().encode(text));
 let ver=1;while(ver<=6&&CAP[ver][0]*8<bytes.length*8+12)ver++;
 if(ver>6)return {path:'',size:21};
 const [dataLen,ecn,blocks]=CAP[ver];
 const bits=[];const push=(v,n)=>{for(let i=n-1;i>=0;i--)bits.push((v>>i)&1);};
 push(4,4);push(bytes.length,8);bytes.forEach(b=>push(b,8));
 push(0,Math.min(4,dataLen*8-bits.length));while(bits.length%8)bits.push(0);
 const data=[];for(let i=0;i<bits.length;i+=8)data.push(parseInt(bits.slice(i,i+8).join(''),2));
 for(let p=0xec;data.length<dataLen;p^=0xfd)data.push(p);
 const div=divisor(ecn),per=dataLen/blocks,db=[],eb=[];
 for(let b=0;b<blocks;b++){const d=data.slice(b*per,(b+1)*per);db.push(d);eb.push(remainder(d,div));}
 const cw=[];for(let i=0;i<per;i++)db.forEach(d=>cw.push(d[i]));for(let i=0;i<ecn;i++)eb.forEach(e=>cw.push(e[i]));
 const N=ver*4+17,M=Array.from({length:N},()=>new Array(N).fill(0)),F=Array.from({length:N},()=>new Array(N).fill(false));
 const set=(r,c,v)=>{if(r<0||c<0||r>=N||c>=N)return;M[r][c]=v?1:0;F[r][c]=true;};
 const finder=(r,c)=>{for(let i=-1;i<=7;i++)for(let j=-1;j<=7;j++){const on=(i>=0&&i<=6&&j>=0&&j<=6)&&(i===0||i===6||j===0||j===6||(i>=2&&i<=4&&j>=2&&j<=4));set(r+i,c+j,on);}};
 finder(0,0);finder(0,N-7);finder(N-7,0);
 for(let i=8;i<N-8;i++){set(6,i,i%2===0);set(i,6,i%2===0);}
 if(ver>=2){const p=N-7;for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++)set(p+i,p+j,Math.max(Math.abs(i),Math.abs(j))!==1);}
 // reserve format areas
 for(let i=0;i<9;i++){set(8,i,0);set(i,8,0);}for(let i=N-8;i<N;i++){set(8,i,0);set(i,8,0);}
 const all=[];cw.forEach(b=>{for(let i=7;i>=0;i--)all.push((b>>i)&1);});
 let k=0;for(let right=N-1;right>=1;right-=2){if(right===6)right=5;for(let v=0;v<N;v++){for(let j=0;j<2;j++){const x=right-j,up=((right+1)&2)===0,y=up?N-1-v:v;if(!F[y][x]&&k<all.length){M[y][x]=all[k++];}}}}
 for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(!F[r][c]&&(r+c)%2===0)M[r][c]^=1;
 const f=0x77c4,gb=i=>(f>>i)&1;
 for(let i=0;i<=5;i++)set(8,i,gb(i));set(8,7,gb(6));set(8,8,gb(7));set(7,8,gb(8));for(let i=9;i<15;i++)set(14-i,8,gb(i));
 for(let i=0;i<8;i++)set(N-1-i,8,gb(i));for(let i=8;i<15;i++)set(8,N-15+i,gb(i));set(N-8,8,1);
 let d='';for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(M[r][c])d+=`M${c} ${r}h1v1h-1z`;
 return {path:d,size:N};
};
})();
