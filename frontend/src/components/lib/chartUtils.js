// Robust type detection
export const detectDataType = (value) => {
    if (value === null || value === undefined || value === "") return "string";
    if (typeof value === "boolean") return "boolean";
    if (typeof value === "number" && Number.isFinite(value)) return "number";
    const s = String(value).trim();
    if (s === "") return "string";
    if (!Number.isNaN(Number(s))) return "number";
    if (!isNaN(Date.parse(s))) return "date";
    return "string";
};

// Normalize values for consistency
export const normalizeCellForType = (v, t) => {
    if (v === null || v === undefined) {
        if (t === "number") return 0;
        if (t === "boolean") return false;
        return "";
    }
    if (t === "number") {
        if (typeof v === "number") return v;
        return Number(v) || 0;
    }
    if (t === "boolean") {
        if (typeof v === "boolean") return v;
        return v === "true" || v === "1";
    }
    if (t === "date") {
        if (v instanceof Date) return v.toISOString().slice(0, 10);
        return new Date(v).toISOString().slice(0, 10) || "";
    }
    return String(v);
};

// Generate initial columns
export const generateInitialColumns = (dataTypeEditors, dataTypeFormatters, ActionCellRenderer) => [
    { key: "Item", name: "Item", dataType: "string", editable: false, headerAlign: "center", resizable: true, sortable: true, renderEditCell: dataTypeEditors.string, renderCell: dataTypeFormatters.string },
    { key: "Color", name: "Color", dataType: "string", editable: false, headerAlign: "center", resizable: true, sortable: true, renderEditCell: dataTypeEditors.string, renderCell: dataTypeFormatters.string },
    ...["24", "26", "28", "30", "32", "34", "36", "38", "40", "42", "44"].map((size) => ({
        key: size,
        name: size,
        dataType: "number",
        editable: true,
        headerAlign: "center",
        resizable: true,
        sortable: true,
        renderEditCell: dataTypeEditors.number,
        renderCell: dataTypeFormatters.number,
    })),
    { key: "actions", name: "Actions", headerAlign: "center", resizable: true, sortable: false, renderCell: ActionCellRenderer },
];

// Generate initial rows
export const generateInitialRows = (orderTypes, orderColors) => {
    const types = orderTypes.length > 0 ? orderTypes : ["Pant", "Shirt"];
    const colors = orderColors.length > 0 ? orderColors : ["Blue", "White"];

    return types.flatMap((type) =>
        colors.map((color, idx) => ({
            Item: type,
            Color: color,
            24: 0,
            26: 0,
            28: 0,
            30: 0,
            32: 0,
            34: 0,
            36: 0,
            38: 0,
            40: 0,
            42: 0,
            44: 0,
            __index: idx,
        }))
    );
};