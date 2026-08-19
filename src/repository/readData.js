import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);

const pathToFile = path.join(_dirname, '../../data.json');

const readData = async () => {
    try{
        const data = fs.readFileSync(pathToFile, 'utf-8');
        return JSON.parse(data);
    } catch (error){
        console.error('Error reading data:', error);
        throw error;
    }
}

const writeData = async (data) => {
    try {
        fs.writeFileSync(
            pathToFile,
            JSON.stringify(data, null, 2),
            "utf-8"
        );
        return data;
    } catch (error) {
        console.error("Error writing data:", error);
        throw error;
    }
};

export { readData, writeData };