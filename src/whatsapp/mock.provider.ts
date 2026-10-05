import {Button,ListSection,WhatsAppProvider} from './provider.interface';
export class MockProvider implements WhatsAppProvider {
  async sendText(to:string,text:string){console.log(JSON.stringify({provider:'mock',type:'text',to,text}));}
  async sendButtons(to:string,text:string,buttons:Button[]){console.log(JSON.stringify({provider:'mock',type:'buttons',to,text,buttons}));}
  async sendList(to:string,text:string,sections:ListSection[],buttonLabel='Choose'){console.log(JSON.stringify({provider:'mock',type:'list',to,text,sections,buttonLabel}));}
  async sendImage(to:string,imageUrl:string,caption?:string){console.log(JSON.stringify({provider:'mock',type:'image',to,imageUrl,caption}));}
}
