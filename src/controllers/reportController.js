import File from "../models/fileModel.js";
import { translations } from "../translations/translations.js";
import { createResponseMessageClass } from "../utils/responseHelper.js";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import vazirFont from "../utils/vazir-font.js";

export const exportFileReportPdf = async (req, res) => {
    try {
        const { id } = req.params;

        const file = await File.findById(id);

        if (!file) {
            return res
                .status(404)
                .json(createResponseMessageClass(null, true, translations.fileNotFound));
        }

        const rows = file.data || [];

        // Seller Sales
        const sellerSales = {};

        rows.forEach(row => {
            const seller =
                row["seller"] ||
                row["Seller Name"] ||
                "Unknown";

            const amount = Number(row["Total Purchase"]) || 0;

            sellerSales[seller] = (sellerSales[seller] || 0) + amount;
        });

        // Customer Purchases
        const mainCompanies = [
            "Omran Arg",
            "Kerman Motor Public Relations",
            "KADEK - Parts Design"
        ];

        const customerPurchases = {};

        mainCompanies.forEach(company => {
            customerPurchases[company] = 0;
        });

        customerPurchases["Other"] = 0;

        rows.forEach(row => {
            const company = row["Company Name"] || "Other";
            const amount = Number(row["Total Purchase"]) || 0;

            if (mainCompanies.includes(company)) {
                customerPurchases[company] += amount;
            } else {
                customerPurchases["Other"] += amount;
            }
        });

        // Buyer Growth
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const buyersThisMonth = new Set();
        const buyersLastMonth = new Set();

        rows.forEach(row => {
            const date = new Date(row["Registration Date"]);
            const buyer = row["Buyer Name"] || "Unknown";

            if (
                date.getFullYear() === currentYear &&
                date.getMonth() === currentMonth
            ) {
                buyersThisMonth.add(buyer);
            }

            if (
                date.getFullYear() === currentYear &&
                date.getMonth() === currentMonth - 1
            ) {
                buyersLastMonth.add(buyer);
            }
        });

        const growth =
            buyersLastMonth.size === 0
                ? 100
                : ((buyersThisMonth.size - buyersLastMonth.size) /
                      buyersLastMonth.size) *
                  100;

        // PDF
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

        doc.addFileToVFS("Vazir-Regular.ttf", vazirFont);
        doc.addFont("Vazir-Regular.ttf", "Vazir", "normal");
        doc.setFont("Vazir", "normal");

        doc.setFontSize(18);
        doc.text("Sales & Purchase Report", 105, 20, {
            align: "center"
        });

        doc.setFontSize(12);
        doc.text(
            `Report Date: ${new Date().toLocaleDateString("en-US")}`,
            105,
            30,
            { align: "center" }
        );

        const sellerTable = Object.entries(sellerSales).map(
            ([seller, total]) => [
                seller,
                total.toLocaleString("en-US")
            ]
        );

        const customerTable = Object.entries(customerPurchases).map(
            ([company, total]) => [
                company,
                total.toLocaleString("en-US")
            ]
        );

        autoTable(doc, {
            startY: 40,
            head: [["Seller", "Sales Amount"]],
            body: sellerTable,
            styles: {
                font: "Vazir",
                fontStyle: "normal",
                halign: "right"
            },
            headStyles: {
                font: "Vazir",
                fontStyle: "normal",
                halign: "center"
            },
            theme: "grid"
        });

        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 10,
            head: [["Company", "Purchase Amount"]],
            body: customerTable,
            styles: {
                font: "Vazir",
                fontStyle: "normal",
                halign: "right"
            },
            headStyles: {
                font: "Vazir",
                fontStyle: "normal",
                fillColor: [41, 128, 185],
                textColor: 255,
                halign: "center"
            },
            theme: "grid"
        });

        doc.setFontSize(14);

        const growthText =
            growth >= 0
                ? `${growth.toFixed(1)}% increase in buyers compared to last month`
                : `${Math.abs(growth).toFixed(1)}% decrease in buyers compared to last month`;

        doc.text(growthText, 105, doc.lastAutoTable.finalY + 15, {
            align: "center"
        });

        const pdfBuffer = doc.output("arraybuffer");

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=report.pdf"
        );

        res.send(Buffer.from(pdfBuffer));
    } catch (error) {
        console.error(error);

        res.status(500).json(
            createResponseMessageClass(
                null,
                true,
                translations.errorGeneratingChart
            )
        );
    }
};