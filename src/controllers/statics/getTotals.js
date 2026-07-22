// controllers/statistics/getTotals.js

import File from "../../models/fileModel.js";
import { createResponseMessageClass } from "../../utils/responseHelper.js";
import { translations } from "../../translations/translations.js";

export const getAllTotals = async (req, res) => {
    try {
        const files = await File.find();

        if (!files || files.length === 0) {
            return res.status(200).json(
                createResponseMessageClass(null, true, translations.noFilesFound)
            );
        }

        let totalPrice = 0;
        let totalPurchase = 0;
        let totalProfit = 0;
        let finalAmount = 0;

        for (const file of files) {
            if (!file.data || file.data.length === 0) continue;

            for (const row of file.data) {
                const price = Number(row["Total Price"]) || 0;
                const purchase = Number(row["Total Purchase"]) || 0;
                const profit = Number(row["Profit"]) || 0;
                const final = Number(row["Final Amount"]) || 0;

                totalPrice += price;
                totalPurchase += purchase;
                totalProfit += profit;
                finalAmount += final;
            }
        }

        const result = {
            totalPrice,
            totalPurchase,
            totalProfit,
            finalAmount
        };

        return res.status(200).json(
            createResponseMessageClass(result, false, translations.success)
        );
    } catch (error) {
        console.error(error);

        return res.status(500).json(
            createResponseMessageClass(null, true, translations.errorOccurred)
        );
    }
};