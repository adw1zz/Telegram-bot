require('dotenv').config();
const telegramApi = require('node-telegram-bot-api');
const TOKEN = process.env.TOKEN;
const BASEDIR = process.env.BASEDIR;
const bot = new telegramApi(TOKEN, {polling: true});
const BLOCKLISTFILE = process.env.BLOCKLISTFILE;
const AdminService = require('./Services/adminService.js');
const DirService = require('./Services/dirService.js');
const FileService = require('./Services/fileService.js');
const SupportService = require('./Services/supportService.js');
const OwnerService = require('./Services/ownerService.js');


function getData(root,path){
    const buff = DirService.dirStat(BASEDIR+root+'/'+path);
    if (!buff) return "It's empty";
    let mess =`/${path}\n\n`;
    mess = mess.replace('//','/');
    buff.forEach(item =>{
        const symbol = item.dir ? "📁 " : "📄 ";
        mess+=symbol+item.name+'    '+item.size+'\n\n';
    })
    return mess;
}

function searchItemResult(userId,item){
    const icon = item.dir ? "📁 " : "📄 ";
    const path = item.path.replace(BASEDIR+userId,'');
    return path+'\n\n'+icon+item.name+'  '+item.size;
}

function checkUserInBlockList(userId){
    const data = FileService.readTxtFile(BLOCKLISTFILE).split('\n');
    const res = data.find((i) => i == userId);
    if (res){
        return true;
    }else{
        return false;
    }
}

function convertTime(unix_timestamp){
    const date = new Date(unix_timestamp*1000);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const day = date.getDate();
    const month = months[date.getMonth()+1];
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return hours+':'+minutes+' | '+day+'.'+month+'.'+year
}

function parseLOGSData(logsData){
    if (logsData){
        let result = "--LOGS--\n";
        for (let i = 0; i < logsData.length; i++){
            const elem = logsData[i];
            result+='--------------------\nid: '+elem.id+'\nname: @'+elem.username+'\ntext: '+elem.text+'\ndate: '+convertTime(elem.date)+'\n';
        }
        return result
    }else{
        return "It's empty."
    }
   
}

function dateComparison(unix_timestamp){
    const now = Date();
    const logDate = Date(unix_timestamp*1000);
    if (now.getDate() - logDate.getDate() >= 3){
        return true
    }else{
        return false
    }
}

function filterLogs(){
    const data = SupportService.getLogs();
    const toRemove = data.map((i) =>{
        if (dateComparison(i.date)){
            return i
        }
    })
    if(toRemove){
        SupportService.deleteLogs(toRemove, data);
    }
}


const start = () =>{

    const logFilterTimer = setInterval(() => filterLogs(), 86400000 * 3);

    bot.setMyCommands([
        {command: '/start', description: 'Start the bot'},
        {command: '/help', description: 'How to use'},
        {command: '/info', description: 'About this bot'},
        {command: '/delete_all', description: 'Delete all files'},
        {command: '/root', description: 'Your root directory'},
        {command: '/delete_item', description: 'Delete item'},
        {command: '/cd', description: 'Routing'},
        {command: '/download_file', description: 'Get file'},
        {command: '/search', description: 'Search file by filename'},
        {command: '/new_folder', description: 'Make new directory'},
        {command: '/search', description: 'Search file/directory'},
        {command: '/write', description: 'Write text to .txt file'},
        {command: '/read', description: 'Read .txt file'},
        {command: '/to_support', description: 'Send message to support'},
    ])
    
    bot.on('message', async (msg) => {
        const text = msg.text;
        const chatId =  msg.chat.id;
        const userId = msg.from.id;
        const isBlocked = checkUserInBlockList(userId);
        if (!isBlocked){
            if (!msg.document && !msg.voice && !msg.audio && !msg.animation && !msg.video && !msg.photo && !msg.sticker){
                const msgArray = [text.split(' ', 1).toString(), text.split(' ').slice(1).join(' ')];
                switch(msgArray[0]){
                    case '/start': {
                        await DirService.newDirectory(BASEDIR+userId);
                        await bot.sendMessage(chatId, 'Welcome to CloudSaverBot! We make for you directory, now it is empty, but you can resolve that, send me files.'); 
                        break;
                    }
                    case '/delete_all':{
                        await DirService.deleteDirectory(BASEDIR+userId);
                        await bot.sendMessage(chatId, "It's done."); break;
                    }
                    case '/info': await bot.sendMessage(chatId, 'This telegram bot is intended to be used as a cloud storage of your data. You can use it by commands. Write /help to more info about commands'); break;
                    case '/root':{
                        await bot.sendMessage(chatId, getData(userId,''));
                        break;
                    }
                    case '/delete_item': {
                        if (msgArray[1]){
                            await FileService.deleteItem(BASEDIR+userId+'/'+msgArray[1]);
                        }
                        await bot.sendMessage(chatId, getData(userId,''));
                        break;
                    }
                    case '/download_file':{
                        const stream = FileService.sendFileToClient(BASEDIR+userId+'/'+msgArray[1]);
                        bot.sendDocument(chatId, stream);
                        break;
                    }
                    case '/new_folder':{
                        if (msgArray[1]){
                            await DirService.newDirectory(BASEDIR+userId+'/'+msgArray[1]);
                        }
                        await bot.sendMessage(chatId, getData(userId, ''));
                        break;
                    }
                    case '/cd':{
                        await bot.sendMessage(chatId, getData(userId, msgArray[1]));
                        break;
                    }
                    case '/search':{
                        DirService.searchItem(msgArray[1],BASEDIR+userId);
                        const item = DirService.getSearchItem();
                        if (!item){
                            await bot.sendMessage(chatId, `No such file or directory <${msgArray[1]}>`);
                        }else{

                            await bot.sendMessage(chatId,searchItemResult(userId, item));
                        }
                        break;
                    }
                    case '/write':{
                        const newMsgArray = [text.split(' ',2)[1], text.split(' ').slice(2).join(' ')];
                        const flag = FileService.writeToFile(BASEDIR+userId+'/'+newMsgArray[0], newMsgArray[1]);
                        if(flag){
                            await bot.sendMessage(chatId, getData(userId, ''));
                        }else{
                            await bot.sendMessage("It's not a .txt file.");
                        }
                        break;
                    }
                    case '/append':{
                        const newMsgArray = [text.split(' ',2)[1], text.split(' ').slice(2).join(' ')];
                        const flag = await FileService.appendTextToFile(BASEDIR+userId+'/'+newMsgArray[0], newMsgArray[1]);
                        if(flag){
                            await bot.sendMessage(chatId, getData(userId,''));
                        }else{
                            await bot.sendMessage(chatId, "It's not a .txt file.");
                        }
                        break;
                    }
                    case '/read':{
                        const data = FileService.readTxtFile(BASEDIR+userId+'/'+msgArray[1]);
                        console.log(msgArray);
                        if (data){
                            await bot.sendMessage(chatId, msgArray[1]+'\n\n'+data);
                        }else{
                            await bot.sendMessage(chatId, "It's not s .txt file");
                        }
                        break;
                    }
                    case '/help':{
                        const helpText = "/cd - command for routing. To use it write like </cd path>. Path - </folderName/folderName>.\n\n/delete_item - command to delete file or directory. To us it write </delete_item fullPath>. fullPath - fullpath to file or directory.\n\n/download_file - use like command </delete_item>.\n\nTo get file just send it. If you want to save it in some directory when you choose file add caption with fullpath to folder like </foldername/somefolder>.\n/search - search file. Use like '/search <filename>";
                        await bot.sendMessage(chatId, helpText);
                        break;
                    }
                    case '/to_support':{
                        const msgData = {
                            id: msg.from.id,
                            first_name: msg.from.first_name,
                            username: msg.from.username,
                            date: msg.date,
                            text: msgArray[1]

                        };
                        const flag = await SupportService.addToLogs(msgData);
                        if(flag){
                            await bot.sendMessage(chatId, "We got your message, admin will answer you later.");
                        }else{
                            console.log('LOGS must be .txt file');
                            await bot.sendMessage(chatId, "Sorry, somthing wrong on back-end, try it later");
                        }
                        break;
                    }
                    case '/admin':{
                        const flag = AdminService.checkAdminId(userId);
                        if(flag){
                            const helptext = "/block - command to block user. To use it write like </block_user userId>.\n\n/unblock - command to remove user from block list. To use it write like <unblock userId>\n\n/blocklist - command to see block list.\n\n/search_blockuser - command to search user in block list. To use write like </search_blockuser userId>\n\n/send_to - command to send message to user. use like </send_to id text>.\n\n/get_logs - command to get messages for support from users.\n\n/delete_support - command to remove user from support list. Use it like </delete_support userId>\n\n/add_support - command to add support to support list. Use it like </add_support userId>\n\n/clear_supportlist - command to clear support list.";
                            await bot.sendMessage(chatId, helptext);
                        }else{
                            await bot.sendMessage(chatId, "You are not admin.");
                        }
                        break;
                    }
                    case '/block':{
                        const res = await AdminService.addToBlockList(userId, msgArray[1]);
                        await bot.sendMessage(chatId, res);
                        break;
                    }
                    case '/unblock':{
                        const res = await AdminService.removeUserFromBlockList(userId, msgArray[1]);
                        await bot.sendMessage(chatId, res);
                        break;
                    }
                    case '/search_blockuser':{
                        const res = AdminService.searchUserInBlockList(userId, msgArray[1]);
                        if(res){
                            await bot.sendMessage(chatId, `User with ID <${msgArray[1]}> exists in block list.`);
                        }else{
                            await bot.sendMessage(chatId, `No such user with ID <${msgArray[1]}> in block list.`);
                        }
                        break;
                    }
                    case '/blocklist':{
                        const res = AdminService.readBlockList(userId);
                        if(res){
                            await bot.sendMessage(chatId, "--BLOCKLIST--\n"+res);
                        }else{
                            await bot.sendMessage(chatId, "It's empty")
                        }
                        break;
                    }
                    case '/clear_blocklist':{
                        const res = await AdminService.clearBlockList(userId);
                        await bot.sendMessage(chatId, res);
                        break;
                    }
                    case '/add_support':{
                        const res  = await AdminService.addToSupportList(userId, msgArray[1]);
                        await bot.sendMessage(chatId,res);
                        break;
                    }
                    case '/delete_support':{
                        const res = await AdminService.removeFromSupportList(userId, msgArray[1]);
                        await bot.sendMessage(chatId, res);
                        break;
                    }
                    case '/clear_supportlist':{
                        const res = await AdminService.clearSupportList(userId);
                        await bot.sendMessage(chatId,res);
                        break;
                    }
                    case '/get_logs':{
                        if (AdminService.checkAdminId(userId) || SupportService.checkSupportId(userId)){
                            const resultData = parseLOGSData(SupportService.getLogs());
                            await bot.sendMessage(chatId, resultData);
                        }else{
                            await bot.sendMessage(chatId, "You are not admin or support");
                        }
                        break;
                    }
                    case '/send_to':{
                        if(AdminService.checkAdminId(userId) || SupportService.checkSupportId(userId)){
                            const newMsgArray = [text.split(' ',2)[1], text.split(' ').slice(2).join(' ')];
                            await bot.sendMessage(newMsgArray[1], newMsgArray[2]);
                        }else{
                            await bot.sendMessage(chatId, "You are not admin.");
                        }
                        break;
                    }
                    case '/add_admin':{
                        const res = await OwnerService.addToAdminList(userId,msgArray[1]);
                        await bot.sendMessage(chatId,res);
                        break;
                    }
                    case '/delete_admin':{
                        const res = await OwnerService.removeUserFromAdminList(userId, msgArray[1]);
                        await bot.sendMessage(chatId, res);
                        break;
                    }
                    default: await bot.sendMessage(chatId, "I don't understand you"); break;
                }

            }else if (msg.document){
                const stream = bot.getFileStream(msg.document.file_id);
                let caption = '';
                
                if (msg.caption) {
                    caption = msg.caption;
                }

                await FileService.saveFile(BASEDIR+userId+caption+'/'+msg.document.file_name,stream);
                await bot.sendMessage(chatId, getData(userId, ''));
            }
        }else{
            await bot.sendMessage(chatId, "You are in a block list.")
        }
            
    })


    
}

start();