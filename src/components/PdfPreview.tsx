import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTechSpec } from "@/context/TechSpecContext";
import { generatePDFBlob } from "@/lib/pdf-utils";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, EyeOff } from "lucide-react";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up the worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const REFRESH_COOLDOWN = 3000; // 3 seconds

interface PdfPreviewProps {
    isVisible: boolean;
    onToggleVisibility: () => void;
}

export const PdfPreview: React.FC<PdfPreviewProps> = ({
    isVisible,
    onToggleVisibility,
}) => {
    const { data } = useTechSpec();
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [numPages, setNumPages] = useState<number>(0);
    const [containerWidth, setContainerWidth] = useState<number>(0);

    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastRefreshTimeRef = useRef<number>(0);
    const previousUrlRef = useRef<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Update container width on resize
    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                // Subtract some padding to avoid scrollbars if possible, or just use exact width
                setContainerWidth(entry.contentRect.width - 32); // 32px padding roughly
            }
        });

        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, [isVisible]);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
    }

    // Generate PDF and update preview
    const generatePreview = useCallback(async () => {
        setIsLoading(true);
        lastRefreshTimeRef.current = Date.now();

        try {
            const blob = await generatePDFBlob(data);
            const url = URL.createObjectURL(blob);

            // Clean up previous URL
            if (previousUrlRef.current) {
                URL.revokeObjectURL(previousUrlRef.current);
            }

            previousUrlRef.current = url;
            setPdfUrl(url);
        } catch (error) {
            console.error("Error generating PDF preview:", error);
        } finally {
            setIsLoading(false);
        }
    }, [data]);

    // Manual refresh button handler
    const handleManualRefresh = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        generatePreview();
    };

    // Effect to throttle data changes
    useEffect(() => {
        if (!isVisible) return;

        // Clear existing timer
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        const now = Date.now();
        const timeSinceLast = now - lastRefreshTimeRef.current;

        if (timeSinceLast >= REFRESH_COOLDOWN) {
            generatePreview();
        } else {
            const wait = REFRESH_COOLDOWN - timeSinceLast;
            timeoutRef.current = setTimeout(() => {
                generatePreview();
            }, wait);
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [data, isVisible, generatePreview]);

    // Initial generation when becoming visible
    useEffect(() => {
        if (isVisible && !pdfUrl && !isLoading && lastRefreshTimeRef.current === 0) {
            generatePreview();
        }
    }, [isVisible, pdfUrl, isLoading, generatePreview]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (previousUrlRef.current) {
                URL.revokeObjectURL(previousUrlRef.current);
            }
        };
    }, []);

    // When not visible, don't render anything (visibility controlled by ControlSidebar)
    if (!isVisible) {
        return null;
    }

    return (
        <div className="pdf-preview-panel" ref={containerRef}>
            <div className="pdf-preview-content relative h-full flex flex-col">
                {/* Floating controls on the right */}
                <div className="pdf-preview-controls absolute top-2 right-4 z-10 flex gap-2">
                    {isLoading && (
                        <span className="pdf-preview-countdown bg-background/80 px-2 py-1 rounded text-xs font-mono flex items-center shadow-sm border">
                            <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
                            Updating...
                        </span>
                    )}
                    <Button
                        variant="secondary"
                        size="icon"
                        onClick={handleManualRefresh}
                        disabled={isLoading}
                        title="Refresh now"
                        className="h-8 w-8 shadow-sm border bg-background/80 backdrop-blur-sm"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="secondary"
                        size="icon"
                        onClick={onToggleVisibility}
                        title="Hide preview"
                        className="h-8 w-8 shadow-sm border bg-background/80 backdrop-blur-sm"
                    >
                        <EyeOff className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                    {pdfUrl ? (
                        <Document
                            file={pdfUrl}
                            onLoadSuccess={onDocumentLoadSuccess}
                            loading={
                                <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                    Loading PDF...
                                </div>
                            }
                            error={
                                <div className="text-red-500 p-4 text-center">
                                    Failed to load PDF preview.
                                </div>
                            }
                            className="flex flex-col items-center gap-4"
                        >
                            {Array.from(new Array(numPages), (_, index) => (
                                <div key={`page_${index + 1}`} className="shadow-lg">
                                    <Page
                                        pageNumber={index + 1}
                                        width={Math.max(containerWidth, 200)} // Ensure min width
                                        renderTextLayer={false}
                                        renderAnnotationLayer={false}
                                        className="bg-white"
                                    />
                                </div>
                            ))}
                        </Document>
                    ) : (
                        !isLoading && (
                            <div className="pdf-preview-empty h-full flex flex-col items-center justify-center text-muted-foreground">
                                <p className="mb-4">No preview available</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleManualRefresh}
                                >
                                    Generate Preview
                                </Button>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default PdfPreview;
