import xlsx from "xlsx";
import File from "../models/fileModel.js";
import { createResponseMessageClass } from "../utils/responseHelper.js";
import { translations } from "../translations/translations.js";

export const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json(
                createResponseMessageClass(null, true, "No file was uploaded.")
            );
        }

        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheetData = xlsx.utils.sheet_to_json(
            workbook.Sheets[sheetName]
        );

        const savedFile = await File.create({
            originalName: req.file.originalname,
            data: sheetData
        });

        res.status(201).json(
            createResponseMessageClass(
                savedFile._id,
                false,
                translations.fileUpdatedSuccessfully
            )
        );
    } catch (error) {
        console.error("Upload error:", error);

        res.status(500).json(
            createResponseMessageClass(null, true, "Error uploading file.")
        );
    }
};

export const getFiles = async (req, res) => {
    try {
        const files = await File.find().select("originalName uploadDate");
        res.json(files);
    } catch (error) {
        res.status(500).json({
            message: "Error fetching files",
            error
        });
    }
};

export const getFileById = async (req, res) => {
    try {
        const file = await File.findById(req.params.id);

        if (!file) {
            return res.status(404).json({
                message: "File not found"
            });
        }

        res.json(file);
    } catch (error) {
        res.status(500).json({
            message: "Error fetching file",
            error
        });
    }
};