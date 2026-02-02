import React, { useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/RichTextEditor";
import { useTechSpec } from "@/context/TechSpecContext";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const BandPlotSection: React.FC = () => {
    const { data, updateBandPlotImage, updateStagePlotDescription, updateFooterNotes } = useTechSpec();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            // Check if it's an image
            if (!file.type.startsWith("image/")) {
                alert("Please upload an image file");
                return;
            }

            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert("Image size must be less than 5MB");
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result as string;
                updateBandPlotImage(base64);
            };
            reader.readAsDataURL(file);
        },
        [updateBandPlotImage]
    );

    const handleRemoveImage = useCallback(() => {
        updateBandPlotImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }, [updateBandPlotImage]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();

            const file = e.dataTransfer.files?.[0];
            if (!file) return;

            if (!file.type.startsWith("image/")) {
                alert("Please upload an image file");
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                alert("Image size must be less than 5MB");
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result as string;
                updateBandPlotImage(base64);
            };
            reader.readAsDataURL(file);
        },
        [updateBandPlotImage]
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">Band Plot & Notes</CardTitle>
                <CardDescription>
                    Upload your stage plot and add any additional notes for the venue.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Image Upload Section */}
                <div className="space-y-2">
                    <Label>Stage Plot</Label>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                    />

                    {data.bandPlotImage ? (
                        <div className="relative border rounded-lg overflow-hidden bg-muted/20">
                            <div className="relative">
                                <img
                                    src={data.bandPlotImage}
                                    alt="Stage plot"
                                    className="w-full max-h-[500px] object-contain"
                                />
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-2 right-2"
                                    onClick={handleRemoveImage}
                                >
                                    <X className="h-4 w-4 mr-1" />
                                    Remove
                                </Button>
                            </div>
                            <div className="p-3 bg-muted/50 text-sm text-muted-foreground">
                                Click the "Replace" button or drag and drop a new image to change
                            </div>
                            <div className="flex justify-center pb-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="h-4 w-4 mr-1" />
                                    Replace Image
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div
                            className={cn(
                                "border-2 border-dashed rounded-lg p-12 text-center",
                                "hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer"
                            )}
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        >
                            <div className="flex flex-col items-center gap-3">
                                <div className="p-4 bg-muted rounded-full">
                                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-medium">Upload Stage Plot</p>
                                    <p className="text-sm text-muted-foreground">
                                        Click to browse or drag and drop an image
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        PNG, JPG, or GIF up to 5MB
                                    </p>
                                </div>
                                <Button variant="outline" size="sm">
                                    <Upload className="h-4 w-4 mr-1" />
                                    Choose File
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Stage Plot Description */}
                <div className="space-y-2">
                    <Label>Stage Plot Description</Label>
                    <Textarea
                        value={data.stagePlotDescription}
                        onChange={(e) => updateStagePlotDescription(e.target.value)}
                        placeholder="Describe the stage layout, positions of band members, equipment placement, etc..."
                        className="min-h-[100px]"
                    />
                </div>

                {/* Footer Notes Section */}
                <div className="space-y-2">
                    <Label>Footer Notes</Label>
                    <RichTextEditor
                        value={data.footerNotes}
                        onChange={updateFooterNotes}
                        placeholder="Add any additional notes, special requirements, or important information for the venue..."
                        minHeight="150px"
                    />
                </div>
            </CardContent>
        </Card>
    );
};

export default BandPlotSection;
