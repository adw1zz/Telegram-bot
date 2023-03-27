const FileService = require('./fileService.js');
const AdminService = require('./adminService.js');
const OWNRESLISTFILE = process.env.OWNRESLISTFILE;
const ADMINLISTFILE = process.env.ADMINLISTFILE;


class OwnerService{

    static async removeUserFromAdminList(userId, target){

        if(this.checkOwnerId(userId)){

            let data = FileService.readTxtFile(ADMINLISTFILE).split('\n').filter((i)=>{
                return i != "";
            });
            const toRemove = data.find((i) => i == target);
            if(toRemove && toRemove != userId){
                const newData = data.toString().replace(toRemove,'').replace(/,/g,'\n');
                const flag = await FileService.writeToFile(ADMINLISTFILE, newData);
                if(flag){
                    return `User with ID <${target}> was successfully removed from admin list.`
                }else{
                    return "AdminListFile must be a .txt file."
                }
            }else{
                return `No such user with ID<${target}>.`
            }


        }else{
            return "This command only for owners."
        }

    }


    static async addToAdminList(userId, target){

        if(this.checkOwnerId(userId)){

            const userIs = AdminService.checkAdminId(target);
            if(!userIs){
                const flag = await FileService.appendTextToFile(ADMINLISTFILE, target+'\n');
                if(flag){
                    return `User with ID <${target}> was successfully added to admin list.`
                }else{
                    return "AdminListFile must be a .txt file."
                }
            }else{
                return `User with ID <${target}> already exists in admin list.`
            }

        }else{
            return "This command only for owners."
        }

    }


    static async clearAdminList(userId){

        if(this.checkOwnerId(userId)){

            const flag = await FileService.writeToFile(ADMINLISTFILE, '');
            if(flag){
                return 'Support list successfully cleared'
            }else{
                return "SupportListFile must be a .txt file."
            }


        }else{
            return "This command only for owners."
        }

    }

    static checkOwnerId(userId){
        const data = FileService.readTxtFile(OWNRESLISTFILE);
        const allOwners = data.split('\n');
        const res = allOwners.find((i) => i == userId);
        if (res){
            return true;
        }else{
            return false;
        }
    }


}

module.exports = OwnerService;