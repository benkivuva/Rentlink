import axios from 'axios';
import { Button,ListSection,WhatsAppProvider } from './provider.interface';
import { uniqueLabels } from '../utils/whatsapp-ui';
export class HttpProvider implements WhatsAppProvider {
  constructor(private readonly endpoint:string,private readonly headers:Record<string,string>,private readonly sender:string,private readonly format:(to:string,type:string,payload:unknown)=>unknown){}
  private async send(to:string,type:string,payload:unknown){await axios.post(this.endpoint,this.format(to,type,payload),{headers:this.headers,timeout:15000});}
  sendText(to:string,text:string){return this.send(to,'text',{text});}
  sendButtons(to:string,text:string,buttons:Button[]){const limited=buttons.slice(0,3);const titles=uniqueLabels(limited.map(button=>button.title),title=>title,20);return this.send(to,'buttons',{text,buttons:limited.map((button,index)=>({...button,title:titles[index]}))});}
  sendList(to:string,text:string,sections:ListSection[],buttonLabel='Choose'){const normalized=sections.map(section=>{const rows=section.rows.slice(0,10);const titles=uniqueLabels(rows.map(row=>row.title),title=>title,24);return {...section,title:section.title.slice(0,24),rows:rows.map((row,index)=>({...row,title:titles[index],description:row.description?.slice(0,72)}))};});return this.send(to,'list',{text,sections:normalized,buttonLabel:buttonLabel.slice(0,20)});}
  sendImage(to:string,imageUrl:string,caption?:string){return this.send(to,'image',{imageUrl,caption});}
}
