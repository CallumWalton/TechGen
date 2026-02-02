import React, { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useTechSpec } from "@/context/TechSpecContext";
import type { LightingPatchRow, TableColumn } from "@/types";
import { Plus, Trash2, X, RefreshCw } from "lucide-react";

const generateId = () => Math.random().toString(36).substring(2, 11);

export const LightingPatchListSection: React.FC = () => {
    const { data, updateLightingPatchList } = useTechSpec();
    const { lightingPatchList } = data;

    const [newColumnName, setNewColumnName] = useState("");
    const [newColumnType, setNewColumnType] = useState<TableColumn["dataType"]>("text");
    const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);

    // Collect all LIGHTING sources from Section 2 and Section 3
    const availableSources = useMemo(() => {
        const sources: { value: string; label: string; section: string }[] = [];

        data.whatYouBring.rows.forEach((row) => {
            const itemName = row.data["item-name"];
            const category = row.data["category"];
            // Only include lighting items
            if (itemName && typeof itemName === "string" && itemName.trim() && category === "lighting") {
                sources.push({
                    value: `bring-${row.id}`,
                    label: itemName.trim(),
                    section: "What You Bring",
                });
            }
        });

        data.venueNeeds.rows.forEach((row) => {
            const itemName = row.data["item-name"];
            const category = row.data["category"];
            // Only include lighting items
            if (itemName && typeof itemName === "string" && itemName.trim() && category === "lighting") {
                sources.push({
                    value: `venue-${row.id}`,
                    label: itemName.trim(),
                    section: "Venue Needs",
                });
            }
        });

        return sources;
    }, [data.whatYouBring, data.venueNeeds]);

    // Auto-populate from bring/needs - adds new lighting items that aren't already in the patch list
    const autoPopulateFromSources = useCallback(() => {
        const existingSources = new Set(lightingPatchList.rows.map(r => r.source));
        const newRows: LightingPatchRow[] = [];
        let maxChannel = lightingPatchList.rows.reduce((max, row) => Math.max(max, row.channelNumber), 0);

        availableSources.forEach((source) => {
            if (!existingSources.has(source.value)) {
                maxChannel++;
                newRows.push({
                    id: generateId(),
                    channelNumber: maxChannel,
                    source: source.value,
                    fixtureType: "",
                    dmxAddress: "",
                    universe: 1,
                    notes: "",
                    extraData: lightingPatchList.columns.reduce(
                        (acc, col) => {
                            acc[col.id] = col.dataType === "checkbox" ? false : col.dataType === "numeric" ? 0 : "";
                            return acc;
                        },
                        {} as Record<string, string | number | boolean>
                    ),
                });
            }
        });

        if (newRows.length > 0) {
            updateLightingPatchList({ ...lightingPatchList, rows: [...lightingPatchList.rows, ...newRows] });
        }
    }, [lightingPatchList, availableSources, updateLightingPatchList]);

    const addRow = useCallback(() => {
        const maxChannel = lightingPatchList.rows.reduce((max, row) => Math.max(max, row.channelNumber), 0);
        const newRow: LightingPatchRow = {
            id: generateId(),
            channelNumber: maxChannel + 1,
            source: "",
            fixtureType: "",
            dmxAddress: "",
            universe: 1,
            notes: "",
            extraData: lightingPatchList.columns.reduce(
                (acc, col) => {
                    acc[col.id] = col.dataType === "checkbox" ? false : col.dataType === "numeric" ? 0 : "";
                    return acc;
                },
                {} as Record<string, string | number | boolean>
            ),
        };
        updateLightingPatchList({ ...lightingPatchList, rows: [...lightingPatchList.rows, newRow] });
    }, [lightingPatchList, updateLightingPatchList]);

    const removeRow = useCallback(
        (rowId: string) => {
            updateLightingPatchList({ ...lightingPatchList, rows: lightingPatchList.rows.filter((r) => r.id !== rowId) });
        },
        [lightingPatchList, updateLightingPatchList]
    );

    const addColumn = useCallback(() => {
        if (!newColumnName.trim()) return;
        const newColumn: TableColumn = {
            id: generateId(),
            name: newColumnName.trim(),
            dataType: newColumnType,
        };
        const updatedRows = lightingPatchList.rows.map((row) => ({
            ...row,
            extraData: {
                ...row.extraData,
                [newColumn.id]: newColumnType === "checkbox" ? false : newColumnType === "numeric" ? 0 : "",
            },
        }));
        updateLightingPatchList({ columns: [...lightingPatchList.columns, newColumn], rows: updatedRows });
        setNewColumnName("");
        setNewColumnType("text");
        setIsAddColumnOpen(false);
    }, [lightingPatchList, updateLightingPatchList, newColumnName, newColumnType]);

    const removeColumn = useCallback(
        (columnId: string) => {
            const updatedColumns = lightingPatchList.columns.filter((c) => c.id !== columnId);
            const updatedRows = lightingPatchList.rows.map((row) => {
                const { [columnId]: _, ...restData } = row.extraData;
                return { ...row, extraData: restData };
            });
            updateLightingPatchList({ columns: updatedColumns, rows: updatedRows });
        },
        [lightingPatchList, updateLightingPatchList]
    );

    const updateRowField = useCallback(
        (rowId: string, field: keyof LightingPatchRow, value: string | number) => {
            updateLightingPatchList({
                ...lightingPatchList,
                rows: lightingPatchList.rows.map((row) =>
                    row.id === rowId ? { ...row, [field]: value } : row
                ),
            });
        },
        [lightingPatchList, updateLightingPatchList]
    );

    const updateExtraData = useCallback(
        (rowId: string, columnId: string, value: string | number | boolean) => {
            updateLightingPatchList({
                ...lightingPatchList,
                rows: lightingPatchList.rows.map((row) =>
                    row.id === rowId
                        ? { ...row, extraData: { ...row.extraData, [columnId]: value } }
                        : row
                ),
            });
        },
        [lightingPatchList, updateLightingPatchList]
    );

    const renderExtraCell = (row: LightingPatchRow, column: TableColumn) => {
        const value = row.extraData[column.id];

        switch (column.dataType) {
            case "checkbox":
                return (
                    <input
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={(e) => updateExtraData(row.id, column.id, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                );
            case "numeric":
                return (
                    <Input
                        type="number"
                        value={value as number}
                        onChange={(e) => updateExtraData(row.id, column.id, parseFloat(e.target.value) || 0)}
                        className="h-8 w-full"
                    />
                );
            default:
                return (
                    <Input
                        type="text"
                        value={value as string}
                        onChange={(e) => updateExtraData(row.id, column.id, e.target.value)}
                        className="h-8 w-full"
                    />
                );
        }
    };

    const getSourceLabel = (sourceValue: string) => {
        const source = availableSources.find((s) => s.value === sourceValue);
        return source ? source.label : sourceValue;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">Lighting Patch List</CardTitle>
                <CardDescription>
                    Define your lighting channels and DMX configuration for lighting equipment.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                    <Button
                        onClick={addRow}
                        size="sm"
                        variant="default"
                        disabled={availableSources.length === 0}
                        title={availableSources.length === 0 ? "Add lighting gear in Section 2 or 3 first" : undefined}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Fixture
                    </Button>
                    <Button
                        onClick={autoPopulateFromSources}
                        size="sm"
                        variant="secondary"
                        disabled={availableSources.length === 0}
                        title={availableSources.length === 0 ? "Add lighting gear in Section 2 or 3 first" : undefined}
                    >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Auto-Populate
                    </Button>
                    <Dialog open={isAddColumnOpen} onOpenChange={setIsAddColumnOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                                <Plus className="h-4 w-4 mr-1" />
                                Add Column
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Column</DialogTitle>
                                <DialogDescription>
                                    Create a new column with a name and data type.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="lighting-column-name">Column Name</Label>
                                    <Input
                                        id="lighting-column-name"
                                        value={newColumnName}
                                        onChange={(e) => setNewColumnName(e.target.value)}
                                        placeholder="Enter column name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lighting-column-type">Data Type</Label>
                                    <Select value={newColumnType} onValueChange={(v) => setNewColumnType(v as TableColumn["dataType"])}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="text">Text</SelectItem>
                                            <SelectItem value="numeric">Numeric</SelectItem>
                                            <SelectItem value="checkbox">Checkbox</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddColumnOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={addColumn} disabled={!newColumnName.trim()}>
                                    Add Column
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="w-20">Ch #</TableHead>
                                    <TableHead className="min-w-[150px]">Source</TableHead>
                                    <TableHead className="min-w-[120px]">Fixture Type</TableHead>
                                    <TableHead className="w-20">Universe</TableHead>
                                    <TableHead className="w-28">DMX Address</TableHead>
                                    <TableHead className="min-w-[150px]">Notes</TableHead>
                                    {lightingPatchList.columns.map((column) => (
                                        <TableHead key={column.id} className="relative group">
                                            <div className="flex items-center gap-2">
                                                <span>{column.name}</span>
                                                <span className="text-xs text-muted-foreground capitalize">
                                                    ({column.dataType})
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => removeColumn(column.id)}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </TableHead>
                                    ))}
                                    <TableHead className="w-12">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {lightingPatchList.rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7 + lightingPatchList.columns.length}
                                            className="text-center text-muted-foreground py-8"
                                        >
                                            No lighting fixtures yet. Click "Add Fixture" or "Auto-Populate" to get started.
                                            {availableSources.length === 0 && (
                                                <span className="block mt-1 text-amber-600">
                                                    Add lighting items in "What You Bring" or "Venue Needs" sections first.
                                                </span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    lightingPatchList.rows.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    value={row.channelNumber}
                                                    onChange={(e) =>
                                                        updateRowField(row.id, "channelNumber", parseInt(e.target.value) || 0)
                                                    }
                                                    className="h-8 w-16"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={row.source}
                                                    onValueChange={(v) => updateRowField(row.id, "source", v)}
                                                >
                                                    <SelectTrigger className="h-8">
                                                        <SelectValue placeholder="Select source">
                                                            {row.source ? getSourceLabel(row.source) : "Select source"}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableSources.length === 0 ? (
                                                            <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                                                                Add lighting items in Section 2 or 3 first
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {availableSources
                                                                    .filter((s) => s.section === "What You Bring")
                                                                    .length > 0 && (
                                                                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                                                                            What You Bring
                                                                        </div>
                                                                    )}
                                                                {availableSources
                                                                    .filter((s) => s.section === "What You Bring")
                                                                    .map((source) => (
                                                                        <SelectItem key={source.value} value={source.value}>
                                                                            {source.label}
                                                                        </SelectItem>
                                                                    ))}
                                                                {availableSources
                                                                    .filter((s) => s.section === "Venue Needs")
                                                                    .length > 0 && (
                                                                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                                                                            Venue Needs
                                                                        </div>
                                                                    )}
                                                                {availableSources
                                                                    .filter((s) => s.section === "Venue Needs")
                                                                    .map((source) => (
                                                                        <SelectItem key={source.value} value={source.value}>
                                                                            {source.label}
                                                                        </SelectItem>
                                                                    ))}
                                                            </>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={row.fixtureType}
                                                    onChange={(e) => updateRowField(row.id, "fixtureType", e.target.value)}
                                                    className="h-8"
                                                    placeholder="e.g., PAR64"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    value={row.universe}
                                                    onChange={(e) =>
                                                        updateRowField(row.id, "universe", parseInt(e.target.value) || 1)
                                                    }
                                                    className="h-8 w-16"
                                                    min={1}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={row.dmxAddress}
                                                    onChange={(e) => updateRowField(row.id, "dmxAddress", e.target.value)}
                                                    className="h-8"
                                                    placeholder="e.g., 1-12"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={row.notes}
                                                    onChange={(e) => updateRowField(row.id, "notes", e.target.value)}
                                                    className="h-8"
                                                    placeholder="Notes..."
                                                />
                                            </TableCell>
                                            {lightingPatchList.columns.map((column) => (
                                                <TableCell key={column.id}>{renderExtraCell(row, column)}</TableCell>
                                            ))}
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => removeRow(row.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default LightingPatchListSection;
