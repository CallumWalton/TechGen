import React, { useCallback, useRef, useMemo, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    ListOrdered,
    Link as LinkIcon,
    Image as ImageIcon,
    Heading2,
    Undo,
    Redo,
    Maximize2,
    Minimize2,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Trash2,
} from "lucide-react";

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    maxWords?: number;
    placeholder?: string;
    className?: string;
    minHeight?: string;
}

// Custom Image extension with size and alignment support
const CustomImage = Image.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            width: {
                default: null,
                parseHTML: (element) => element.getAttribute("width") || element.style.width?.replace("px", ""),
                renderHTML: (attributes) => {
                    if (!attributes.width) return {};
                    return { width: attributes.width, style: `width: ${attributes.width}px` };
                },
            },
            align: {
                default: "left",
                parseHTML: (element) => element.getAttribute("data-align") || "left",
                renderHTML: (attributes) => {
                    const align = attributes.align || "left";
                    let style = "";
                    if (align === "center") {
                        style = "display: block; margin-left: auto; margin-right: auto;";
                    } else if (align === "right") {
                        style = "display: block; margin-left: auto;";
                    }
                    return { "data-align": align, style };
                },
            },
        };
    },
});

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    maxWords,
    placeholder = "Start typing...",
    className,
    minHeight = "150px",
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImageSelected, setIsImageSelected] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [2, 3],
                },
            }),
            Underline,
            CustomImage.configure({
                inline: false,
                allowBase64: true,
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-primary underline",
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            if (html === "<p></p>") {
                onChange("");
            } else {
                onChange(html);
            }
        },
        onSelectionUpdate: ({ editor }) => {
            setIsImageSelected(editor.isActive("image"));
        },
        editorProps: {
            attributes: {
                class: cn(
                    "prose prose-sm dark:prose-invert max-w-none focus:outline-none",
                    "min-h-[100px] px-3 py-2"
                ),
                style: `min-height: ${minHeight}`,
            },
        },
    });

    // Calculate word count from text content
    const wordCount = useMemo(() => {
        if (!editor) return 0;
        const text = editor.getText().trim();
        if (!text) return 0;
        return text.split(/\s+/).filter((word) => word.length > 0).length;
    }, [editor?.getText()]);

    const isOverLimit = maxWords !== undefined && wordCount > maxWords;

    const handleImageUpload = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file || !editor) return;

            if (!file.type.startsWith("image/")) {
                alert("Please upload an image file");
                return;
            }

            if (file.size > 2 * 1024 * 1024) {
                alert("Image size must be less than 2MB");
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result as string;
                // Create image to get dimensions
                const img = document.createElement("img");
                img.onload = () => {
                    // Default to 200px width, scaled proportionally
                    const defaultWidth = Math.min(200, img.naturalWidth);
                    editor.chain().focus().setImage({ src: base64, width: defaultWidth }).run();
                };
                img.src = base64;
            };
            reader.readAsDataURL(file);

            e.target.value = "";
        },
        [editor]
    );

    const handleAddLink = useCallback(() => {
        if (!editor) return;

        const previousUrl = editor.getAttributes("link").href;
        const url = window.prompt("Enter URL:", previousUrl || "https://");

        if (url === null) return;

        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }

        editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: url })
            .run();
    }, [editor]);

    // Image manipulation functions
    const setImageSize = useCallback(
        (size: "small" | "medium" | "large") => {
            if (!editor) return;
            const sizeMap = { small: 100, medium: 200, large: 350 };
            editor.chain().focus().updateAttributes("image", { width: sizeMap[size] }).run();
        },
        [editor]
    );

    const setImageAlign = useCallback(
        (align: "left" | "center" | "right") => {
            if (!editor) return;
            editor.chain().focus().updateAttributes("image", { align }).run();
        },
        [editor]
    );

    const deleteImage = useCallback(() => {
        if (!editor) return;
        editor.chain().focus().deleteSelection().run();
    }, [editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className={cn("space-y-2", className)}>
            {/* Main Toolbar */}
            <div className="flex flex-wrap gap-1 p-1 border rounded-md bg-muted/30">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={cn("h-8 w-8 p-0", editor.isActive("bold") && "bg-muted")}
                    title="Bold (Ctrl+B)"
                >
                    <Bold className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={cn("h-8 w-8 p-0", editor.isActive("italic") && "bg-muted")}
                    title="Italic (Ctrl+I)"
                >
                    <Italic className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={cn("h-8 w-8 p-0", editor.isActive("underline") && "bg-muted")}
                    title="Underline (Ctrl+U)"
                >
                    <UnderlineIcon className="h-4 w-4" />
                </Button>

                <div className="w-px bg-border mx-1" />

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={cn("h-8 w-8 p-0", editor.isActive("heading", { level: 2 }) && "bg-muted")}
                    title="Heading"
                >
                    <Heading2 className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={cn("h-8 w-8 p-0", editor.isActive("bulletList") && "bg-muted")}
                    title="Bullet List"
                >
                    <List className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={cn("h-8 w-8 p-0", editor.isActive("orderedList") && "bg-muted")}
                    title="Numbered List"
                >
                    <ListOrdered className="h-4 w-4" />
                </Button>

                <div className="w-px bg-border mx-1" />

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAddLink}
                    className={cn("h-8 w-8 p-0", editor.isActive("link") && "bg-muted")}
                    title="Add Link"
                >
                    <LinkIcon className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleImageUpload}
                    className="h-8 w-8 p-0"
                    title="Insert Image"
                >
                    <ImageIcon className="h-4 w-4" />
                </Button>

                <div className="w-px bg-border mx-1" />

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    className="h-8 w-8 p-0"
                    title="Undo"
                >
                    <Undo className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    className="h-8 w-8 p-0"
                    title="Redo"
                >
                    <Redo className="h-4 w-4" />
                </Button>
            </div>

            {/* Image Controls Toolbar - appears when image is selected */}
            {isImageSelected && (
                <div className="flex flex-wrap items-center gap-2 p-2 border rounded-md bg-blue-50 dark:bg-blue-950">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300 mr-2">
                        Image:
                    </span>

                    {/* Size controls */}
                    <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">Size:</span>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setImageSize("small")}
                            className="h-7 px-2 text-xs"
                        >
                            <Minimize2 className="h-3 w-3 mr-1" />
                            S
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setImageSize("medium")}
                            className="h-7 px-2 text-xs"
                        >
                            M
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setImageSize("large")}
                            className="h-7 px-2 text-xs"
                        >
                            <Maximize2 className="h-3 w-3 mr-1" />
                            L
                        </Button>
                    </div>

                    <div className="w-px h-6 bg-border mx-1" />

                    {/* Alignment controls */}
                    <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">Align:</span>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setImageAlign("left")}
                            className="h-7 w-7 p-0"
                            title="Align Left"
                        >
                            <AlignLeft className="h-3 w-3" />
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setImageAlign("center")}
                            className="h-7 w-7 p-0"
                            title="Align Center"
                        >
                            <AlignCenter className="h-3 w-3" />
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setImageAlign("right")}
                            className="h-7 w-7 p-0"
                            title="Align Right"
                        >
                            <AlignRight className="h-3 w-3" />
                        </Button>
                    </div>

                    <div className="w-px h-6 bg-border mx-1" />

                    {/* Delete button */}
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={deleteImage}
                        className="h-7 px-2 text-xs"
                    >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove
                    </Button>
                </div>
            )}

            {/* Hidden file input for image upload */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />

            {/* Editor */}
            <div
                className={cn(
                    "border rounded-md overflow-hidden",
                    "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
                    isOverLimit && "border-destructive focus-within:ring-destructive"
                )}
            >
                <EditorContent editor={editor} />
            </div>

            {/* Word count */}
            {maxWords !== undefined && (
                <div
                    className={cn(
                        "text-sm text-muted-foreground text-right",
                        isOverLimit && "text-destructive font-medium"
                    )}
                >
                    {wordCount} / {maxWords} words
                </div>
            )}
        </div>
    );
};

export default RichTextEditor;
