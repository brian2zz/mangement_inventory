"use client";

import { X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export interface FilterConditionValue {
    field: string;
    operator: string;
    value: string | number | boolean;
}

interface FieldOption {
    name: string;
    label: string;
    type: "string" | "number" | "relation" | "date" | "boolean";
    relationData?: { label: string; value: string | number }[];
}

interface Props {
    index: number;
    value: FilterConditionValue;
    fields: FieldOption[];
    onChange: (value: FilterConditionValue) => void;
    onRemove: () => void;
}

export function FilterCondition({ index, value, fields, onChange, onRemove }: Props) {
    const selectedField = fields.find((f) => f.name === value.field);

    // ==========================
    // OPERATOR LIST PER TIPE
    // ==========================
    const getOperators = () => {
        switch (selectedField?.type) {
            case "number":
                return ["=", "!=", ">", "<", ">=", "<="];
            case "string":
                return ["contains", "not contains", "startsWith", "endsWith", "="];
            case "relation":
                return ["="];
            case "boolean":
                return ["=", "!="];
            case "date":
                return ["=", "!=", ">", "<", ">=", "<="];
            default:
                return [];
        }
    };

    const handleChange = (key: keyof FilterConditionValue, val: any) => {
        onChange({ ...value, [key]: val });
    };

    // ==========================
    // DYNAMIC VALUE INPUT
    // ==========================
    const renderValueInput = () => {
        if (!selectedField) return null;

        switch (selectedField.type) {
            case "relation":
                return (
                    <Select
                        value={value.value?.toString() ?? ""}
                        onValueChange={(v) => handleChange("value", v)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Pilih nilai" />
                        </SelectTrigger>
                        <SelectContent>
                            {selectedField.relationData?.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value.toString()}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );

            case "boolean":
                return (
                    <Select
                        value={value.value?.toString() ?? ""}
                        onValueChange={(v) => handleChange("value", v === "true")}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Pilih" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="true">True</SelectItem>
                            <SelectItem value="false">False</SelectItem>
                        </SelectContent>
                    </Select>
                );

            case "date":
                return (
                    <Input
                        type="date"
                        value={value.value?.toString() ?? ""}
                        onChange={(e) => handleChange("value", e.target.value)}
                    />
                );

            case "number":
                return (
                    <Input
                        type="number"
                        value={value.value?.toString() ?? ""}
                        onChange={(e) => handleChange("value", Number(e.target.value))}
                    />
                );

            default:
                return (
                    <Input
                        type="text"
                        placeholder="Masukkan nilai"
                        value={value.value?.toString() ?? ""}
                        onChange={(e) => handleChange("value", e.target.value)}
                    />
                );
        }
    };

    return (
        <div className="grid grid-cols-12 gap-2 items-center">
            {/* FIELD */}
            <div className="col-span-4">
                <Select
                    value={value.field}
                    onValueChange={(v) =>
                        onChange({ field: v, operator: "", value: "" })
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih Field" />
                    </SelectTrigger>
                    <SelectContent>
                        {fields.map((f) => (
                            <SelectItem key={f.name} value={f.name}>
                                {f.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* OPERATOR */}
            <div className="col-span-3">
                <Select
                    value={value.operator}
                    onValueChange={(v) => handleChange("operator", v)}
                    disabled={!selectedField}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                        {getOperators().map((op) => (
                            <SelectItem key={op} value={op}>
                                {op}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* VALUE */}
            <div className="col-span-4">
                {renderValueInput()}
            </div>

            {/* REMOVE */}
            <div className="col-span-1 text-right">
                <button onClick={onRemove} className="text-red-500 hover:text-red-700">
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}
