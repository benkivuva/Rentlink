import axios from 'axios';
import { Button,ListSection,WhatsAppProvider } from './provider.interface';
export class HttpProvider implements WhatsAppProvider {
  constructor(private readonly endpoint:string,private readonly headers:Record<string,string>,private readonly sender:string,private readonly format:(to:string,type:string,payload:unknown)=>unknown){}
  private async send(to:string,type:string,payload:unknown){await axios.post(this.endpoint,this.format(to,type,payload),{headers:this.headers,timeout:15000});}
  sendText(to:string,text:string){return this.send(to,'text',{text});}
  sendButtons(to:string,text:string,buttons:Button[]){return this.send(to,'buttons',{text,buttons:buttons.slice(0,3)});}
  sendList(to:string,text:string,sections:ListSection[]){return this.send(to,'list',{text,sections});}
  sendImage(to:string,imageUrl:string,caption?:string){return this.send(to,'image',{imageUrl,caption});}
}
