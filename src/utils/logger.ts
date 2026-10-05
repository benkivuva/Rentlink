export const describeError = (err:unknown):Record<string,unknown> => {
  if(typeof err==='object'&&err!==null){
    const anyErr=err as {response?:{status?:number;data?:unknown};message?:string;stack?:string};
    return {
      message:anyErr.message,
      status:anyErr.response?.status,
      responseBody:anyErr.response?.data,
      stack:anyErr.stack,
    };
  }
  return {raw:String(err)};
};
