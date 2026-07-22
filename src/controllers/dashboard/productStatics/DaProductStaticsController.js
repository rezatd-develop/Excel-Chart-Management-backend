import File from "../../../models/fileModel.js";
import { translations } from "../../../translations/translations.js";
import { createResponseMessageClass } from "../../../utils/responseHelper.js";

export const getFileServiceChart = async (req, res) => {
    try {
        const { id } = req.params;

        const file = await File.findById(id);
        if (!file) {
            return res
                .status(404)
                .json(createResponseMessageClass(null, true, translations.fileNotFound));
        }

        const rows = file.data;

        const counts = {
            Flight: 0,
            Hotel: 0,
            Other: 0
        };

        rows.forEach(row => {
            const service = row["Service"];

            if (service === "Flight") {
                counts.Flight++;
            } else if (service === "Hotel") {
                counts.Hotel++;
            } else {
                counts.Other++;
            }
        });

        const data = {
            labels: Object.keys(counts),
            datasets: [
                {
                    label: "Service Type Count",
                    data: Object.values(counts),
                    backgroundColor: [
                        "#FF6384",
                        "#36A2EB",
                        "#FFCE56"
                    ]
                }
            ]
        };

        res.json(createResponseMessageClass(data, false, null));
    } catch (error) {
        console.error(error);
        res
            .status(500)
            .json(createResponseMessageClass(null, true, translations.errorGeneratingServiceChart));
    }
};