import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { TechSpecData, PDFExportSettings, PDFFontFamily } from "@/types";
import { CONTACT_RESPONSIBILITIES, DEFAULT_PDF_SETTINGS } from "@/types";

// Font size constants
const FONTS = {
    title: 24,
    heading: 16,
    subheading: 14,
    body: 11,
    small: 9,
};

const MARGINS = {
    left: 20,
    right: 20,
    top: 25,
    bottom: 25,
};

// Minimum space needed before starting a new section on current page
const MIN_SECTION_SPACE = 60;

// Helper to convert hex color to RGB array
const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
        return [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16),
        ];
    }
    return [59, 130, 246]; // Default blue
};

// Generate colors from settings
const createColors = (settings: PDFExportSettings) => ({
    primary: hexToRgb(settings.primaryColor),
    accent: hexToRgb(settings.accentColor),
    text: [15, 23, 42] as [number, number, number],
    muted: [100, 116, 139] as [number, number, number],
    background: [248, 250, 252] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
    tableHeader: hexToRgb(settings.accentColor),
    tableAlt: [241, 245, 249] as [number, number, number],
});

interface PDFContext {
    doc: jsPDF;
    pageNumber: number;
    currentY: number; // Track current Y position
    currentPageTitle: string; // Track current page title for header
    bandName: string;
    bandLogo: string | null;
    isLandscape: boolean;
    settings: PDFExportSettings;
    colors: ReturnType<typeof createColors>;
    fontFamily: PDFFontFamily;
}

// Helper to get page dimensions
const getPageDimensions = (isLandscape: boolean) => ({
    width: isLandscape ? 297 : 210, // A4
    height: isLandscape ? 210 : 297,
    contentWidth: isLandscape ? 297 - MARGINS.left - MARGINS.right : 210 - MARGINS.left - MARGINS.right,
    contentHeight: isLandscape ? 210 - MARGINS.top - MARGINS.bottom : 297 - MARGINS.top - MARGINS.bottom,
});

// Get the maximum Y position before needing a new page
const getMaxY = (isLandscape: boolean) => {
    const dims = getPageDimensions(isLandscape);
    return dims.height - MARGINS.bottom - 15; // Leave room for footer
};

// Estimate table height based on number of rows
// Header: ~12mm, each row: ~8mm average (can vary with content wrapping)
const estimateTableHeight = (rowCount: number): number => {
    const headerHeight = 12;
    const rowHeight = 8;
    const padding = 20; // Extra padding for title and spacing
    return padding + headerHeight + (rowCount * rowHeight);
};

// Check if a table would likely span pages, and if so start a new page
const ensureTableFits = (ctx: PDFContext, rowCount: number, title: string): void => {
    const estimatedHeight = estimateTableHeight(rowCount);
    const remainingSpace = getMaxY(ctx.isLandscape) - ctx.currentY;

    // If table would use more than 70% of remaining space and wouldn't fit entirely,
    // start on a new page to avoid awkward page breaks
    const fitsOnCurrentPage = estimatedHeight <= remainingSpace;
    const wouldSpanPages = estimatedHeight > remainingSpace * 0.7 && !fitsOnCurrentPage;

    if (wouldSpanPages || remainingSpace < 80) {
        addNewPage(ctx, title, ctx.isLandscape);
    }
};

// Check if there's enough space for content, if not add a new page
const ensureSpace = (ctx: PDFContext, neededHeight: number, title: string): void => {
    const maxY = getMaxY(ctx.isLandscape);
    if (ctx.currentY + neededHeight > maxY) {
        addNewPage(ctx, title, ctx.isLandscape);
    }
};

// Add page header with optional logo
const addPageHeader = (ctx: PDFContext, title: string) => {
    const { doc, bandName, bandLogo, isLandscape, settings, colors, fontFamily } = ctx;
    const dims = getPageDimensions(isLandscape);

    // Header background
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, dims.width, 18, "F");

    let showBandNameText = true;

    // Add logo to header if enabled and available (on pages after cover)
    if (settings.showLogoOnAllPages && bandLogo && ctx.pageNumber > 1) {
        try {
            // Logo in center of header (12x12mm)
            const logoSize = 12;
            const logoX = (dims.width - logoSize) / 2;
            doc.addImage(bandLogo, "PNG", logoX, 3, logoSize, logoSize);
            // We moved logo to center, so we can keep the band name text on the left
            showBandNameText = true;
        } catch (e) {
            console.warn("Could not add logo to header:", e);
            showBandNameText = true;
        }
    }

    doc.setTextColor(...colors.white);
    doc.setFontSize(10);

    // Only show band name text if logo is not being used (OR if logo is centered)
    if (showBandNameText) {
        doc.setFont(fontFamily, "bold");
        doc.text(bandName || "Tech Spec", MARGINS.left, 12);
    }

    doc.setFont(fontFamily, "normal");
    doc.text(title, dims.width - MARGINS.right, 12, { align: "right" });

    doc.setTextColor(...colors.text);
};

// Add page footer
const addPageFooter = (ctx: PDFContext) => {
    const { doc, pageNumber, isLandscape, colors } = ctx;
    const dims = getPageDimensions(isLandscape);

    // Position footer within the bottom margin area to avoid being cut off
    const footerY = dims.height - MARGINS.bottom + 10;

    doc.setDrawColor(...colors.muted);
    doc.line(MARGINS.left, footerY, dims.width - MARGINS.right, footerY);

    doc.setFontSize(8);
    doc.setTextColor(...colors.muted);
    doc.text(`Page ${pageNumber}`, dims.width / 2, footerY + 7, { align: "center" });
};

// Add new page (portrait or landscape)
const addNewPage = (ctx: PDFContext, title: string, landscape: boolean = false): void => {
    const { doc } = ctx;
    ctx.pageNumber++;
    ctx.isLandscape = landscape;
    ctx.currentPageTitle = title;
    ctx.currentY = 25; // Start after header (18mm header + some padding)

    if (ctx.pageNumber > 1) {
        doc.addPage(landscape ? "landscape" : "portrait");
    }

    addPageHeader(ctx, title);
    addPageFooter(ctx);
};

// Add section title (with space check for flowing content)
const addSectionTitle = (ctx: PDFContext, title: string): void => {
    const { doc, colors, fontFamily } = ctx;

    // Ensure we have space for at least the title + some content
    ensureSpace(ctx, MIN_SECTION_SPACE, ctx.currentPageTitle);

    doc.setFontSize(FONTS.heading);
    doc.setFont(fontFamily, "bold");
    doc.setTextColor(...colors.primary);
    doc.text(title, MARGINS.left, ctx.currentY);

    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(0.5);
    doc.line(MARGINS.left, ctx.currentY + 2, 80, ctx.currentY + 2);

    ctx.currentY += 12;
};



// Helper to render HTML content from TipTap editor to PDF
// Supports: paragraphs, bold, italic, underline, lists, headings, images
const renderHtmlContent = (ctx: PDFContext, html: string, maxWidth: number): void => {
    const { doc, colors, fontFamily } = ctx;

    if (!html || html === '<p></p>') return;

    // Parse HTML using DOM parser
    const parser = new DOMParser();
    const parsed = parser.parseFromString(html, 'text/html');
    const body = parsed.body;

    const lineHeight = 5;
    const listIndent = 10;

    // State for text rendering
    let cursorX = MARGINS.left;

    // Check if we are at start of line
    const isAtStartOfLine = () => Math.abs(cursorX - MARGINS.left) < 0.1;

    // Helper to start new line
    const newLine = (indent: number = 0) => {
        if (!isAtStartOfLine()) {
            cursorX = MARGINS.left + indent;
            ctx.currentY += lineHeight;
        }
    };

    interface TextStyle {
        bold: boolean;
        italic: boolean;
        fontSize: number;
        color: [number, number, number];
    }

    const defaultStyle: TextStyle = {
        bold: false,
        italic: false,
        fontSize: FONTS.body,
        color: colors.text
    };

    // Helper to render text with wrapping
    const renderText = (text: string, style: TextStyle, indent: number) => {
        let fontStyle = "normal";
        if (style.bold && style.italic) fontStyle = "bolditalic";
        else if (style.bold) fontStyle = "bold";
        else if (style.italic) fontStyle = "italic";

        doc.setFont(fontFamily, fontStyle);
        doc.setFontSize(style.fontSize);
        doc.setTextColor(...style.color);

        // Split words but preserve spaces
        // We want to wrap by words.
        const words = text.split(/(\s+)/);

        words.forEach(word => {
            if (word.length === 0) return;

            // If it's a newline char, handle it? HTML usually ignores newlines in text.
            // But we might get them. Treat as space.
            const cleanWord = word.replace(/\n/g, " ");

            const wordWidth = doc.getTextWidth(cleanWord);
            const availableWidth = MARGINS.left + maxWidth - indent - cursorX;

            if (wordWidth > availableWidth && !isAtStartOfLine()) {
                // Ignore leading space on new line
                if (/^\s+$/.test(cleanWord)) {
                    return;
                }
                newLine(indent);
            }

            doc.text(cleanWord, cursorX, ctx.currentY);
            cursorX += wordWidth;
        });
    };

    // Process each node
    const processNode = (node: Node, indent: number = 0, style: TextStyle = defaultStyle): void => {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            if (text) {
                renderText(text, style, indent);
            }
            return;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) return;

        const element = node as Element;
        const tagName = element.tagName.toLowerCase();

        // Update styles
        const newStyle = { ...style };
        if (tagName === 'b' || tagName === 'strong') newStyle.bold = true;
        if (tagName === 'i' || tagName === 'em') newStyle.italic = true;
        // Underline is not natively consistent in basic jsPDF text() across versions without options, 
        // but we can try drawing a line or valid options if available. 
        // For simplicity/compatibility, we focus on bold/italic which were the main complaint.

        // Handle Block Elements
        const isBlock = ['p', 'div', 'h1', 'h2', 'h3', 'ul', 'ol', 'li'].includes(tagName);

        if (isBlock) {
            newLine(indent);
            if (tagName === 'p' || tagName === 'div') ctx.currentY += 2; // Padding before
        }

        if (tagName === 'h2') {
            newStyle.fontSize = FONTS.subheading;
            newStyle.bold = true;
            newStyle.color = colors.primary;
            ctx.currentY += 3;
            // Draw underline for H2
            newLine(indent); // Ensure we are on new line
        }

        if (tagName === 'h3') {
            newStyle.bold = true;
            ctx.currentY += 2;
        }

        if (tagName === 'ul' || tagName === 'ol') {
            ctx.currentY += 2;
        }

        if (tagName === 'li') {
            // Draw bullet
            // Note: recursive Text inside LI will need indentation
            newLine(indent);
            const bullet = '• '; // Simple bullet
            const bulletWidth = doc.getTextWidth(bullet);
            doc.setFont(fontFamily, "normal");
            doc.setFontSize(FONTS.body);
            doc.setTextColor(...colors.text);
            doc.text(bullet, cursorX, ctx.currentY);
            cursorX += bulletWidth;
        }

        if (tagName === 'img') {
            // Image handling
            const src = element.getAttribute('src');
            if (src && src.startsWith('data:image')) {
                newLine(indent);
                try {
                    const imgProps = doc.getImageProperties(src);
                    const align = element.getAttribute('data-align') || 'left';
                    const specifiedWidth = element.getAttribute('width');
                    let imgWidth = specifiedWidth ? parseFloat(specifiedWidth) * 0.264583 : null; // px to mm
                    let imgHeight = imgProps.height;

                    if (imgWidth) {
                        imgHeight = (imgWidth / imgProps.width) * imgProps.height;
                    } else {
                        const maxImgWidth = Math.min(maxWidth - indent, 80);
                        const maxImgHeight = 50;
                        const ratio = Math.min(maxImgWidth / imgProps.width, maxImgHeight / imgProps.height, 1);
                        imgWidth = imgProps.width * ratio;
                        imgHeight = imgProps.height * ratio;
                    }

                    // Cap bounds
                    if (imgWidth > maxWidth - indent) {
                        const scale = (maxWidth - indent) / imgWidth;
                        imgWidth *= scale;
                        imgHeight *= scale;
                    }

                    // Alignment X
                    let imgX = MARGINS.left + indent;
                    if (align === 'center') imgX += (maxWidth - indent - imgWidth) / 2;
                    else if (align === 'right') imgX += (maxWidth - indent - imgWidth);

                    doc.addImage(src, 'PNG', imgX, ctx.currentY, imgWidth, imgHeight);
                    ctx.currentY += imgHeight + 5;
                    cursorX = MARGINS.left + indent; // Reset X
                } catch (e) {
                    console.warn('Image error', e);
                }
            }
            return; // Don't process children of img
        }

        // Process children
        // For lists, increase indent
        const childIndent = (tagName === 'ul' || tagName === 'ol') ? indent + listIndent : indent;

        element.childNodes.forEach((child) => {
            processNode(child, childIndent, newStyle);
        });

        // Post-processing for blocks
        if (tagName === 'h2') {
            // Draw line under H2
            // We need to know where H2 ended? 
            // Actually standard implementation drew a fixed line.
            // We can just draw it here based on currentY
            newLine(indent);
            doc.setDrawColor(...colors.primary);
            doc.setLineWidth(0.5);
            doc.line(MARGINS.left, ctx.currentY + 2, 80, ctx.currentY + 2);
            ctx.currentY += 8;
            cursorX = MARGINS.left + indent;
        } else if (isBlock) {
            newLine(indent);
            if (tagName === 'p') ctx.currentY += 2; // Spacing after
        }
    };

    body.childNodes.forEach((child) => processNode(child));
};

// Add section title without space check (for cover page where content must stay together)
const addSectionTitleSimple = (ctx: PDFContext, title: string): void => {
    const { doc, colors, fontFamily } = ctx;

    doc.setFontSize(FONTS.heading);
    doc.setFont(fontFamily, "bold");
    doc.setTextColor(...colors.primary);
    doc.text(title, MARGINS.left, ctx.currentY);

    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(0.5);
    doc.line(MARGINS.left, ctx.currentY + 2, 80, ctx.currentY + 2);

    ctx.currentY += 12;
};

// ============================================
// ABOUT SECTION (can be on cover or separate)
// ============================================
const addAboutSection = (data: TechSpecData, ctx: PDFContext) => {

    const dims = getPageDimensions(false);

    if (data.aboutYou && data.aboutYou.trim()) {
        // If we skipped cover page, we might need a title/header if it's the first thing?
        // But addSectionTitleSimple just adds text.

        // If not on cover page (or if cover page was skipped), ensure we have space?
        // But traditionally it flows after metadata.

        // If cover page was included, we are at some Y.
        // If cover page was skipped, Y is 35 (from init).

        addSectionTitleSimple(ctx, "About");

        // Render HTML content from rich text editor
        renderHtmlContent(ctx, data.aboutYou, dims.contentWidth);
        ctx.currentY += 5;
    }
};

// ============================================
// COVER PAGE (always its own page)
// ============================================
const addCoverPage = (data: TechSpecData, ctx: PDFContext) => {
    const { doc, colors, fontFamily } = ctx;
    addNewPage(ctx, "Technical Rider", false);

    const dims = getPageDimensions(false);
    ctx.currentY = 60;

    // Band Logo (larger on cover page)
    if (data.bandLogo) {
        try {
            const logoWidth = 60;
            const logoHeight = 60;
            const logoX = (dims.width - logoWidth) / 2;
            doc.addImage(data.bandLogo, "PNG", logoX, ctx.currentY, logoWidth, logoHeight);
            ctx.currentY += 75;
        } catch (e) {
            console.warn("Could not add band logo to PDF:", e);
        }
    }

    // Band Name
    doc.setFontSize(32);
    doc.setFont(fontFamily, "bold");
    doc.setTextColor(...colors.text);
    doc.text(data.bandName || "Band Name", dims.width / 2, ctx.currentY, { align: "center" });
    ctx.currentY += 15;

    // Subtitle
    doc.setFontSize(18);
    doc.setFont(fontFamily, "normal");
    doc.setTextColor(...colors.muted);
    doc.text("Technical Rider", dims.width / 2, ctx.currentY, { align: "center" });
    ctx.currentY += 25;

    // Metadata box
    doc.setFillColor(...colors.background);
    doc.roundedRect(MARGINS.left, ctx.currentY, dims.contentWidth, 35, 3, 3, "F");

    doc.setFontSize(FONTS.body);
    doc.setTextColor(...colors.text);
    doc.setFont(fontFamily, "bold");
    doc.text("Version:", MARGINS.left + 10, ctx.currentY + 12);
    doc.text("Last Updated:", MARGINS.left + 10, ctx.currentY + 25);

    doc.setFont(fontFamily, "normal");
    doc.text(data.riderVersion || "1.0", MARGINS.left + 50, ctx.currentY + 12);
    doc.text(data.lastUpdated || new Date().toISOString().split("T")[0], MARGINS.left + 55, ctx.currentY + 25);

    ctx.currentY += 50;
};



// ============================================
// CONTACTS SECTION
// ============================================
const addContactsSection = (data: TechSpecData, ctx: PDFContext) => {
    if (!data.contacts || data.contacts.length === 0) return;

    const { doc, colors, fontFamily } = ctx;
    const dims = getPageDimensions(false);

    // Start new page after cover
    addNewPage(ctx, "Contacts", false);

    addSectionTitle(ctx, "Contact Information");

    const cardWidth = (dims.contentWidth - 10) / 2;
    const cardHeight = 45;

    data.contacts.forEach((contact, index) => {
        const isLeft = index % 2 === 0;

        // For odd items on the left, we need a new row
        if (isLeft) {
            // Check if we need a new page
            ensureSpace(ctx, cardHeight + 10, "Contacts");
        }

        const cardX = isLeft ? MARGINS.left : MARGINS.left + cardWidth + 10;
        const cardY = ctx.currentY;

        // Card background
        doc.setFillColor(...colors.background);
        doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 2, 2, "F");

        // Contact name
        doc.setFontSize(FONTS.subheading);
        doc.setFont(fontFamily, "bold");
        doc.setTextColor(...colors.text);
        doc.text(contact.name || "Unnamed", cardX + 5, cardY + 10);

        // Responsibilities
        if (contact.responsibilities.length > 0) {
            const respLabels = contact.responsibilities
                .map((r) => CONTACT_RESPONSIBILITIES.find((cr) => cr.value === r)?.label || r)
                .join(", ");
            doc.setFontSize(FONTS.small);
            doc.setTextColor(...colors.primary);
            doc.text(respLabels, cardX + 5, cardY + 18);
        }

        // Contact details
        doc.setFontSize(FONTS.small);
        doc.setTextColor(...colors.muted);
        if (contact.phone) {
            doc.text(`Tel: ${contact.phone}`, cardX + 5, cardY + 28);
        }
        if (contact.email) {
            doc.text(`Email: ${contact.email}`, cardX + 5, cardY + 36);
        }

        // Move Y down after completing a row (after right card or last item)
        if (!isLeft || index === data.contacts.length - 1) {
            ctx.currentY += cardHeight + 10;
        }
    });
};

// ============================================
// STAGE REQUIREMENTS SECTION
// ============================================
const addStageRequirementsSection = (data: TechSpecData, ctx: PDFContext) => {
    const { doc, colors, fontFamily } = ctx;
    const dims = getPageDimensions(false);

    // Check if we have enough space, otherwise start a new page
    ensureSpace(ctx, MIN_SECTION_SPACE, "Stage Requirements");

    // Update page title if we're continuing on the same page
    ctx.currentPageTitle = "Stage Requirements";

    addSectionTitle(ctx, "Stage & Technical Requirements");

    const addRequirement = (label: string, value: string | undefined, notNeeded: boolean) => {
        // Check for space before each requirement
        ensureSpace(ctx, 20, "Stage Requirements");

        if (notNeeded) {
            doc.setFontSize(FONTS.body);
            doc.setFont(fontFamily, "normal");
            doc.setTextColor(...colors.muted);
            doc.text(`${label}: Not required`, MARGINS.left, ctx.currentY);
            ctx.currentY += 12;
        } else if (value && value.trim()) {
            doc.setFontSize(FONTS.body);
            doc.setFont(fontFamily, "bold");
            doc.setTextColor(...colors.text);
            doc.text(`${label}:`, MARGINS.left, ctx.currentY);
            ctx.currentY += 6;

            // Render HTML content from rich text editor
            renderHtmlContent(ctx, value, dims.contentWidth);
            ctx.currentY += 5;
        }
    };

    // Stage Dimensions
    if (!data.stageDimensionsNotNeeded && (data.stageWidth || data.stageDepth)) {
        doc.setFontSize(FONTS.body);
        doc.setFont(fontFamily, "bold");
        doc.setTextColor(...colors.text);
        doc.text("Stage Dimensions:", MARGINS.left, ctx.currentY);

        doc.setFont(fontFamily, "normal");
        doc.text(`${data.stageWidth || "TBD"} (W) × ${data.stageDepth || "TBD"} (D)`, MARGINS.left + 50, ctx.currentY);
        ctx.currentY += 12;
    } else if (data.stageDimensionsNotNeeded) {
        doc.setTextColor(...colors.muted);
        doc.setFont(fontFamily, "normal");
        doc.text("Stage Dimensions: Flexible / Not specified", MARGINS.left, ctx.currentY);
        ctx.currentY += 12;
    }

    addRequirement("Power Requirements", data.powerRequirements, data.powerNotNeeded);
    addRequirement("Monitor Requirements", data.monitorRequirements, data.monitorsNotNeeded);
    addRequirement("Soundcheck Duration", data.soundcheckDuration, data.soundcheckNotNeeded);
    addRequirement("Load-In Notes", data.loadInNotes, false);
};

// ============================================
// EQUIPMENT TABLES SECTION
// ============================================
const addEquipmentTablesSection = (data: TechSpecData, ctx: PDFContext) => {
    const { doc, colors, fontFamily } = ctx;

    // What You Bring Table
    if (ctx.settings.includeEquipmentSection && data.whatYouBring.rows.length > 0) {
        // Check if table would span pages, if so start on new page
        ensureTableFits(ctx, data.whatYouBring.rows.length, "Equipment We Bring");
        ctx.currentPageTitle = "Equipment We Bring";

        // Add section title
        doc.setFontSize(FONTS.heading);
        doc.setFont(fontFamily, "bold");
        doc.setTextColor(...colors.primary);
        doc.text("Equipment We Bring", MARGINS.left, ctx.currentY);
        ctx.currentY += 10;

        const headers = data.whatYouBring.columns.map((c) => c.name);
        headers.push("Tags");

        const rows = data.whatYouBring.rows.map((row) => {
            const rowData = data.whatYouBring.columns.map((col) => String(row.data[col.id] ?? ""));
            rowData.push(row.tags.join(", "));
            return rowData;
        });

        autoTable(doc, {
            head: [headers],
            body: rows,
            startY: ctx.currentY,
            margin: { left: MARGINS.left, right: MARGINS.right, top: 25, bottom: 30 },
            headStyles: {
                fillColor: colors.tableHeader,
                textColor: colors.white,
                fontStyle: "bold",
                fontSize: FONTS.small,
                font: fontFamily,
            },
            bodyStyles: {
                fontSize: FONTS.small,
                textColor: colors.text,
                font: fontFamily,
            },
            alternateRowStyles: {
                fillColor: colors.tableAlt,
            },
            styles: {
                cellPadding: 3,
                lineColor: [200, 200, 200],
                lineWidth: 0.1,
                font: fontFamily,
            },
            didDrawPage: (data) => {
                // Update page number and add headers/footers for new pages created by autoTable
                if (data.pageNumber > 1) {
                    ctx.pageNumber++;
                    addPageHeader(ctx, "Equipment We Bring");
                    addPageFooter(ctx);
                }
            },
        });

        // Update Y position after table
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ctx.currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Venue Needs Table
    if (ctx.settings.includeVenueNeedsSection && data.venueNeeds.rows.length > 0) {
        // Check if table would span pages, if so start on new page
        ensureTableFits(ctx, data.venueNeeds.rows.length, "What We Need From Venue");
        ctx.currentPageTitle = "What We Need From Venue";

        doc.setFontSize(FONTS.heading);
        doc.setFont(fontFamily, "bold");
        doc.setTextColor(...colors.primary);
        doc.text("What We Need From Venue", MARGINS.left, ctx.currentY);
        ctx.currentY += 10;

        const headers = data.venueNeeds.columns.map((c) => c.name);
        headers.push("Tags");

        const rows = data.venueNeeds.rows.map((row) => {
            const rowData = data.venueNeeds.columns.map((col) => String(row.data[col.id] ?? ""));
            rowData.push(row.tags.join(", "));
            return rowData;
        });

        autoTable(doc, {
            head: [headers],
            body: rows,
            startY: ctx.currentY,
            margin: { left: MARGINS.left, right: MARGINS.right, top: 25, bottom: 30 },
            headStyles: {
                fillColor: colors.tableHeader,
                textColor: colors.white,
                fontStyle: "bold",
                fontSize: FONTS.small,
                font: fontFamily,
            },
            bodyStyles: {
                fontSize: FONTS.small,
                textColor: colors.text,
                font: fontFamily,
            },
            alternateRowStyles: {
                fillColor: colors.tableAlt,
            },
            styles: {
                cellPadding: 3,
                lineColor: [200, 200, 200],
                lineWidth: 0.1,
                font: fontFamily,
            },
            didDrawPage: (data) => {
                if (data.pageNumber > 1) {
                    ctx.pageNumber++;
                    addPageHeader(ctx, "What We Need From Venue");
                    addPageFooter(ctx);
                }
            },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ctx.currentY = (doc as any).lastAutoTable.finalY + 15;
    }
};

// ============================================
// SEND LIST SECTION
// ============================================
const addSendListSection = (data: TechSpecData, ctx: PDFContext) => {
    if (data.sendList.rows.length === 0) return;

    const { doc, colors, fontFamily } = ctx;

    // Helper to resolve source ID to item name
    const getSourceLabel = (sourceId: string): string => {
        if (sourceId.startsWith("bring-")) {
            const rowId = sourceId.replace("bring-", "");
            const row = data.whatYouBring.rows.find(r => r.id === rowId);
            if (row && row.data["item-name"]) {
                return String(row.data["item-name"]);
            }
        } else if (sourceId.startsWith("venue-")) {
            const rowId = sourceId.replace("venue-", "");
            const row = data.venueNeeds.rows.find(r => r.id === rowId);
            if (row && row.data["item-name"]) {
                return String(row.data["item-name"]);
            }
        }
        return sourceId;
    };

    // Check if table would span pages, if so start on new page
    ensureTableFits(ctx, data.sendList.rows.length, "Audio Send List");
    ctx.currentPageTitle = "Audio Send List";

    doc.setFontSize(FONTS.heading);
    doc.setFont(fontFamily, "bold");
    doc.setTextColor(...colors.primary);
    doc.text("Audio Send List", MARGINS.left, ctx.currentY);
    ctx.currentY += 10;

    const headers = ["Ch#", "Source", "Description", "FOH", "Tags"];
    data.sendList.columns.forEach((col) => {
        headers.push(col.name);
    });

    const rows = data.sendList.rows.map((row) => {
        const rowData = [
            String(row.channelNumber),
            getSourceLabel(row.source),
            row.description,
            row.fohOutput ? "Yes" : "No",
            row.tags.join(", "),
        ];
        data.sendList.columns.forEach((col) => {
            rowData.push(String(row.extraData[col.id] ?? ""));
        });
        return rowData;
    });

    autoTable(doc, {
        head: [headers],
        body: rows,
        startY: ctx.currentY,
        margin: { left: MARGINS.left, right: MARGINS.right, top: 25, bottom: 30 },
        headStyles: {
            fillColor: colors.tableHeader,
            textColor: colors.white,
            fontStyle: "bold",
            fontSize: FONTS.small,
            font: fontFamily,
        },
        bodyStyles: {
            fontSize: FONTS.small,
            textColor: colors.text,
            font: fontFamily,
        },
        alternateRowStyles: {
            fillColor: colors.tableAlt,
        },
        styles: {
            cellPadding: 3,
            lineColor: [200, 200, 200],
            lineWidth: 0.1,
            font: fontFamily,
        },
        columnStyles: {
            0: { cellWidth: 15 },
            3: { cellWidth: 15, halign: "center" },
        },
        didDrawPage: (data) => {
            if (data.pageNumber > 1) {
                ctx.pageNumber++;
                addPageHeader(ctx, "Audio Send List");
                addPageFooter(ctx);
            }
        },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ctx.currentY = (doc as any).lastAutoTable.finalY + 15;
};

// ============================================
// LIGHTING PATCH LIST SECTION
// ============================================
const addLightingPatchListSection = (data: TechSpecData, ctx: PDFContext) => {
    if (!data.hasBringingLighting || data.lightingPatchList.rows.length === 0) return;

    const { doc, colors, fontFamily } = ctx;

    // Check if table would span pages, if so start on new page
    ensureTableFits(ctx, data.lightingPatchList.rows.length, "Lighting Patch List");
    ctx.currentPageTitle = "Lighting Patch List";

    doc.setFontSize(FONTS.heading);
    doc.setFont(fontFamily, "bold");
    doc.setTextColor(...colors.primary);
    doc.text("Lighting Patch List", MARGINS.left, ctx.currentY);
    ctx.currentY += 10;

    const headers = ["Ch#", "Source", "Fixture Type", "DMX Address", "Universe", "Notes"];
    data.lightingPatchList.columns.forEach((col) => {
        headers.push(col.name);
    });

    const rows = data.lightingPatchList.rows.map((row) => {
        const rowData = [
            String(row.channelNumber),
            row.source,
            row.fixtureType,
            row.dmxAddress,
            String(row.universe),
            row.notes,
        ];
        data.lightingPatchList.columns.forEach((col) => {
            rowData.push(String(row.extraData[col.id] ?? ""));
        });
        return rowData;
    });

    autoTable(doc, {
        head: [headers],
        body: rows,
        startY: ctx.currentY,
        margin: { left: MARGINS.left, right: MARGINS.right, top: 25, bottom: 30 },
        headStyles: {
            fillColor: colors.tableHeader,
            textColor: colors.white,
            fontStyle: "bold",
            fontSize: FONTS.small,
            font: fontFamily,
        },
        bodyStyles: {
            fontSize: FONTS.small,
            textColor: colors.text,
            font: fontFamily,
        },
        alternateRowStyles: {
            fillColor: colors.tableAlt,
        },
        styles: {
            cellPadding: 3,
            lineColor: [200, 200, 200],
            lineWidth: 0.1,
            font: fontFamily,
        },
        columnStyles: {
            0: { cellWidth: 15 },
            4: { cellWidth: 20, halign: "center" },
        },
        didDrawPage: (data) => {
            if (data.pageNumber > 1) {
                ctx.pageNumber++;
                addPageHeader(ctx, "Lighting Patch List");
                addPageFooter(ctx);
            }
        },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ctx.currentY = (doc as any).lastAutoTable.finalY + 15;
};

// ============================================
// BAND PLOT SECTION (SHRINK TO FIT)
// ============================================
const addBandPlotSection = (data: TechSpecData, ctx: PDFContext) => {
    if (!data.bandPlotImage) return;

    const { doc, colors, fontFamily } = ctx;
    const dims = getPageDimensions(false);

    // Get image dimensions first to calculate needed space
    let imgWidth: number, imgHeight: number;
    try {
        const imgProps = doc.getImageProperties(data.bandPlotImage);
        const originalWidth = imgProps.width;
        const originalHeight = imgProps.height;
        const aspectRatio = originalWidth / originalHeight;

        const maxWidth = dims.contentWidth;
        const maxHeight = 150; // Max height for fitting with other content

        imgWidth = originalWidth;
        imgHeight = originalHeight;

        if (imgWidth > maxWidth || imgHeight > maxHeight) {
            imgWidth = maxWidth;
            imgHeight = imgWidth / aspectRatio;

            if (imgHeight > maxHeight) {
                imgHeight = maxHeight;
                imgWidth = imgHeight * aspectRatio;
            }
        }
    } catch (e) {
        console.warn("Could not get image properties:", e);
        imgWidth = dims.contentWidth;
        imgHeight = 100;
    }

    // Calculate total needed space (title + image + description)
    const neededSpace = 20 + imgHeight + 40;

    // Check if it fits on current page
    ensureSpace(ctx, neededSpace, "Stage Plot");
    ctx.currentPageTitle = "Stage Plot";

    doc.setFontSize(FONTS.heading);
    doc.setFont(fontFamily, "bold");
    doc.setTextColor(...colors.primary);
    doc.text("Stage Plot", MARGINS.left, ctx.currentY);
    ctx.currentY += 10;

    try {
        // Center the image horizontally
        const xOffset = MARGINS.left + (dims.contentWidth - imgWidth) / 2;

        doc.addImage(data.bandPlotImage, "PNG", xOffset, ctx.currentY, imgWidth, imgHeight);
        ctx.currentY += imgHeight + 10;

        // Add description below image if present
        if (data.stagePlotDescription && data.stagePlotDescription.trim()) {
            doc.setFontSize(FONTS.body);
            doc.setFont(fontFamily, "normal");
            doc.setTextColor(...colors.text);
            const descLines = doc.splitTextToSize(data.stagePlotDescription, dims.contentWidth);
            doc.text(descLines, MARGINS.left, ctx.currentY);
            ctx.currentY += descLines.length * 5 + 10;
        }
    } catch (e) {
        console.warn("Could not add band plot image:", e);
        doc.setFontSize(FONTS.body);
        doc.setTextColor(...colors.muted);
        doc.text("(Stage plot image could not be embedded)", MARGINS.left, ctx.currentY);
        ctx.currentY += 15;
    }
};

// ============================================
// FOOTER NOTES SECTION
// ============================================
const addFooterNotesSection = (data: TechSpecData, ctx: PDFContext) => {
    if (!data.footerNotes || !data.footerNotes.trim()) return;

    const dims = getPageDimensions(false);

    // Ensure minimum space for notes section
    ensureSpace(ctx, 50, "Additional Notes");
    ctx.currentPageTitle = "Additional Notes";

    addSectionTitle(ctx, "Additional Notes");

    // Render HTML content from rich text editor
    renderHtmlContent(ctx, data.footerNotes, dims.contentWidth);
    ctx.currentY += 10;
};

// ============================================
// HELPER: Generate PDF document with all sections
// ============================================
const generatePDFDocument = (
    data: TechSpecData,
    settings?: PDFExportSettings
): jsPDF => {
    const effectiveSettings = { ...DEFAULT_PDF_SETTINGS, ...(data.pdfSettings || {}), ...(settings || {}) };

    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });

    const colors = createColors(effectiveSettings);

    const ctx: PDFContext = {
        doc,
        pageNumber: 0,
        currentY: 35,
        currentPageTitle: "",
        bandName: data.bandName || "Tech Spec",
        bandLogo: data.bandLogo,
        isLandscape: false,
        settings: effectiveSettings,
        colors,
        fontFamily: effectiveSettings.fontFamily,
    };

    // Generate all sections
    // Generate all sections
    if (effectiveSettings.includeCoverPage) {
        addCoverPage(data, ctx);
    }
    if (effectiveSettings.includeAboutSection) {
        addAboutSection(data, ctx);
    }
    if (effectiveSettings.includeContactsSection) {
        addContactsSection(data, ctx);
    }
    if (effectiveSettings.includeStageReqsSection) {
        addStageRequirementsSection(data, ctx);
    }

    // Equipment Tables (What You Bring & Venue Needs are handled inside, checking flags)
    // Wait, I updated addEquipmentTablesSection to check includeEquipmentSection inside.
    // I also need to update it to check includeVenueNeedsSection inside.
    addEquipmentTablesSection(data, ctx);

    if (effectiveSettings.includeSendListSection) {
        addSendListSection(data, ctx);
    }
    if (effectiveSettings.includeLightingSection) {
        addLightingPatchListSection(data, ctx);
    }
    if (effectiveSettings.includeStagePlotSection) {
        addBandPlotSection(data, ctx);
    }
    if (effectiveSettings.includeFooterNotes) {
        addFooterNotesSection(data, ctx);
    }

    return doc;
};

// ============================================
// GENERATE PDF BLOB (for live preview)
// ============================================
export const generatePDFBlob = async (
    data: TechSpecData,
    settings?: PDFExportSettings
): Promise<Blob> => {
    const doc = generatePDFDocument(data, settings);
    return doc.output("blob");
};

// ============================================
// MAIN EXPORT FUNCTION
// ============================================
export const exportToPDF = async (
    data: TechSpecData,
    settings?: PDFExportSettings
): Promise<void> => {
    const doc = generatePDFDocument(data, settings);

    // Generate filename
    const timestamp = new Date().toISOString().split("T")[0];
    const bandNameSlug = (data.bandName || "tech-spec")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

    const filename = `${bandNameSlug}-tech-rider-${timestamp}.pdf`;

    // Download the PDF
    doc.save(filename);
};
