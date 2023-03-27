const fs = require('fs');

class DirService{

    resultOfSearch = {};

    static getSearchItem(){
        return this.resultOfSearch;
    }

    static async newDirectory(path){
        try{
            await fs.promises.mkdir(path)
        }catch(err){
            console.log(err);
        }
    }

    static async deleteDirectory(path){
        try{
            await fs.promises.rm(path,{recursive: true});
        }catch(err){
            console.log(err);
        }
    }

    static converSize(size){
        let i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
        return (size / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + ['B', 'KB', 'MB', 'GB', 'TB'][i];
    }

    static sortData(fileArray){
        let files = [];
        let folders = [];
        fileArray.map(item =>{
            item.dir ? folders.push(item) : files.push(item)
        })

        return folders.concat(files);
    }

    static dirStat(path){
        try{
            const files = fs.readdirSync(path).map(item =>{
                const isDir = fs.lstatSync(path+'/'+item).isDirectory();
                let info = 0;
                if (!isDir){
                    info = fs.statSync(path+'/'+item);
                }
                return {
                    name: item,
                    dir: isDir,
                    size: info === 0 ? "" : this.converSize(info.size)
                }
            });
            return this.sortData(files);
        }catch(err){
            console.log(err);
        }
    }

    static searchItem(itemName, path){
        try{   
            const isDir = fs.lstatSync(path).isDirectory();
            if(!isDir && itemName === path.endsWith(itemName)){
                const info = fs.statSync(path);
                this.resultOfSearch = {
                    name: itemName,
                    dir: isDir,
                    path: path,
                    size: this.converSize(info.size)
                }
                return;
            }else if(isDir && itemName === path.endsWith(itemName)){
                this.resultOfSearch ={ 
                    name: itemName,
                    dir: isDir,
                    path: path,
                    size: ""
                }
                return;
            }else if(isDir && itemName != path.endsWith(itemName)){
                const files = fs.readdirSync(path);
                for (let i = 0; i<files.length; i++){
                    let info = 0;
                    if (files[i] === itemName){
                        info = fs.statSync(path+'/'+files[i]);
                        this.resultOfSearch = {
                            name: files[i],
                            dir: fs.lstatSync(path+'/'+files[i]).isDirectory(),
                            path: path+'/'+files[i],
                            size: info === 0 ? "" : this.converSize(info.size)
                        }
                        return;
                    }else{
                        this.searchItem(itemName,path+'/'+files[i]);
                    }
                }
            }
        }catch(err){
            console.log(err);
        }
    }
}

module.exports = DirService;