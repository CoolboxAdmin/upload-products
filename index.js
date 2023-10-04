import express from "express";
import bodyParser from "body-parser"
import XLSX from "xlsx"
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

import multer from 'multer'
import { utilsDatos } from './utils/utils.js'

// url QA https://qastorefront840.myvtex.com/admin
//const doc = multer({ dest: 'doc/' })

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, `${__dirname}/files/`)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.originalname)
    }
})

const upload = multer({ storage: storage })
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express()
const port = 3000
app.use(
    cors({
        origin: "*",
    })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
    res.status(200).json({
        mensaje: "todo ok...!"
    })
})

app.post("/massive-upload-products", upload.single("file"), async (req, res) => {
    let arrResponse = []
    const excel = XLSX.readFile(`${__dirname}/files/${req.file?.originalname}`);
    var nombreHoja = excel.SheetNames;
    let datos = XLSX.utils.sheet_to_json(excel.Sheets[nombreHoja[0]]);
    let specs = XLSX.utils.sheet_to_json(excel.Sheets[nombreHoja[1]]);
    for (const element of datos) {
        const elementSpecs = specs.filter(spec=>spec.externalId==element.externalId)
        const response = await utilsDatos(element, req.query.categoryId, req.query.vtexCookie, elementSpecs)
        arrResponse.push(response)
    }
    res.status(200).json({
        data: arrResponse
    })
})

app.listen(port, () => {
    console.log(`Server started on PORT ${port}`);
})