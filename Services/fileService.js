const { channel } = require('diagnostics_channel');
const fs = require('fs');

class FileService{

    static async deleteItem(path){
        try{
            const isDir = fs.lstatSync(path).isDirectory();
            if (isDir){
                await fs.promises.rm(path,{recursive:true});
            }else{
                await fs.promises.rm(path);
            }
        }catch(err){
            console.log(err);
        }
    }

    static sendFileToClient(path){
        try{
            const stream = fs.createReadStream(path);
            return stream;
        }catch(err){
            console.log(err);
        }
    }

    static async saveFile(path,stream){
        try{
            let fileWriter = fs.createWriteStream(path);
            stream.on('data',(chunk) =>{
                fileWriter.write(chunk);
            })
        }catch(err){
            console.log(err);
        }
    }

    static async writeToFile(path,text){
        try{
            if (path.endsWith('.txt')){
                let fileWriter = fs.createWriteStream(path);
                fileWriter.write(text+'\n');
                return true
            }else{
                return false
            }
        }catch(err){
            console.log(err);
        }
    }

    static async appendTextToFile(path, text){
        try{
            if(path.endsWith('.txt')){
                await fs.appendFile(path,text, (err) =>{
                   if (err) console.log(err);
                });
                return true
            }else{
                return false
            }    
        }catch(err){
            console.log(err);
        }
    }

    static readTxtFile(path){
        try{
            if(path.endsWith('.txt')){
                const data = fs.readFileSync(path, 'utf-8');
                return data;
            }else{
                return false
            }
        }catch(err){
            console.log(err);
        }
    }

}

module.exports = FileService;