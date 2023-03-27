const FileService = require('./fileService.js');
const SupportService = require('./supportService.js');
const BLOCKLISTFILE = process.env.BLOCKLISTFILE;
const ADMINLISTFILE = process.env.ADMINLISTFILE;
const SUPPORTLISTFILE = process.env.SUPPORTLISTFILE;

class AdminService{

    static async addToBlockList(userId, target){

        if(this.checkAdminId(userId)){

            const userIs = this.searchUserInBlockList(userId,target);
            if (!userIs){
                const flag = await FileService.appendTextToFile(BLOCKLISTFILE, target+'\n');
                if (flag){
                    return `User with ID <${target}> was successfully added to block list.`
                }else{
                    return "BlockListFile must be a .txt file."
                }
            }else{
                return `User with ID <${target}> already exists in block list.`
            } 

        }else{
            return "You are not admin."
        }
        
    }

    static readBlockList(userId){

        if (this.checkAdminId(userId)){

            const data = FileService.readTxtFile(BLOCKLISTFILE);
            if(data){
                return data
            }else{
                return false
            }

        }else{
            return "You are not admin."
        }
         
    }

    static searchUserInBlockList(userId, target){

        if (this.checkAdminId(userId)){

            const data = FileService.readTxtFile(BLOCKLISTFILE).split('\n');
            const res = data.find((i) => i == target);
            if (res){
                return true;
            }else{
                return false;
            }

        }else{
            return "You are not admin."
        }
    }

    static async removeUserFromBlockList(userId, target){

        if (this.checkAdminId(userId)){

            let data = FileService.readTxtFile(BLOCKLISTFILE).split('\n').filter((i)=>{
                return i != "";
            });
            const toRemove = data.find((i) => i == target);
            if(toRemove){
                const newData = data.toString().replace(toRemove,'').replace(/,/g,'\n');
                const flag = await FileService.writeToFile(BLOCKLISTFILE, newData);
                if(flag){
                    return `User with ID <${target}> was successfully removed from block list.`
                }else{
                    return "BlockListFile must be a .txt file."
                }
            }else{
                return `No such user with ID<${target}>.`
            }

        }else{
            return "You are not admin."
        }
    }

    static async clearBlockList(userId){

        if(this.checkAdminId(userId)){

            const flag = await FileService.writeToFile(BLOCKLISTFILE, '');
            if(flag){
                return 'Block list successfully cleared'
            }else{
                return "BlockListFile must be a .txt file."
            }

        }else{
            return "You are not admin."
        }
    }

    static async addToSupportList(userId, target){

        if(this.checkAdminId(userId)){

            const userIs = SupportService.checkSupportId(target);
            if(!userIs){
                const flag = await FileService.appendTextToFile(SUPPORTLISTFILE, target+'\n');
                if(flag){
                    return `User with ID <${target}> was successfully added to support list.`
                }else{
                    return "SupportListFile must be a .txt file."
                }
            }else{
                return `User with ID <${target}> already exists in support list.`
            }

        }else{
            return "You are not admin."
        }
    }

    static async removeFromSupportList(userId, target){

        if(this.checkAdminId(userId)){

            let data = FileService.readTxtFile(SUPPORTLISTFILE).split('\n').filter((i) =>{
                return i != ""
            });
            const toRemove = data.find((i) => i == target);
            if(toRemove){
                const newData = data.toString().replace(toRemove,'').replace(/,/g,'\n');
                const flag = await FileService.writeToFile(SUPPORTLISTFILE, newData);
                if(flag){
                    return `User with ID <${target}> was successfully removed from support list.`
                }else{
                    return "SupportListFile must be a .txt file."
                }
            }else{
                return `No such user with ID<${target}>.`
            }

        }else{
           return "You are not admin."
        }

    }

    static async clearSupportList(userId){

        if(this.checkAdminId(userId)){

            const flag = FileService.writeToFile(SUPPORTLISTFILE, '');
            if(flag){
                return 'Support list successfully cleared'
            }else{
                return "SupportListFile must be a .txt file."
            }

        }else{
            return "You are not admin."
        }

    }

    static checkAdminId(userId){
        const data = FileService.readTxtFile(ADMINLISTFILE);
        const allAdmins = data.split('\n');
        const res = allAdmins.find((i) => i == userId);
        if (res){
            return true;
        }else{
            return false;
        }
    }


}

module.exports = AdminService;