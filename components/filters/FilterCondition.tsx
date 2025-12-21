"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";

// ==========================
// TYPES
// ==========================
export interface FilterConditionValue {
    field: string;
    operator: string;
    value: string | number | boolean;
}

interface FieldOption {
    name: string;
    label: string;
    type: "string" | "number" | "relation" | "date" | "boolean";
    relationConfig?: {
        fetchUrl: string;
        labelKey: string;
        valueKey: string;
    };
}

interface Props {
    index: number;
    value: FilterConditionValue;
    fields: FieldOption[];
    onChange: (value: FilterConditionValue) => void;
    onRemove: () => void;
}

// ==========================
// COMPONENT
// ==========================
export function FilterCondition({
    index,
    value,
    fields,
    onChange,
    onRemove,
}: Props) {
    const selectedField = fields.find((f) => f.name === value.field);

    // ==========================
    // RELATION STATE
    // ==========================
    const [relationOptions, setRelationOptions] = useState<
        { label: string; value: string | number }[]
    >([]);
    const [loadingRelation, setLoadingRelation] = useState(false);

    // ==========================
    // FETCH RELATION DATA
    // ==========================
    useEffect(() => {
        if (selectedField?.type !== "relation") return;
        if (!selectedField.relationConfig) return;

        let isMounted = true;
        setLoadingRelation(true);

        apiFetch(selectedField.relationConfig.fetchUrl)
            .then(async (res) => {
                const json = await res.json();
                const data = json.data ?? [];

                if (!isMounted) return;

                setRelationOptions(
                    data.map((item: any) => ({
                        label: item[selectedField.relationConfig!.labelKey],
                        value: item[selectedField.relationConfig!.valueKey],
                    }))
                );
            })
            .catch(() => {
                if (isMounted) setRelationOptions([]);
            })
            .finally(() => {
                if (isMounted) setLoadingRelation(false);
            });

        return () => {
            isMounted = false;
        };
    }, [selectedField]);

    // ==========================
    // OPERATOR PER TYPE
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
    // VALUE INPUT
    // ==========================
    const renderValueInput = () => {
        if (!selectedField) return null;

        switch (selectedField.type) {
            case "relation":
                return (
                    <Select
                        value={value.value?.toString() ?? ""}
                        onValueChange={(v) => handleChange("value", v)}
                        disabled={loadingRelation}
                    >
                        <SelectTrigger>
                            <SelectValue
                                placeholder={
                                    loadingRelation ? "Memuat data..." : `Pilih ${selectedField.label}`
                                }
                            />
                        </SelectTrigger>
                        <SelectContent>
                            {relationOptions.map((opt) => (
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

    // ==========================
    // RENDER
    // ==========================
    return (
        <div className="grid grid-cols-12 gap-2 items-center">
            {/* FIELD */}
            <div className="col-span-4">
                <Select
                    value={value.field}
                    onValueChange={(v) => {
                        const field = fields.find((f) => f.name === v);

                        const defaultOperatorMap: Record<string, string[]> = {
                            number: ["=", "!=", ">", "<", ">=", "<="],
                            string: ["contains", "not contains", "startsWith", "endsWith", "="],
                            relation: ["="],
                            boolean: ["="],
                            date: ["=", "!=", ">", "<", ">=", "<="],
                        };

                        const defaultOperator =
                            field && defaultOperatorMap[field.type]
                                ? defaultOperatorMap[field.type][0]
                                : "";

                        onChange({
                            field: v,
                            operator: defaultOperator,
                            value: "",
                        });
                    }}
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
            <div className="col-span-4">{renderValueInput()}</div>

            {/* REMOVE */}
            <div className="col-span-1 text-right">
                <button
                    onClick={onRemove}
                    className="text-red-500 hover:text-red-700"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}
