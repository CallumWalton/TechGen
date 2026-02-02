import React, { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import type { SendListRow, TableColumn } from "@/types";
import { DEFAULT_TAGS } from "@/types";
import { Plus, Trash2, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const generateId = () => Math.random().toString(36).substring(2, 11);

export const SendListSection: React.FC = () => {
    const { data, updateSendList } = useTechSpec();
    const { sendList } = data;

    const [newColumnName, setNewColumnName] = useState("");
    const [newColumnType, setNewColumnType] = useState<TableColumn["dataType"]>("text");
    const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);

    // Collect all AUDIO sources from Section 2 and Section 3
    const availableSources = useMemo(() => {
        const sources: { value: string; label: string; section: string }[] = [];

        data.whatYouBring.rows.forEach((row) => {
            const itemName = row.data["item-name"];
            const category = row.data["category"];
            // Only include audio items (or items without category when lighting is not enabled)
            if (itemName && typeof itemName === "string" && itemName.trim()) {
                if (!data.hasBringingLighting || category === "audio" || !category) {
                    sources.push({
                        value: `bring-${row.id}`,
                        label: itemName.trim(),
                        section: "What You Bring",
                    });
                }
            }
        });

        data.venueNeeds.rows.forEach((row) => {
            const itemName = row.data["item-name"];
            const category = row.data["category"];
            // Only include audio items (or items without category when lighting is not enabled)
            if (itemName && typeof itemName === "string" && itemName.trim()) {
                if (!data.hasBringingLighting || category === "audio" || !category) {
                    sources.push({
                        value: `venue-${row.id}`,
                        label: itemName.trim(),
                        section: "Venue Needs",
                    });
                }
            }
        });

        return sources;
    }, [data.whatYouBring, data.venueNeeds, data.hasBringingLighting]);

    // Auto-populate from bring/needs - adds new audio items that aren't already in the send list
    const autoPopulateFromSources = useCallback(() => {
        const existingSources = new Set(sendList.rows.map(r => r.source));
        const newRows: SendListRow[] = [];
        let maxChannel = sendList.rows.reduce((max, row) => Math.max(max, row.channelNumber), 0);

        availableSources.forEach((source) => {
            if (!existingSources.has(source.value)) {
                maxChannel++;
                newRows.push({
                    id: generateId(),
                    channelNumber: maxChannel,
                    source: source.value,
                    description: source.label,
                    tags: [],
                    fohOutput: false,
                    isStereo: false,
                    extraData: sendList.columns.reduce(
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
            updateSendList({ ...sendList, rows: [...sendList.rows, ...newRows] });
        }
    }, [sendList, availableSources, updateSendList]);

    const addRow = useCallback(() => {
        const maxChannel = sendList.rows.reduce((max, row) => Math.max(max, row.channelNumber), 0);
        const newRow: SendListRow = {
            id: generateId(),
            channelNumber: maxChannel + 1,
            source: "",
            description: "",
            tags: [],
            fohOutput: false,
            isStereo: false,
            extraData: sendList.columns.reduce(
                (acc, col) => {
                    acc[col.id] = col.dataType === "checkbox" ? false : col.dataType === "numeric" ? 0 : "";
                    return acc;
                },
                {} as Record<string, string | number | boolean>
            ),
        };
        updateSendList({ ...sendList, rows: [...sendList.rows, newRow] });
    }, [sendList, updateSendList]);

    const removeRow = useCallback(
        (rowId: string) => {
            updateSendList({ ...sendList, rows: sendList.rows.filter((r) => r.id !== rowId) });
        },
        [sendList, updateSendList]
    );

    const addColumn = useCallback(() => {
        if (!newColumnName.trim()) return;
        const newColumn: TableColumn = {
            id: generateId(),
            name: newColumnName.trim(),
            dataType: newColumnType,
        };
        const updatedRows = sendList.rows.map((row) => ({
            ...row,
            extraData: {
                ...row.extraData,
                [newColumn.id]: newColumnType === "checkbox" ? false : newColumnType === "numeric" ? 0 : "",
            },
        }));
        updateSendList({ columns: [...sendList.columns, newColumn], rows: updatedRows });
        setNewColumnName("");
        setNewColumnType("text");
        setIsAddColumnOpen(false);
    }, [sendList, updateSendList, newColumnName, newColumnType]);

    const removeColumn = useCallback(
        (columnId: string) => {
            const updatedColumns = sendList.columns.filter((c) => c.id !== columnId);
            const updatedRows = sendList.rows.map((row) => {
                const { [columnId]: _, ...restData } = row.extraData;
                return { ...row, extraData: restData };
            });
            updateSendList({ columns: updatedColumns, rows: updatedRows });
        },
        [sendList, updateSendList]
    );

    const updateRowField = useCallback(
        (rowId: string, field: keyof SendListRow, value: string | number | boolean) => {
            updateSendList({
                ...sendList,
                rows: sendList.rows.map((row) =>
                    row.id === rowId ? { ...row, [field]: value } : row
                ),
            });
        },
        [sendList, updateSendList]
    );

    const updateExtraData = useCallback(
        (rowId: string, columnId: string, value: string | number | boolean) => {
            updateSendList({
                ...sendList,
                rows: sendList.rows.map((row) =>
                    row.id === rowId
                        ? { ...row, extraData: { ...row.extraData, [columnId]: value } }
                        : row
                ),
            });
        },
        [sendList, updateSendList]
    );

    const toggleTag = useCallback(
        (rowId: string, tag: string) => {
            updateSendList({
                ...sendList,
                rows: sendList.rows.map((row) => {
                    if (row.id !== rowId) return row;
                    const hasTag = row.tags.includes(tag);
                    return {
                        ...row,
                        tags: hasTag ? row.tags.filter((t) => t !== tag) : [...row.tags, tag],
                    };
                }),
            });
        },
        [sendList, updateSendList]
    );

    const renderExtraCell = (row: SendListRow, column: TableColumn) => {
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
                <CardTitle className="text-2xl">Audio Send List</CardTitle>
                <CardDescription>
                    Define your audio channel outputs and map them to sources from your equipment and venue needs.
                    {data.hasBringingLighting && (
                        <span className="block mt-1 text-amber-600">
                            Only audio equipment is shown here. Lighting equipment appears in the Lighting Patch List.
                        </span>
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                    <Button
                        onClick={addRow}
                        size="sm"
                        variant="default"
                        disabled={availableSources.length === 0}
                        title={availableSources.length === 0 ? "Add audio gear in Section 2 or 3 first" : undefined}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Channel
                    </Button>
                    <Button
                        onClick={autoPopulateFromSources}
                        size="sm"
                        variant="secondary"
                        disabled={availableSources.length === 0}
                        title={availableSources.length === 0 ? "Add audio gear in Section 2 or 3 first" : undefined}
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
                                    <Label htmlFor="send-column-name">Column Name</Label>
                                    <Input
                                        id="send-column-name"
                                        value={newColumnName}
                                        onChange={(e) => setNewColumnName(e.target.value)}
                                        placeholder="Enter column name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="send-column-type">Data Type</Label>
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
                                    <TableHead className="w-24">Channel #</TableHead>
                                    <TableHead className="min-w-[200px]">Source</TableHead>
                                    <TableHead className="min-w-[200px]">Description</TableHead>
                                    <TableHead className="w-24 text-center bg-blue-50 dark:bg-blue-950">
                                        <div className="flex flex-col items-center">
                                            <span>FoH</span>
                                            <span className="text-xs text-muted-foreground">(locked)</span>
                                        </div>
                                    </TableHead>
                                    <TableHead className="w-24 text-center bg-purple-50 dark:bg-purple-950">
                                        <div className="flex flex-col items-center">
                                            <span>Stereo</span>
                                            <span className="text-xs text-muted-foreground">(2ch)</span>
                                        </div>
                                    </TableHead>
                                    {sendList.columns.map((column) => (
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
                                    <TableHead>Tags</TableHead>
                                    <TableHead className="w-12">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sendList.rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6 + sendList.columns.length}
                                            className="text-center text-muted-foreground py-8"
                                        >
                                            No channels yet. Click "Add Channel" or "Auto-Populate" to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sendList.rows.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Input
                                                        type="number"
                                                        value={row.channelNumber}
                                                        onChange={(e) =>
                                                            updateRowField(row.id, "channelNumber", parseInt(e.target.value) || 0)
                                                        }
                                                        className="h-8 w-16"
                                                        title={row.isStereo ? "Left channel" : "Channel number"}
                                                    />
                                                    {row.isStereo && (
                                                        <>
                                                            <span className="text-muted-foreground">-</span>
                                                            <Input
                                                                type="number"
                                                                value={row.channelNumber2 ?? (row.channelNumber + 1)}
                                                                onChange={(e) =>
                                                                    updateRowField(row.id, "channelNumber2", parseInt(e.target.value) || 0)
                                                                }
                                                                className="h-8 w-16"
                                                                title="Right channel"
                                                            />
                                                        </>
                                                    )}
                                                </div>
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
                                                                Add audio items in Section 2 or 3 first
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
                                                    value={row.description}
                                                    onChange={(e) => updateRowField(row.id, "description", e.target.value)}
                                                    className="h-8"
                                                    placeholder="Enter description..."
                                                />
                                            </TableCell>
                                            <TableCell className="text-center bg-blue-50 dark:bg-blue-950">
                                                <input
                                                    type="checkbox"
                                                    checked={row.fohOutput}
                                                    onChange={(e) => updateRowField(row.id, "fohOutput", e.target.checked)}
                                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                />
                                            </TableCell>
                                            <TableCell className="text-center bg-purple-50 dark:bg-purple-950">
                                                <input
                                                    type="checkbox"
                                                    checked={row.isStereo}
                                                    onChange={(e) => updateRowField(row.id, "isStereo", e.target.checked)}
                                                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                                />
                                            </TableCell>
                                            {sendList.columns.map((column) => (
                                                <TableCell key={column.id}>{renderExtraCell(row, column)}</TableCell>
                                            ))}
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {DEFAULT_TAGS.map((tag) => (
                                                        <Badge
                                                            key={tag}
                                                            variant={row.tags.includes(tag) ? "default" : "outline"}
                                                            className={cn(
                                                                "cursor-pointer transition-colors text-xs",
                                                                row.tags.includes(tag)
                                                                    ? tag === "Essential"
                                                                        ? "bg-green-600 hover:bg-green-700"
                                                                        : "bg-amber-600 hover:bg-amber-700"
                                                                    : "hover:bg-muted"
                                                            )}
                                                            onClick={() => toggleTag(row.id, tag)}
                                                        >
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </TableCell>
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

export default SendListSection;
