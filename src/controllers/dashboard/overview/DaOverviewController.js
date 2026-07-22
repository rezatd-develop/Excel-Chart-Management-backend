import File from "../../../models/fileModel.js";
import { translations } from "../../../translations/translations.js";
import { createResponseMessageClass } from "../../../utils/responseHelper.js";
import { filterAndGroupByTime } from "../../../utils/timeHelper.js";

export const getFileChartData = async (req, res) => {
    try {
        const { id } = req.params;
        const { range, start, end } = req.query;

        const file = await File.findById(id);
        if (!file)
            return res.status(200).json(
                createResponseMessageClass(null, true, translations.fileNotFound)
            );

        const { labels, values } = filterAndGroupByTime(file.data, {
            dateField: "Registration Date",
            range,
            start,
            end,
            valueField: row => Number(row["Total Purchase"]) || 0
        });

        const data = {
            labels,
            datasets: [
                {
                    label: "Total Purchase",
                    data: values,
                    borderColor: "#FF6384",
                    backgroundColor: "rgba(255, 99, 132, 0.5)",
                    fill: true
                }
            ]
        };

        res.json(createResponseMessageClass(data, false, null));
    } catch (error) {
        console.error(error);
        res
            .status(500)
            .json(createResponseMessageClass(null, true, translations.errorGeneratingChart));
    }
};

export const getFilePurchaseByCompany = async (req, res) => {
    try {
        const { id } = req.params;

        const file = await File.findById(id);
        if (!file)
            return res.status(200).json(
                createResponseMessageClass(null, true, translations.fileNotFound)
            );

        const rows = file.data;

        const mainCompanies = [
            "Omran Arg",
            "Kerman Motor Public Relations",
            "KADEK - Parts Design"
        ];

        const counts = {
            "Omran Arg": 0,
            "Kerman Motor Public Relations": 0,
            "KADEK - Parts Design": 0,
            "Others": 0
        };

        rows.forEach(row => {
            const company = row["Company Name"];

            if (mainCompanies.includes(company)) {
                counts[company]++;
            } else {
                counts["Others"]++;
            }
        });

        const data = {
            labels: Object.keys(counts),
            datasets: [
                {
                    label: "Purchase Count by Company",
                    data: Object.values(counts),
                    backgroundColor: [
                        "#FF6384",
                        "#36A2EB",
                        "#FFCE56",
                        "#AAAAAA"
                    ]
                }
            ]
        };

        res.json(createResponseMessageClass(data, false, null));
    } catch (error) {
        console.error(error);
        res
            .status(500)
            .json(createResponseMessageClass(null, true, translations.errorGeneratingBookCountChart));
    }
};

export const getFileProfitChart = async (req, res) => {
    try {
        const { id } = req.params;
        const { range, start, end } = req.query;

        const file = await File.findById(id);
        if (!file)
            return res.status(200).json(
                createResponseMessageClass(null, true, translations.fileNotFound)
            );

        const { labels, values } = filterAndGroupByTime(file.data, {
            dateField: "Registration Date",
            range,
            start,
            end,
            valueField: row => Number(row["Profit"]) || 0
        });

        const data = {
            labels,
            datasets: [
                {
                    label: "Fully Rounded",
                    data: values,
                    borderColor: "#FF6384",
                    backgroundColor: "rgba(255, 99, 132, 0.5)",
                    borderWidth: 2,
                    borderRadius: Number.MAX_VALUE,
                    borderSkipped: false
                },
                {
                    label: "Small Radius",
                    data: values,
                    borderColor: "#36A2EB",
                    backgroundColor: "rgba(54, 162, 235, 0.5)",
                    borderWidth: 2,
                    borderRadius: 5,
                    borderSkipped: false
                }
            ]
        };

        res.json(createResponseMessageClass(data, false, null));
    } catch (error) {
        console.error(error);
        res
            .status(500)
            .json(createResponseMessageClass(null, true, translations.errorGeneratingProfitChart));
    }
};

export const getFileDiscountChart = async (req, res) => {
    try {
        const { id } = req.params;
        const { range, start, end } = req.query;

        const file = await File.findById(id);
        if (!file)
            return res.status(404).json(
                createResponseMessageClass(null, true, translations.fileNotFound)
            );

        const { labels, values } = filterAndGroupByTime(file.data, {
            dateField: "Registration Date",
            range,
            start,
            end,
            valueField: row => Number(row["Commission/Discount"]) || 0
        });

        const counts = filterAndGroupByTime(file.data, {
            dateField: "Registration Date",
            range,
            start,
            end
        }).values;

        const avgValues = values.map((value, index) => value / counts[index]);

        const data = {
            labels,
            datasets: [
                {
                    label: "Cubic interpolation (monotone)",
                    data: avgValues,
                    borderColor: "#FF6384",
                    fill: false,
                    cubicInterpolationMode: "monotone",
                    tension: 0.4
                },
                {
                    label: "Cubic interpolation",
                    data: avgValues,
                    borderColor: "#36A2EB",
                    fill: false,
                    tension: 0.4
                },
                {
                    label: "Linear interpolation (default)",
                    data: avgValues,
                    borderColor: "#4BC0C0",
                    fill: false
                }
            ]
        };

        res.json(createResponseMessageClass(data, false, null));
    } catch (error) {
        console.error(error);
        res
            .status(500)
            .json(createResponseMessageClass(null, true, translations.errorGeneratingDiscountChart));
    }
};

export const getSellerSales = async (req, res) => {
    try {
        const { id } = req.params;
        const { start, end } = req.query;

        const file = await File.findById(id);
        if (!file)
            return res.status(200).json(
                createResponseMessageClass(null, true, translations.fileNotFound)
            );

        let rows = file.data;

        if (start && end) {
            const startDate = new Date(start);
            const endDate = new Date(end);

            rows = rows.filter(row => {
                const date = new Date(row["Registration Date"]);
                return date >= startDate && date <= endDate;
            });
        }

        const sellerSales = {};

        rows.forEach(row => {
            const seller =
                row["seller"] ||
                row["Seller Name"] ||
                "Unknown";

            const amount = Number(row["Total Purchase"]) || 0;

            if (!sellerSales[seller]) {
                sellerSales[seller] = 0;
            }

            sellerSales[seller] += amount;
        });

        const result = Object.entries(sellerSales).map(([name, amount]) => ({
            name,
            amount
        }));

        result.sort((a, b) => b.amount - a.amount);

        res.json(createResponseMessageClass(result, false, null));
    } catch (error) {
        console.error(error);
        res
            .status(500)
            .json(createResponseMessageClass(null, true, translations.errorGeneratingChart));
    }
};