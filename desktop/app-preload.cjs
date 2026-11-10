const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('evoLyricDesktop',{
  startImport(payload){return ipcRenderer.invoke('lyric-import:start',payload).catch(()=>{})},
  onLyricImported(callback){ipcRenderer.on('lyric-import-result',(_event,data)=>callback(data))},
  onImportStatus(callback){ipcRenderer.on('lyric-import-status',(_event,data)=>callback(data))}
});
