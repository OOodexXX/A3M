// ============================================================
// scripts/ui/showcase.js  —  A3M Print
// Showcase Sections — caps gallery, hover effects
// ============================================================

(function(){
  // ── STLLoader ──
  THREE.STLLoader = function(m){this.manager=m||THREE.DefaultLoadingManager;};
  THREE.STLLoader.prototype={
    constructor:THREE.STLLoader,
    load:function(url,onLoad,onProg,onErr){
      var s=this,l=new THREE.FileLoader(this.manager);
      l.setResponseType('arraybuffer');
      l.load(url,function(b){onLoad(s.parse(b));},onProg,onErr);
    },
    parse:function(data){var b=this.ensureBinary(data);return this.isBinary(b)?this.parseBinary(b):this.parseASCII(this.ensureString(data));},
    isBinary:function(d){var r=new DataView(d),n=r.getUint32(80,true);return d.byteLength===(84+n*50);},
    ensureBinary:function(b){if(typeof b==='string'){var a=new ArrayBuffer(b.length),v=new Uint8Array(a);for(var i=0;i<b.length;i++)v[i]=b.charCodeAt(i)&0xff;return a;}return b;},
    ensureString:function(b){return typeof b==='string'?b:new TextDecoder().decode(new Uint8Array(b));},
    parseBinary:function(data){
      var r=new DataView(data),n=r.getUint32(80,true),g=new THREE.BufferGeometry(),v=[],nm=[];
      for(var f=0;f<n;f++){var s=84+f*50,nx=r.getFloat32(s,true),ny=r.getFloat32(s+4,true),nz=r.getFloat32(s+8,true);for(var x=0;x<3;x++){var q=s+12+x*12;v.push(r.getFloat32(q,true),r.getFloat32(q+4,true),r.getFloat32(q+8,true));nm.push(nx,ny,nz);}}
      g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(v),3));
      g.setAttribute('normal',new THREE.BufferAttribute(new Float32Array(nm),3));
      return g;
    },
    parseASCII:function(data){
      var g=new THREE.BufferGeometry(),v=[],nm=[],pV=/vertex\s+([\d.+\-eE]+)\s+([\d.+\-eE]+)\s+([\d.+\-eE]+)/g,pN=/normal\s+([\d.+\-eE]+)\s+([\d.+\-eE]+)\s+([\d.+\-eE]+)/g,r,nb=[0,0,1];
      while((r=pN.exec(data))!==null){nb=[+r[1],+r[2],+r[3]];for(var k=0;k<3;k++)nm.push(nb[0],nb[1],nb[2]);}
      while((r=pV.exec(data))!==null)v.push(+r[1],+r[2],+r[3]);
      g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(v),3));
      if(nm.length===v.length)g.setAttribute('normal',new THREE.BufferAttribute(new Float32Array(nm),3));
      else g.computeVertexNormals();
      return g;
    }
  };

  // ── OBJLoader ──
  THREE.OBJLoader=function(m){this.manager=m||THREE.DefaultLoadingManager;};
  THREE.OBJLoader.prototype={
    constructor:THREE.OBJLoader,
    load:function(url,onLoad,onProg,onErr){
      var s=this,l=new THREE.FileLoader(this.manager);
      l.load(url,function(t){onLoad(s.parse(t));},onProg,onErr);
    },
    parse:function(text){
      var lines=text.split('\n'),v=[],nm=[],pos=[],nor=[];
      lines.forEach(function(ln){
        var p=ln.trim().split(/\s+/);
        if(p[0]==='v')v.push(+p[1],+p[2],+p[3]);
        else if(p[0]==='vn')nm.push(+p[1],+p[2],+p[3]);
        else if(p[0]==='f'){
          var fv=p.slice(1);
          for(var t=1;t<fv.length-1;t++){
            [fv[0],fv[t],fv[t+1]].forEach(function(fvi){
              var sp=fvi.split('/'),vi=(parseInt(sp[0])-1)*3;
              pos.push(v[vi],v[vi+1],v[vi+2]);
              var ni=sp[2]?(parseInt(sp[2])-1)*3:-1;
              nor.push(ni>=0?nm[ni]:0,ni>=0?nm[ni+1]:1,ni>=0?nm[ni+2]:0);
            });
          }
        }
      });
      var g=new THREE.BufferGeometry();
      g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(pos),3));
      g.setAttribute('normal',new THREE.BufferAttribute(new Float32Array(nor),3));
      g.computeVertexNormals();
      var mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0xd4d4d4}));
      var group=new THREE.Group();group.add(mesh);return group;
    }
  };
})();
