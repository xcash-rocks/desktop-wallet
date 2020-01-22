import { Injectable } from '@angular/core';
import { Transaction } from 'electron';
const exec = (<any>window).require('child_process').exec;
const fs = (<any>window).require('fs');

@Injectable({
  providedIn: 'root'
})
export class RpcCallsService {

  constructor() { }

  // Variables
  walletsyncprogress:number = 0;
  rpcUserAgent:string = fs.readFileSync("useragent.txt","utf8");
  Remote_Node:string = JSON.parse(fs.readFileSync("database.txt","utf8")).wallet_settings.remote_node;
  XCASH_DECIMAL_PLACES:number = 1000000;
  currentWalletName:string = "";

  public sleep(milliseconds)
  {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  private async getPostRequestData(json_data: string): Promise<any> {
    return new Promise((resolve, reject) => {
      try {

        // Constants
        const requestHeaders: HeadersInit = new Headers();
        const URL = "http://localhost:18285/json_rpc";
     
        // Variables
        let result:string;
        let settings:object;   
        
        requestHeaders.set('Content-Type', 'application/json');
        requestHeaders.set('Accept', 'application/json'); 
        requestHeaders.set('User-Agent', this.rpcUserAgent); 

        settings = {method:"post", headers: requestHeaders, body: json_data};

        // send the post request
        fetch(URL, settings)
        .then(res => res.json())
        .then(res => resolve(res)) 
       .catch(error => reject(error));
      } catch (error) {
        reject();
      }
    });
  }

  private async getPostRequestDataNoErrors(json_data: string): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
      // Constants
        const requestHeaders: HeadersInit = new Headers();
        const URL = "http://localhost:18285/json_rpc";
     
        // Variables
        let result:string;
        let settings:object;   
        
        requestHeaders.set('Content-Type', 'application/json');
        requestHeaders.set('Accept', 'application/json'); 
        requestHeaders.set('User-Agent', this.rpcUserAgent); 

        settings = {method:"post", headers: requestHeaders, body: json_data};

        // send the post request
        fetch(URL, settings)
        .then(res => res.json())
        .then(res => resolve("OK"))
        .catch(error => resolve("OK"));
      } catch (error) {
        resolve("OK");
      } 
    });
  }

  private async closeWallet():Promise<string>
  {
    return new Promise(async (resolve, reject) => {
      // Constants
      const CLOSE_WALLET_URL:string = '{"jsonrpc":"2.0","id":"0","method":"close_wallet"}';

      await this.getPostRequestDataNoErrors(CLOSE_WALLET_URL);
      await this.sleep(20000);
      exec("taskkill /f /im xcash-wallet-rpc*");
      exec("killall -9 'xcash-wallet-rpc'");
      await this.sleep(20000);
      resolve("success");
  });
  }

  public async createWallet(walletData:any): Promise<object> {
    // Constants
    const CREATE_WALLET_URL:string = `{"jsonrpc":"2.0","id":"0","method":"create_wallet","params":{"filename":"${walletData.walletName}","password":"${walletData.walletPassword.password}","language":"English"}}`;
    
    return new Promise(async(resolve, reject) => {
    try
    {
      // close the wallet if it is already running
      console.log("Closing window");
      await this.closeWallet();

      // open the wallet in create wallet mode
      exec(`"${__dirname}/../"xcash-wallet-rpc --rpc-bind-port 18285 --disable-rpc-login --wallet-dir "${__dirname}/../" --daemon-address "${this.Remote_Node}" --rpc-user-agent "${this.rpcUserAgent}"`);
      await this.sleep(20000);
      console.log("creating window");
      console.log(CREATE_WALLET_URL);
      await this.getPostRequestData(CREATE_WALLET_URL);
      await this.sleep(20000);
      // at this point the wallet will try to sync if we let it
    
      // close the wallet
      console.log("Closing window");
      await this.closeWallet();

      // start the wallet
      exec(`"${__dirname}/../"xcash-wallet-rpc --rpc-bind-port 18285 --disable-rpc-login --wallet-file "${__dirname}/../"${walletData.walletName}"" --password "${walletData.walletPassword.password}" --daemon-address "${this.Remote_Node}" --rpc-user-agent "${this.rpcUserAgent}"`);
      await this.sleep(20000);
      let publicAddress:string = await this.getPublicAddress();
      let mnemonicSeed:string = await this.getMnenonicSeed();

      console.log(publicAddress);
      console.log(mnemonicSeed);

      // close the wallet
      console.log("Closing window");
      await this.closeWallet();

      resolve({"public_address":publicAddress, "mnemonic_seed":mnemonicSeed});
    } catch (error) {
    reject({"status":"error"});
    }
    });
  }

  public async importWallet(walletData:any): Promise<object> {
    // Constants
    const IMPORT_WALLET_DATA:string = `{"version":1,"filename":"${__dirname}/../${walletData.walletName}","scan_from_height":0,"password":"${walletData.password}","seed":"${walletData.seed}"}`;
    const IMPORT_WALLET_FILE:string = "importwallet.txt";

    return new Promise(async(resolve, reject) => {
    try
    {
      // close the wallet if it is already running
      console.log("Closing window");
      await this.closeWallet();

      // create the importwallet.txt file
      fs.writeFileSync(IMPORT_WALLET_FILE, IMPORT_WALLET_DATA);
      await this.sleep(10000);

      // open the wallet in import mode
      exec(`"${__dirname}/../"xcash-wallet-rpc --rpc-bind-port 18285 --disable-rpc-login --generate-from-json "${__dirname}/../${IMPORT_WALLET_FILE}" --daemon-address "${this.Remote_Node}" --rpc-user-agent "${this.rpcUserAgent}"`);
      await this.sleep(20000);
 
      // at this point the wallet will try to sync if we let it
    
      // close the wallet
      console.log("Closing window");
      await this.closeWallet();

      // start the wallet
      exec(`"${__dirname}/../"xcash-wallet-rpc --rpc-bind-port 18285 --disable-rpc-login --wallet-file "${__dirname}/../"${walletData.walletName}"" --daemon-address "${this.Remote_Node}" --password "${walletData.password}" --rpc-user-agent "${this.rpcUserAgent}"`);
      await this.sleep(20000);
      let publicAddress:string = await this.getPublicAddress();
      let balance:number = await this.getBalance();

      // close the wallet
      await this.closeWallet();

      // delete the importwallet.txt file
      fs.unlinkSync(IMPORT_WALLET_FILE);

      resolve({"public_address":publicAddress,"balance":balance});
    } catch (error) {
    reject({"status":"error"});
    }
    });
  }

  public async openWallet(password:string):Promise<string>
  {
    return new Promise(async (resolve, reject) => {
      try
      {
        console.log(`"${__dirname}/../"xcash-wallet-rpc --rpc-bind-port 18285 --disable-rpc-login --wallet-file "${__dirname}/../"${this.currentWalletName}"" --password "${password}" --daemon-address "${this.Remote_Node}" --rpc-user-agent "${this.rpcUserAgent}"`);
        exec(`"${__dirname}/../"xcash-wallet-rpc --rpc-bind-port 18285 --disable-rpc-login --wallet-file "${__dirname}/../"${this.currentWalletName}"" --password "${password}" --daemon-address "${this.Remote_Node}" --rpc-user-agent "${this.rpcUserAgent}"`);
        await this.sleep(20000);
        let publicAddress:string = await this.getPublicAddress();
        if (publicAddress.substr(0,3) != "XCA")
        {
          reject();
        }
        resolve();
      }
      catch (error)
      {
        reject();
      }
  });
  }

  public async getTransactions(): Promise<Transaction[]> {
    // Constants
    const URL:string = '{"jsonrpc":"2.0","id":"0","method":"get_transfers","params":{"in":true,"out":true}}';

   // Variables
   let data;
   let transactions: any[] = [];
   let count = 0;
   return new Promise(async(resolve, reject) => {

   try
   {
     data = await this.getPostRequestData(URL);
     data.result.in.forEach(item => {
       count++;
      transactions.push({
        id: count,
        amount: item.amount / this.XCASH_DECIMAL_PLACES,
        txid: item.txid,
        date: new Date(item.timestamp*1000),
        transactionType: "in",
        type: 'private',
        fees: item.fee / this.XCASH_DECIMAL_PLACES,
        paymentid: item.payment_id,
        blockHeight: item.height,
      });
     });

     data.result.out.forEach(item => {
      count++;
     transactions.push({
       id: count,
       amount: item.amount / this.XCASH_DECIMAL_PLACES,
       txid: item.txid,
       date: new Date(item.timestamp*1000),
       transactionType: "out",
       type: 'private',
       fees: item.fee / this.XCASH_DECIMAL_PLACES,
       paymentid: item.payment_id,
       blockHeight: item.height,
     });
    });

    // sort the data by date
    transactions.sort((a,b)=>b.date-a.date);

    // re item the transactions
    count = 0;
    transactions.forEach(item => {
      count++
      item.id = count
    });
    resolve(transactions);
   }
   catch(error)
   {
     reject();
   }
  });
  }

  public async getCurrentBlockHeight(): Promise<any> {
    // Constants
    const URL:string = '{"jsonrpc":"2.0","id":"0","method":"get_height"}';

   // Variables
   let data;

   return new Promise(async(resolve, reject) => {
   try
   {
     data = await this.getPostRequestData(URL);
     resolve(data.result.height);
   }
   catch(error)
   {
    try {reject(data.error.message);}catch(error){reject();}
   }
  });
  }

  public async getPublicAddress(): Promise<string> {
    // Constants
    const URL:string = '{"jsonrpc":"2.0","id":"0","method":"get_address"}';

    // Variables
    let data;

    return new Promise(async(resolve, reject) => {

      try
      {
      data = await this.getPostRequestData(URL);
      resolve(data.result.address);
    }
    catch(error)
    {
      try {reject(data.error.message);}catch(error){reject();}
    }
  });
  }

  public async getMnenonicSeed(): Promise<string> {
    // Constants
    const URL:string = '{"jsonrpc":"2.0","id":"0","method":"query_key","params":{"key_type":"mnemonic"}}';

    // Variables
    let data;

    return new Promise(async(resolve, reject) => {

      try
      {
      data = await this.getPostRequestData(URL);
      resolve(data.result.key);
    }
    catch(error)
    {
      try {reject(data.error.message);}catch(error){reject();}
    }
  });
  }

  public async getViewKey(): Promise<string>  {
    // Constants
    const URL:string = '{"jsonrpc":"2.0","id":"0","method":"query_key","params":{"key_type":"view_key"}}';

    // Variables
    let data;

    return new Promise(async(resolve, reject) => {

      try
      {
      data = await this.getPostRequestData(URL);
      resolve(data.result.key);
    }
    catch(error)
    {
      try {reject(data.error.message);}catch(error){reject();}
    }
  });
  }

  public async getSpendKey(): Promise<string> {
    // Constants
    const URL:string = '{"jsonrpc":"2.0","id":"0","method":"query_key","params":{"key_type":"mnemonic"}}';

    // Variables
    let data;

    return new Promise(async(resolve, reject) => {

      try
      {
      data = await this.getPostRequestData(URL);
      resolve(data.result.key);
    }
    catch(error)
    {
      try {reject(data.error.message);}catch(error){reject();}
    }
  });
  }

  public async getTxKey(txid:string): Promise<string> {
    // Constants
    const URL:string = `{"jsonrpc":"2.0","id":"0","method":"get_tx_key","params":{"txid":"${txid}"}}`;

    // Variables
    let data;

    return new Promise(async(resolve, reject) => {

      try
      {
      data = await this.getPostRequestData(URL);
      resolve(data.result.tx_key);
    }
    catch(error)
    {
      try {reject(data.error.message);}catch(error){reject();}
    }
  });
  }

  public async createIntegratedAddress(paymentid:string): Promise<any> {
    return new Promise(async(resolve, reject) => {
      // Constants
    const URL:string = `{"jsonrpc":"2.0","id":"0","method":"make_integrated_address","params":{"payment_id":"${paymentid}"}}`;
      
    // Variables
    let data;

      try
      {
      data = await this.getPostRequestData(URL);
      resolve({"payment_id":data.result.payment_id,"integrated_address":data.result.integrated_address});
    }
    catch(error)
    {
      try {reject({"status":data.error.message});}catch(error){reject({"status":"error"});}
    }
  });
  }

  public async createSubAddress(label:string): Promise<string> {
    // Constants
    const URL:string = `{"jsonrpc":"2.0","id":"0","method":"create_address","params":{"account_index":0,"label":"${label}"}}`;

    // Variables
    let data;

    return new Promise(async(resolve, reject) => {

      try
      {
      data = await this.getPostRequestData(URL);
      resolve(data.result.address);
    }
    catch(error)
    {
      try {reject(data.error.message);}catch(error){reject();}
    }
  });
  }

  public async getSubAddresses(subAddressCount:number): Promise<any> {
    return new Promise(async(resolve, reject) => {
    // create the sub address list
    let subAddressList:string = "";
    let count;

    for (count = 1; count <= subAddressCount; count++)
    {
      subAddressList += `${count},`;
    }
    subAddressList = subAddressList.slice(0, -1); 

    // Constants
    const URL:string = `{"jsonrpc":"2.0","id":"0","method":"get_balance","params":{"account_index":0,"address_indices":[${subAddressList}]}}`;

    // Variables
    let data;
    let subAddresses: any[] = [];

   try
   {
     data = await this.getPostRequestData(URL);
     data.result.per_subaddress.forEach(item => {
       subAddresses.push({
        id: item.address_index,
        label: item.label,
        address: item.address,
        balance: item.balance / this.XCASH_DECIMAL_PLACES,
      });
     });
     resolve(subAddresses);
    }
    catch(error)
    {
      reject(subAddresses);
    }
  });
   }

  public async createSignedData(signedData:string): Promise<string> {
    // Constants
    const URL:string = `{"jsonrpc":"2.0","id":"0","method":"sign","params":{"data":"${signedData}"}}`;

    // Variables
    let data;

    return new Promise(async(resolve, reject) => {

      try
      {
      data = await this.getPostRequestData(URL);
      resolve(data.result.signature);
    }
    catch(error)
    {
      try {reject(data.error.message);}catch(error){reject();}
    }
  });
  }

  public async verifySignedData(signedData:any): Promise<boolean> {
    // Constants
    const URL:string = `{"jsonrpc":"2.0","id":"0","method":"verify","params":{"data":"${signedData.data}","address":"${signedData.public_address}","signature":"${signedData.signature}"}}`;
    
    // Variables
    let data;

    return new Promise(async(resolve, reject) => {

      try
      {
      data = await this.getPostRequestData(URL);
      resolve(data.result.good);
    }
    catch(error)
    {
      reject(false);
    }
  });
  }

  public async createReserveproof(reserveproofData:any): Promise<string> {
    // Constants
    const URL:string = `{"jsonrpc":"2.0","id":"0","method":"get_reserve_proof","params":{"all":false,"account_index":0,"amount":${reserveproofData.amount},"message":"${reserveproofData.message}"}}`;
    // Variables
    let data;

    return new Promise(async(resolve, reject) => {

      try
      {
      data = await this.getPostRequestData(URL);
      resolve(data.result.signature);
    }
    catch(error)
    {
      try {reject(data.error.message);}catch(error){reject();}
    }
  });
  }

  public async verifyReserveproof(reserveproofData:any): Promise<boolean> {
    // Constants
    const URL:string = `{"jsonrpc":"2.0","id":"0","method":"check_reserve_proof","params":{"address":"${reserveproofData.public_address}","message":"${reserveproofData.message}","signature":"${reserveproofData.reserveproof}"}}`;
    // Variables
    let data;

    return new Promise(async(resolve, reject) => {

      try
      {
      data = await this.getPostRequestData(URL);
      resolve(data.result.good === true && data.result.spent === 0 ? true : false);
    }
    catch(error)
    {
      resolve(false);
    }
  });
  }

  public async getBalance(): Promise<number> {
    // Constants
    const URL:string = '{"jsonrpc":"2.0","id":"0","method":"get_balance"}';

    // Variables
    let data;

    return new Promise(async(resolve, reject) => {

      try
      {
      data = await this.getPostRequestData(URL);
      resolve(data.result.balance / this.XCASH_DECIMAL_PLACES);
    }
    catch(error)
    {
      try {reject(data.error.message);}catch(error){reject();}
    }
  });
  }

  public async sendPayment(sendPaymentData:any, settings:boolean): Promise<object> {
    // Constants
    const sendType = sendPaymentData.maxAmount === true ? "sweep_all" : "transfer_split";
    const URL:string = `{"jsonrpc":"2.0","id":"0","method":"${sendType}","params":{"destinations":[{"amount":${sendPaymentData.amount * this.XCASH_DECIMAL_PLACES},"address":"${sendPaymentData.recipient}"}],"priority":0,"ring_size":21,"get_tx_keys": true, "payment_id":"${sendPaymentData.paymentId}", "tx_privacy_settings":"${sendPaymentData.privacy}", "do_not_relay":${settings}}}`;
    /// Variables
    let data;

    return new Promise(async(resolve, reject) => {

      try
      {
      data = await this.getPostRequestData(URL);
      resolve({"status":"success","txid":data.result.tx_hash_list[0],"txkey":data.result.tx_key_list[0],"fee":data.result.fee_list[0] / this.XCASH_DECIMAL_PLACES,"total":(data.result.fee_list[0] + data.result.amount_list[0]) / this.XCASH_DECIMAL_PLACES});
    }
    catch(error)
    {
      try {reject({"status":data.error.message});}catch(error){reject({"status":"error"});}
    }
  });
  }

  public async rescanBlockchain(): Promise<string> {
    return new Promise(async(resolve, reject) => {
    // Constants
    const URL:string = '{"jsonrpc":"2.0","id":"0","method":"rescan_blockchain"}';

    await this.getPostRequestData(URL);
    resolve("OK");
  });
  }
}


