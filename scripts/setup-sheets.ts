import {SheetsService} from '../src/services/sheets.service';
new SheetsService().setupSheets().then(()=>console.log('RentLink sheets and headers are ready.')).catch(err=>{console.error('Could not set up Sheets.',err);process.exitCode=1;});
