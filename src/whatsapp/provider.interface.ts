export interface Button { id:string; title:string }
export interface ListSection { title:string; rows:{id:string;title:string;description?:string}[] }
export interface WhatsAppProvider { sendText(to:string,text:string):Promise<void>; sendButtons(to:string,text:string,buttons:Button[]):Promise<void>; sendList(to:string,text:string,sections:ListSection[]):Promise<void>; sendImage(to:string,imageUrl:string,caption?:string):Promise<void> }
