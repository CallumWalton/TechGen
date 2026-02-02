import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DynamicTableData, TableColumn, TableRow as TRow } from "@/types";
import { DEFAULT_TAGS } from "@/types";
import { Plus, Trash2, X } from "lucide-react";

interface DynamicTableProps {
    data: DynamicTableData;
    onChange: (data: DynamicTableData) => void;
    showTags?: boolean;
    showStereo?: boolean;
    className?: string;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

export const DynamicTable: React.FC<DynamicTableProps> = ({
    data,
    onChange,
    showTags = true,
    showStereo = false,
    className,
}) => {
    const [newColumnName, setNewColumnName] = useState("");
    const [newColumnType, setNewColumnType] = useState<TableColumn["dataType"]>("text");
    const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);

    const addRow = useCallback(() => {
        const newRow: TRow = {
            id: generateId(),
            data: data.columns.reduce(
                (acc, col) => {
                    acc[col.id] = col.dataType === "checkbox" ? false : col.dataType === "numeric" ? 0 : "";
                    return acc;
                },
                {} as Record<string, string | number | boolean>
            ),
            tags: [],
        };
        onChange({ ...data, rows: [...data.rows, newRow] });
    }, [data, onChange]);

    const removeRow = useCallback(
        (rowId: string) => {
            onChange({ ...data, rows: data.rows.filter((r) => r.id !== rowId) });
        },
        [data, onChange]
    );

    const addColumn = useCallback(() => {
        if (!newColumnName.trim()) return;
        const newColumn: TableColumn = {
            id: generateId(),
            name: newColumnName.trim(),
            dataType: newColumnType,
        };
        // Also update existing rows with default value for new column
        const updatedRows = data.rows.map((row) => ({
            ...row,
            data: {
                ...row.data,
                [newColumn.id]: newColumnType === "checkbox" ? false : newColumnType === "numeric" ? 0 : "",
            },
        }));
        onChange({ columns: [...data.columns, newColumn], rows: updatedRows });
        setNewColumnName("");
        setNewColumnType("text");
        setIsAddColumnOpen(false);
    }, [data, onChange, newColumnName, newColumnType]);

    const removeColumn = useCallback(
        (columnId: string) => {
            const updatedColumns = data.columns.filter((c) => c.id !== columnId);
            const updatedRows = data.rows.map((row) => {
                const { [columnId]: _, ...restData } = row.data;
                return { ...row, data: restData };
            });
            onChange({ columns: updatedColumns, rows: updatedRows });
        },
        [data, onChange]
    );

    const updateCellValue = useCallback(
        (rowId: string, columnId: string, value: string | number | boolean) => {
            onChange({
                ...data,
                rows: data.rows.map((row) =>
                    row.id === rowId ? { ...row, data: { ...row.data, [columnId]: value } } : row
                ),
            });
        },
        [data, onChange]
    );

    const toggleTag = useCallback(
        (rowId: string, tag: string) => {
            onChange({
                ...data,
                rows: data.rows.map((row) => {
                    if (row.id !== rowId) return row;
                    const hasTags = row.tags.includes(tag);
                    return {
                        ...row,
                        tags: hasTags ? row.tags.filter((t) => t !== tag) : [...row.tags, tag],
                    };
                }),
            });
        },
        [data, onChange]
    );

    const toggleStereo = useCallback(
        (rowId: string, isStereo: boolean) => {
            onChange({
                ...data,
                rows: data.rows.map((row) =>
                    row.id === rowId ? { ...row, isStereo } : row
                ),
            });
        },
        [data, onChange]
    );

    const renderCell = (row: TRow, column: TableColumn) => {
        const value = row.data[column.id];

        switch (column.dataType) {
            case "checkbox":
                return (
                    <input
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={(e) => updateCellValue(row.id, column.id, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                );
            case "numeric":
                return (
                    <Input
                        type="number"
                        value={value as number}
                        onChange={(e) => updateCellValue(row.id, column.id, parseFloat(e.target.value) || 0)}
                        className="h-8 w-full"
                    />
                );
            case "category":
                return (
                    <Select
                        value={(value as string) || "audio"}
                        onValueChange={(v) => updateCellValue(row.id, column.id, v)}
                    >
                        <SelectTrigger className="h-8 w-28">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="audio">Audio</SelectItem>
                            <SelectItem value="lighting">Lighting</SelectItem>
                        </SelectContent>
                    </Select>
                );
            default:
                return (
                    <Input
                        type="text"
                        value={value as string}
                        onChange={(e) => updateCellValue(row.id, column.id, e.target.value)}
                        className="h-8 w-full"
                    />
                );
        }
    };

    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex flex-wrap gap-2">
                <Button onClick={addRow} size="sm" variant="default">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Row
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
                                <Label htmlFor="column-name">Column Name</Label>
                                <Input
                                    id="column-name"
                                    value={newColumnName}
                                    onChange={(e) => setNewColumnName(e.target.value)}
                                    placeholder="Enter column name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="column-type">Data Type</Label>
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
                                {data.columns.map((column) => (
                                    <TableHead key={column.id} className="relative group">
                                        <div className="flex items-center gap-2">
                                            <span>{column.name}</span>
                                            <span className="text-xs text-muted-foreground capitalize">
                                                ({column.dataType})
                                            </span>
                                            {!column.isLocked && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => removeColumn(column.id)}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableHead>
                                ))}
                                {showStereo && (
                                    <TableHead className="w-24 text-center bg-purple-50 dark:bg-purple-950">
                                        <div className="flex flex-col items-center">
                                            <span>Stereo</span>
                                            <span className="text-xs text-muted-foreground">(2ch)</span>
                                        </div>
                                    </TableHead>
                                )}
                                {showTags && <TableHead>Tags</TableHead>}
                                <TableHead className="w-12">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.rows.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={data.columns.length + (showStereo ? 1 : 0) + (showTags ? 2 : 1)}
                                        className="text-center text-muted-foreground py-8"
                                    >
                                        No items yet. Click "Add Row" to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.rows.map((row) => (
                                    <TableRow key={row.id}>
                                        {data.columns.map((column) => (
                                            <TableCell key={column.id}>{renderCell(row, column)}</TableCell>
                                        ))}
                                        {showStereo && (
                                            <TableCell className="text-center bg-purple-50 dark:bg-purple-950">
                                                <input
                                                    type="checkbox"
                                                    checked={row.isStereo || false}
                                                    onChange={(e) => toggleStereo(row.id, e.target.checked)}
                                                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                                />
                                            </TableCell>
                                        )}
                                        {showTags && (
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {DEFAULT_TAGS.map((tag) => (
                                                        <Badge
                                                            key={tag}
                                                            variant={row.tags.includes(tag) ? "default" : "outline"}
                                                            className={cn(
                                                                "cursor-pointer transition-colors",
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
                                        )}
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
        </div>
    );
};

export default DynamicTable;
