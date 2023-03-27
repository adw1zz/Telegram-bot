const LOGS = process.env.LOGS;
const SUPPORTLISTFILE = process.env.SUPPORTLISTFILE;
const FileService = require('./fileService.js');

class SupportService{

    static async addToLogs(data){
        const flag = await FileService.appendTextToFile(LOGS, JSON.stringify(data)+'\n');
        return flag
    }

    static getLogs(){
        const data = FileService.readTxtFile(LOGS).split('\n').filter((i)=>{
            return i != ""
        });
        if (data){
            const parseData = data.map((i) =>{
                return JSON.parse(i);
            });
            return parseData
        }else{
            return false
        }
    }

    static async deleteLogs(toRemove,sourceLogs){
        const toRemoveStringArray = toRemove.map((i) =>{
            return JSON.stringify(i)+'\n'
        })
        const sourceLogsStringArray = sourceLogs.map((i) =>{
            return JSON.stringify(i)+'\n'
        })
        const newData = sourceLogsStringArray.filter((i) => !toRemoveStringArray.includes(i));
        console.log(newData);
        const flag = await FileService.writeToFile(LOGS, newData.join(''));
        return flag;
    }

    static async clearLogs(){
        const flag = await FileService.writeToFile(LOGS, '');
        return flag
    }

    static checkSupportId(userId){
        const data = FileService.readTxtFile(SUPPORTLISTFILE);
        const allSupports = data.split('\n');
        const res = allSupports.find((i) => i == userId);
        if (res){
            return true;
        }else{
            return false;
        }
    }


}

module.exports = SupportService;
