// Types for the Band Tech Spec Generator

export type ItemCategory = "audio" | "lighting";

// PDF Export Settings
export type PDFFontFamily = "helvetica" | "times" | "courier";

export interface PDFExportSettings {
    fontFamily: PDFFontFamily;
    primaryColor: string; // Hex color e.g. "#3b82f6"
    accentColor: string;  // Hex color for secondary elements
    showLogoOnAllPages: boolean;
    // Section Visibility
    includeCoverPage: boolean;
    includeAboutSection: boolean;
    includeContactsSection: boolean;
    includeStageReqsSection: boolean; // Stage & Tech Requirements
    includeEquipmentSection: boolean; // What You Bring
    includeVenueNeedsSection: boolean; // What We Need
    includeSendListSection: boolean; // Audio Input List
    includeLightingSection: boolean; // Lighting Patch List
    includeStagePlotSection: boolean; // Stage Plot
    includeFooterNotes: boolean; // Additional Notes
}

export const DEFAULT_PDF_SETTINGS: PDFExportSettings = {
    fontFamily: "helvetica",
    primaryColor: "#3b82f6",  // Blue
    accentColor: "#1e293b",   // Dark slate
    showLogoOnAllPages: true,
    // Section Visibility Defaults
    includeCoverPage: true,
    includeAboutSection: true,
    includeContactsSection: true,
    includeStageReqsSection: true,
    includeEquipmentSection: true,
    includeVenueNeedsSection: true,
    includeSendListSection: true,
    includeLightingSection: true,
    includeStagePlotSection: true,
    includeFooterNotes: true,
};


// Contact information with responsibility tags
export type ContactResponsibility = "technical" | "management" | "booking" | "tour_manager" | "production" | "other";

export const CONTACT_RESPONSIBILITIES: { value: ContactResponsibility; label: string }[] = [
    { value: "technical", label: "Technical" },
    { value: "management", label: "Management" },
    { value: "booking", label: "Booking" },
    { value: "tour_manager", label: "Tour Manager" },
    { value: "production", label: "Production" },
    { value: "other", label: "Other" },
];

export interface ContactInfo {
    id: string;
    name: string;
    phone: string;
    email: string;
    responsibilities: ContactResponsibility[];
}

export interface TableColumn {
    id: string;
    name: string;
    dataType: "text" | "numeric" | "checkbox" | "category";
    isLocked?: boolean; // Locked columns cannot be removed by user
}

export interface TableRow {
    id: string;
    data: Record<string, string | number | boolean>;
    tags: string[];
    isStereo?: boolean; // When true, equipment takes 2 channels
}

export interface DynamicTableData {
    columns: TableColumn[];
    rows: TableRow[];
}

export interface SendListRow {
    id: string;
    channelNumber: number;
    channelNumber2?: number; // Second channel for stereo sources
    source: string; // Reference to item from section 2 or 3
    description: string;
    tags: string[];
    fohOutput: boolean; // Audio Output to FoH checkbox (locked column)
    isStereo: boolean; // When true, takes 2 channels (L/R)
    extraData: Record<string, string | number | boolean>;
}

export interface SendListData {
    columns: TableColumn[]; // Extra columns beyond the default ones
    rows: SendListRow[];
}

export interface LightingPatchRow {
    id: string;
    channelNumber: number;
    source: string; // Reference to lighting item from section 2 or 3
    fixtureType: string;
    dmxAddress: string;
    universe: number;
    notes: string;
    extraData: Record<string, string | number | boolean>;
}

export interface LightingPatchListData {
    columns: TableColumn[]; // Extra columns beyond the default ones
    rows: LightingPatchRow[];
}

export interface TechSpecData {
    // Document Metadata
    bandName: string;
    riderVersion: string;
    lastUpdated: string;

    // Section 1: About You
    aboutYou: string;
    bandLogo: string | null; // Base64 encoded logo image
    hasBringingLighting: boolean;

    // Contact Information (dynamic list)
    contacts: ContactInfo[];

    // Stage & Technical Requirements
    stageWidth: string;
    stageDepth: string;
    stageDimensionsNotNeeded: boolean;
    powerRequirements: string;
    powerNotNeeded: boolean;
    monitorRequirements: string;
    monitorsNotNeeded: boolean;
    soundcheckDuration: string;
    loadInNotes: string;
    soundcheckNotNeeded: boolean;

    // Section 2: What You Bring
    whatYouBring: DynamicTableData;

    // Section 3: What We Need From Venue
    venueNeeds: DynamicTableData;

    // Section 4: Audio Send List
    sendList: SendListData;

    // Section 5: Lighting Patch List (only when hasBringingLighting is true)
    lightingPatchList: LightingPatchListData;

    // Section 5/6: Band Plot
    bandPlotImage: string | null; // Base64 encoded image
    stagePlotDescription: string; // Description text for stage plot
    footerNotes: string;

    // PDF Settings (Persisted)
    pdfSettings: PDFExportSettings;
}

export const DEFAULT_TAGS = ["Essential", "Non-Essential"];

export const createDefaultTableData = (showCategory: boolean = false): DynamicTableData => ({
    columns: [
        { id: "item-name", name: "Item Name", dataType: "text" },
        ...(showCategory ? [{ id: "category", name: "Category", dataType: "category" as const, isLocked: true }] : []),
        { id: "count", name: "Count", dataType: "numeric" },
        { id: "notes", name: "Notes", dataType: "text" },
    ],
    rows: [],
});

export const createDefaultSendListData = (): SendListData => ({
    columns: [],
    rows: [],
});

export const createDefaultLightingPatchListData = (): LightingPatchListData => ({
    columns: [],
    rows: [],
});

const generateId = () => Math.random().toString(36).substring(2, 11);

export const createDefaultContactInfo = (): ContactInfo => ({
    id: generateId(),
    name: "",
    phone: "",
    email: "",
    responsibilities: [],
});

export const createDefaultTechSpecData = (): TechSpecData => ({
    // Document Metadata
    bandName: "",
    riderVersion: "1.0",
    lastUpdated: new Date().toISOString().split("T")[0],

    // About You
    aboutYou: "",
    bandLogo: null,
    hasBringingLighting: false,

    // Contact Information (dynamic list)
    contacts: [],

    // Stage & Technical Requirements
    stageWidth: "",
    stageDepth: "",
    stageDimensionsNotNeeded: false,
    powerRequirements: "",
    powerNotNeeded: false,
    monitorRequirements: "",
    monitorsNotNeeded: false,
    soundcheckDuration: "",
    loadInNotes: "",
    soundcheckNotNeeded: false,

    // Equipment Lists
    whatYouBring: createDefaultTableData(),
    venueNeeds: createDefaultTableData(),
    sendList: createDefaultSendListData(),
    lightingPatchList: createDefaultLightingPatchListData(),

    // Band Plot
    bandPlotImage: null,
    stagePlotDescription: "",
    footerNotes: "",

    // PDF Settings
    pdfSettings: DEFAULT_PDF_SETTINGS,
});

const generateExampleId = () => Math.random().toString(36).substring(2, 11);

export const createExampleTechSpecData = (): TechSpecData => ({
    // Document Metadata
    bandName: "The Electric Waves",
    riderVersion: "2.1",
    lastUpdated: new Date().toISOString().split("T")[0],

    // About You
    aboutYou: `The Electric Waves is a 5-piece alternative rock band from London, UK. We combine driving guitar riffs with atmospheric synths and powerful vocals.

Our live show features dynamic lighting and requires a minimum stage size for our full production. We carry our own backline and in-ear monitoring system.

We're professional, punctual, and easy to work with. Our technical team is experienced and self-sufficient.`,
    bandLogo: null,
    hasBringingLighting: true,

    // Contact Information
    contacts: [
        {
            id: generateExampleId(),
            name: "Sarah Mitchell",
            phone: "+44 7700 900123",
            email: "sarah@electricwaves.com",
            responsibilities: ["management", "booking"],
        },
        {
            id: generateExampleId(),
            name: "James Chen",
            phone: "+44 7700 900456",
            email: "james@electricwaves.com",
            responsibilities: ["technical", "production"],
        },
        {
            id: generateExampleId(),
            name: "Alex Thompson",
            phone: "+44 7700 900789",
            email: "alex@electricwaves.com",
            responsibilities: ["tour_manager"],
        },
    ],

    // Stage & Technical Requirements
    stageWidth: "8m",
    stageDepth: "6m",
    stageDimensionsNotNeeded: false,
    powerRequirements: "2x 32A circuits, clean power preferred. No dimmers on same circuit.",
    powerNotNeeded: false,
    monitorRequirements: "5x floor wedges (2 vocalist, 1 each for guitar/bass/keys) or IEM feed for our system",
    monitorsNotNeeded: false,
    soundcheckDuration: "45 minutes minimum, ideally 1 hour",
    loadInNotes: "Load-in 3 hours before doors. Wheelchair accessible access required for equipment.",
    soundcheckNotNeeded: false,

    // What You Bring
    whatYouBring: {
        columns: [
            { id: "item-name", name: "Item Name", dataType: "text" },
            { id: "category", name: "Category", dataType: "category", isLocked: true },
            { id: "count", name: "Count", dataType: "numeric" },
            { id: "notes", name: "Notes", dataType: "text" },
        ],
        rows: [
            { id: generateExampleId(), data: { "item-name": "Fender Twin Reverb", category: "audio", count: 1, notes: "Guitar amp - needs mic" }, tags: ["Essential"] },
            { id: generateExampleId(), data: { "item-name": "Ampeg SVT Classic", category: "audio", count: 1, notes: "Bass amp with 8x10 cab" }, tags: ["Essential"] },
            { id: generateExampleId(), data: { "item-name": "Nord Stage 3", category: "audio", count: 1, notes: "Keys - stereo DI" }, tags: ["Essential"] },
            { id: generateExampleId(), data: { "item-name": "Roland SPD-SX", category: "audio", count: 1, notes: "Drum pad - stereo DI" }, tags: ["Non-Essential"] },
            { id: generateExampleId(), data: { "item-name": "Shure PSM300", category: "audio", count: 5, notes: "IEM receivers - need feed from desk" }, tags: ["Essential"] },
            { id: generateExampleId(), data: { "item-name": "Martin MAC Aura", category: "lighting", count: 4, notes: "Moving heads - need power" }, tags: ["Essential"] },
            { id: generateExampleId(), data: { "item-name": "Chauvet COLORado", category: "lighting", count: 8, notes: "Wash fixtures for backline" }, tags: ["Essential"] },
            { id: generateExampleId(), data: { "item-name": "MA Lighting Dot2", category: "lighting", count: 1, notes: "Lighting console" }, tags: ["Essential"] },
        ],
    },

    // Venue Needs
    venueNeeds: {
        columns: [
            { id: "item-name", name: "Item Name", dataType: "text" },
            { id: "category", name: "Category", dataType: "category", isLocked: true },
            { id: "count", name: "Count", dataType: "numeric" },
            { id: "notes", name: "Notes", dataType: "text" },
        ],
        rows: [
            { id: generateExampleId(), data: { "item-name": "SM58", category: "audio", count: 3, notes: "Vocals" }, tags: ["Essential"] },
            { id: generateExampleId(), data: { "item-name": "SM57", category: "audio", count: 4, notes: "Snare, guitar cab" }, tags: ["Essential"] },
            { id: generateExampleId(), data: { "item-name": "Beta 52A", category: "audio", count: 1, notes: "Kick drum" }, tags: ["Essential"] },
            { id: generateExampleId(), data: { "item-name": "Overhead Mics", category: "audio", count: 2, notes: "C414 or similar preferred" }, tags: ["Essential"] },
            { id: generateExampleId(), data: { "item-name": "DI Box", category: "audio", count: 4, notes: "Active preferred" }, tags: ["Essential"] },
            { id: generateExampleId(), data: { "item-name": "Drum Kit", category: "audio", count: 1, notes: "Standard 5-piece, no cymbals needed" }, tags: ["Essential"] },
            { id: generateExampleId(), data: { "item-name": "Drum Riser", category: "audio", count: 1, notes: "2m x 2m minimum" }, tags: ["Non-Essential"] },
            { id: generateExampleId(), data: { "item-name": "DMX Universe", category: "lighting", count: 1, notes: "For our fixtures - house tie-in" }, tags: ["Essential"] },
        ],
    },

    // Send List
    sendList: {
        columns: [],
        rows: [
            { id: generateExampleId(), channelNumber: 1, source: "Kick", description: "Beta 52A inside", tags: ["Essential"], fohOutput: true, isStereo: false, extraData: {} },
            { id: generateExampleId(), channelNumber: 2, source: "Snare Top", description: "SM57", tags: ["Essential"], fohOutput: true, isStereo: false, extraData: {} },
            { id: generateExampleId(), channelNumber: 3, source: "Snare Bottom", description: "SM57", tags: ["Non-Essential"], fohOutput: true, isStereo: false, extraData: {} },
            { id: generateExampleId(), channelNumber: 4, source: "Hi-Hat", description: "Small condenser", tags: ["Non-Essential"], fohOutput: true, isStereo: false, extraData: {} },
            { id: generateExampleId(), channelNumber: 5, source: "Tom 1", description: "Sennheiser e604", tags: ["Essential"], fohOutput: true, isStereo: false, extraData: {} },
            { id: generateExampleId(), channelNumber: 6, source: "Tom 2", description: "Sennheiser e604", tags: ["Essential"], fohOutput: true, isStereo: false, extraData: {} },
            { id: generateExampleId(), channelNumber: 7, source: "Floor Tom", description: "Sennheiser e604", tags: ["Essential"], fohOutput: true, isStereo: false, extraData: {} },
            { id: generateExampleId(), channelNumber: 8, source: "Overhead L", description: "Condenser", tags: ["Essential"], fohOutput: true, isStereo: false, extraData: {} },
            { id: generateExampleId(), channelNumber: 9, source: "Overhead R", description: "Condenser", tags: ["Essential"], fohOutput: true, isStereo: false, extraData: {} },
            { id: generateExampleId(), channelNumber: 10, source: "Bass DI", description: "Active DI from Ampeg", tags: ["Essential"], fohOutput: true, isStereo: false, extraData: {} },
            { id: generateExampleId(), channelNumber: 11, source: "Guitar Amp", description: "SM57 on Fender Twin", tags: ["Essential"], fohOutput: true, isStereo: false, extraData: {} },
            { id: generateExampleId(), channelNumber: 12, channelNumber2: 13, source: "Keys", description: "Stereo DI", tags: ["Essential"], fohOutput: true, isStereo: true, extraData: {} },
            { id: generateExampleId(), channelNumber: 14, channelNumber2: 15, source: "SPD Pad", description: "Stereo drum pad", tags: ["Non-Essential"], fohOutput: true, isStereo: true, extraData: {} },
            { id: generateExampleId(), channelNumber: 16, source: "Lead Vocal", description: "SM58 - Emily", tags: ["Essential"], fohOutput: true, isStereo: false, extraData: {} },
            { id: generateExampleId(), channelNumber: 17, source: "BV 1", description: "SM58 - Guitar", tags: ["Essential"], fohOutput: true, isStereo: false, extraData: {} },
            { id: generateExampleId(), channelNumber: 18, source: "BV 2", description: "SM58 - Bass", tags: ["Essential"], fohOutput: true, isStereo: false, extraData: {} },
        ],
    },


    // Lighting Patch List
    lightingPatchList: {
        columns: [],
        rows: [
            { id: generateExampleId(), channelNumber: 1, source: "MAC Aura 1", fixtureType: "Moving Head Wash", dmxAddress: "001", universe: 1, notes: "Upstage Left", extraData: {} },
            { id: generateExampleId(), channelNumber: 2, source: "MAC Aura 2", fixtureType: "Moving Head Wash", dmxAddress: "038", universe: 1, notes: "Upstage Right", extraData: {} },
            { id: generateExampleId(), channelNumber: 3, source: "MAC Aura 3", fixtureType: "Moving Head Wash", dmxAddress: "075", universe: 1, notes: "Downstage Left", extraData: {} },
            { id: generateExampleId(), channelNumber: 4, source: "MAC Aura 4", fixtureType: "Moving Head Wash", dmxAddress: "112", universe: 1, notes: "Downstage Right", extraData: {} },
            { id: generateExampleId(), channelNumber: 5, source: "COLORado 1-4", fixtureType: "LED Wash", dmxAddress: "149", universe: 1, notes: "Backline wash - drummer side", extraData: {} },
            { id: generateExampleId(), channelNumber: 6, source: "COLORado 5-8", fixtureType: "LED Wash", dmxAddress: "181", universe: 1, notes: "Backline wash - guitar side", extraData: {} },
        ],
    },

    // Band Plot
    bandPlotImage: null,
    stagePlotDescription: "Stage layout showing positions for all band members. Lead vocalist (Emily) at front center, drums rear center, keyboards stage left, guitar amp stage right, bass amp center-right. IEM rack is positioned upstage left near the keyboard riser.",
    footerNotes: `IMPORTANT NOTES:
• We require a cleared stage area before our load-in time
• All changes to the patch must be communicated 48 hours in advance
• Our lighting rig requires standard 16A socapex tie-ins
• Please ensure adequate ventilation for our amplifiers
• Dressing room requirements: 2 rooms, one quiet for pre-show prep

THANK YOU for taking the time to read our technical rider!
Contact James Chen for any technical questions.`,

    // PDF Settings
    pdfSettings: DEFAULT_PDF_SETTINGS,
});

