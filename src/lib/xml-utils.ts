import type {
    TechSpecData,
    DynamicTableData,
    SendListData,
    LightingPatchListData,
    TableColumn,
    TableRow,
    SendListRow,
    LightingPatchRow,
    ContactInfo,
    PDFExportSettings,
} from "@/types";
import { DEFAULT_PDF_SETTINGS } from "@/types";

// Helper to escape XML special characters
const escapeXml = (str: string): string => {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
};

// Helper to unescape XML special characters
const unescapeXml = (str: string): string => {
    return str
        .replace(/&apos;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&gt;/g, ">")
        .replace(/&lt;/g, "<")
        .replace(/&amp;/g, "&");
};

const columnToXml = (col: TableColumn): string => {
    return `      <column id="${escapeXml(col.id)}" name="${escapeXml(col.name)}" dataType="${col.dataType}" />`;
};

const rowToXml = (row: TableRow): string => {
    const dataEntries = Object.entries(row.data)
        .map(([key, value]) => `        <field key="${escapeXml(key)}">${escapeXml(String(value))}</field>`)
        .join("\n");
    const tags = row.tags.map((tag) => `        <tag>${escapeXml(tag)}</tag>`).join("\n");
    return `      <row id="${escapeXml(row.id)}">
${dataEntries}
        <tags>
${tags}
        </tags>
      </row>`;
};

const sendListRowToXml = (row: SendListRow): string => {
    const extraDataEntries = Object.entries(row.extraData)
        .map(([key, value]) => `        <extraField key="${escapeXml(key)}">${escapeXml(String(value))}</extraField>`)
        .join("\n");
    const tags = row.tags.map((tag) => `        <tag>${escapeXml(tag)}</tag>`).join("\n");
    const channelNumber2Xml = row.channelNumber2 !== undefined ? `
        <channelNumber2>${row.channelNumber2}</channelNumber2>` : "";
    return `      <sendListRow id="${escapeXml(row.id)}">
        <channelNumber>${row.channelNumber}</channelNumber>${channelNumber2Xml}
        <source>${escapeXml(row.source)}</source>
        <description>${escapeXml(row.description)}</description>
        <fohOutput>${row.fohOutput}</fohOutput>
        <isStereo>${row.isStereo}</isStereo>
${extraDataEntries}
        <tags>
${tags}
        </tags>
      </sendListRow>`;
};

const lightingPatchRowToXml = (row: LightingPatchRow): string => {
    const extraDataEntries = Object.entries(row.extraData)
        .map(([key, value]) => `        <extraField key="${escapeXml(key)}">${escapeXml(String(value))}</extraField>`)
        .join("\n");
    return `      <lightingPatchRow id="${escapeXml(row.id)}">
        <channelNumber>${row.channelNumber}</channelNumber>
        <source>${escapeXml(row.source)}</source>
        <fixtureType>${escapeXml(row.fixtureType)}</fixtureType>
        <universe>${row.universe}</universe>
        <dmxAddress>${escapeXml(row.dmxAddress)}</dmxAddress>
        <notes>${escapeXml(row.notes)}</notes>
${extraDataEntries}
      </lightingPatchRow>`;
};

const dynamicTableToXml = (table: DynamicTableData, name: string): string => {
    const columns = table.columns.map(columnToXml).join("\n");
    const rows = table.rows.map(rowToXml).join("\n");
    return `  <${name}>
    <columns>
${columns}
    </columns>
    <rows>
${rows}
    </rows>
  </${name}>`;
};

const sendListToXml = (sendList: SendListData): string => {
    const columns = sendList.columns.map(columnToXml).join("\n");
    const rows = sendList.rows.map(sendListRowToXml).join("\n");
    return `  <sendList>
    <columns>
${columns}
    </columns>
    <rows>
${rows}
    </rows>
  </sendList>`;
};

const lightingPatchListToXml = (list: LightingPatchListData): string => {
    const columns = list.columns.map(columnToXml).join("\n");
    const rows = list.rows.map(lightingPatchRowToXml).join("\n");
    return `  <lightingPatchList>
    <columns>
${columns}
    </columns>
    <rows>
${rows}
    </rows>
  </lightingPatchList>`;
};

const contactToXml = (contact: ContactInfo): string => {
    const responsibilities = contact.responsibilities
        .map((r) => `      <responsibility>${escapeXml(r)}</responsibility>`)
        .join("\n");
    return `    <contact id="${escapeXml(contact.id)}">
      <name><![CDATA[${contact.name}]]></name>
      <phone><![CDATA[${contact.phone}]]></phone>
      <email><![CDATA[${contact.email}]]></email>
      <responsibilities>
${responsibilities}
      </responsibilities>
    </contact>`;
};

const contactsToXml = (contacts: ContactInfo[]): string => {
    if (contacts.length === 0) {
        return `  <contacts></contacts>`;
    }
    const contactsXml = contacts.map(contactToXml).join("\n");
    return `  <contacts>
${contactsXml}
  </contacts>`;
};

const pdfSettingsToXml = (settings: PDFExportSettings): string => {
    return `  <pdfSettings>
    <fontFamily>${settings.fontFamily}</fontFamily>
    <primaryColor>${settings.primaryColor}</primaryColor>
    <accentColor>${settings.accentColor}</accentColor>
    <showLogoOnAllPages>${settings.showLogoOnAllPages}</showLogoOnAllPages>
    <includeCoverPage>${settings.includeCoverPage}</includeCoverPage>
    <includeAboutSection>${settings.includeAboutSection}</includeAboutSection>
    <includeContactsSection>${settings.includeContactsSection}</includeContactsSection>
    <includeStageReqsSection>${settings.includeStageReqsSection}</includeStageReqsSection>
    <includeEquipmentSection>${settings.includeEquipmentSection}</includeEquipmentSection>
    <includeVenueNeedsSection>${settings.includeVenueNeedsSection}</includeVenueNeedsSection>
    <includeSendListSection>${settings.includeSendListSection}</includeSendListSection>
    <includeLightingSection>${settings.includeLightingSection}</includeLightingSection>
    <includeStagePlotSection>${settings.includeStagePlotSection}</includeStagePlotSection>
    <includeFooterNotes>${settings.includeFooterNotes}</includeFooterNotes>
  </pdfSettings>`;
};

export const exportToXML = (data: TechSpecData): string => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<techSpec>
  <bandName><![CDATA[${data.bandName}]]></bandName>
  <riderVersion><![CDATA[${data.riderVersion}]]></riderVersion>
  <lastUpdated>${data.lastUpdated}</lastUpdated>
  <aboutYou><![CDATA[${data.aboutYou}]]></aboutYou>
  <bandLogo>${data.bandLogo ? `<![CDATA[${data.bandLogo}]]>` : ""}</bandLogo>
  <hasBringingLighting>${data.hasBringingLighting}</hasBringingLighting>
${contactsToXml(data.contacts)}
  <stageWidth><![CDATA[${data.stageWidth}]]></stageWidth>
  <stageDepth><![CDATA[${data.stageDepth}]]></stageDepth>
  <stageDimensionsNotNeeded>${data.stageDimensionsNotNeeded}</stageDimensionsNotNeeded>
  <powerRequirements><![CDATA[${data.powerRequirements}]]></powerRequirements>
  <powerNotNeeded>${data.powerNotNeeded}</powerNotNeeded>
  <monitorRequirements><![CDATA[${data.monitorRequirements}]]></monitorRequirements>
  <monitorsNotNeeded>${data.monitorsNotNeeded}</monitorsNotNeeded>
  <soundcheckDuration><![CDATA[${data.soundcheckDuration}]]></soundcheckDuration>
  <loadInNotes><![CDATA[${data.loadInNotes}]]></loadInNotes>
  <soundcheckNotNeeded>${data.soundcheckNotNeeded}</soundcheckNotNeeded>
${dynamicTableToXml(data.whatYouBring, "whatYouBring")}
${dynamicTableToXml(data.venueNeeds, "venueNeeds")}
${sendListToXml(data.sendList)}
${lightingPatchListToXml(data.lightingPatchList)}
  <bandPlot>
    <image>${data.bandPlotImage ? `<![CDATA[${data.bandPlotImage}]]>` : ""}</image>
    <description><![CDATA[${data.stagePlotDescription}]]></description>
    <footerNotes><![CDATA[${data.footerNotes}]]></footerNotes>
  </bandPlot>
${pdfSettingsToXml(data.pdfSettings)}
</techSpec>`;
    return xml;
};

export const downloadXML = (xmlString: string, filename: string = "tech-spec.xml"): void => {
    const blob = new Blob([xmlString], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// XML Parser helpers
const getTextContent = (element: Element | null): string => {
    if (!element) return "";
    // Handle CDATA sections
    const text = element.textContent || "";
    return unescapeXml(text);
};

const parseColumns = (columnsElement: Element | null): TableColumn[] => {
    if (!columnsElement) return [];
    const columnElements = columnsElement.querySelectorAll("column");
    return Array.from(columnElements).map((col) => ({
        id: col.getAttribute("id") || "",
        name: col.getAttribute("name") || "",
        dataType: (col.getAttribute("dataType") as TableColumn["dataType"]) || "text",
    }));
};

const parseRows = (rowsElement: Element | null): TableRow[] => {
    if (!rowsElement) return [];
    const rowElements = rowsElement.querySelectorAll(":scope > row");
    return Array.from(rowElements).map((row) => {
        const fields = row.querySelectorAll("field");
        const data: Record<string, string | number | boolean> = {};
        fields.forEach((field) => {
            const key = field.getAttribute("key") || "";
            const value = getTextContent(field);
            // Try to parse as number or boolean
            if (value === "true") data[key] = true;
            else if (value === "false") data[key] = false;
            else if (!isNaN(Number(value)) && value !== "") data[key] = Number(value);
            else data[key] = value;
        });

        const tagElements = row.querySelectorAll("tags > tag");
        const tags = Array.from(tagElements).map((t) => getTextContent(t));

        return {
            id: row.getAttribute("id") || "",
            data,
            tags,
        };
    });
};

const parseSendListRows = (rowsElement: Element | null): SendListRow[] => {
    if (!rowsElement) return [];
    const rowElements = rowsElement.querySelectorAll("sendListRow");
    return Array.from(rowElements).map((row) => {
        const extraFields = row.querySelectorAll("extraField");
        const extraData: Record<string, string | number | boolean> = {};
        extraFields.forEach((field) => {
            const key = field.getAttribute("key") || "";
            const value = getTextContent(field);
            if (value === "true") extraData[key] = true;
            else if (value === "false") extraData[key] = false;
            else if (!isNaN(Number(value)) && value !== "") extraData[key] = Number(value);
            else extraData[key] = value;
        });

        const tagElements = row.querySelectorAll("tags > tag");
        const tags = Array.from(tagElements).map((t) => getTextContent(t));

        const fohOutputText = getTextContent(row.querySelector("fohOutput"));
        const isStereoText = getTextContent(row.querySelector("isStereo"));
        const channelNumber2Text = getTextContent(row.querySelector("channelNumber2"));

        return {
            id: row.getAttribute("id") || "",
            channelNumber: parseInt(getTextContent(row.querySelector("channelNumber")), 10) || 0,
            channelNumber2: channelNumber2Text ? parseInt(channelNumber2Text, 10) : undefined,
            source: getTextContent(row.querySelector("source")),
            description: getTextContent(row.querySelector("description")),
            fohOutput: fohOutputText === "true",
            isStereo: isStereoText === "true",
            extraData,
            tags,
        };
    });
};

const parseLightingPatchListRows = (rowsElement: Element | null): LightingPatchRow[] => {
    if (!rowsElement) return [];
    const rowElements = rowsElement.querySelectorAll("lightingPatchRow");
    return Array.from(rowElements).map((row) => {
        const extraFields = row.querySelectorAll("extraField");
        const extraData: Record<string, string | number | boolean> = {};
        extraFields.forEach((field) => {
            const key = field.getAttribute("key") || "";
            const value = getTextContent(field);
            if (value === "true") extraData[key] = true;
            else if (value === "false") extraData[key] = false;
            else if (!isNaN(Number(value)) && value !== "") extraData[key] = Number(value);
            else extraData[key] = value;
        });

        return {
            id: row.getAttribute("id") || "",
            channelNumber: parseInt(getTextContent(row.querySelector("channelNumber")), 10) || 0,
            source: getTextContent(row.querySelector("source")),
            fixtureType: getTextContent(row.querySelector("fixtureType")),
            universe: parseInt(getTextContent(row.querySelector("universe")), 10) || 1,
            dmxAddress: getTextContent(row.querySelector("dmxAddress")),
            notes: getTextContent(row.querySelector("notes")),
            extraData,
        };
    });
};

const parseDynamicTable = (element: Element | null): DynamicTableData => {
    if (!element) {
        return { columns: [], rows: [] };
    }
    return {
        columns: parseColumns(element.querySelector("columns")),
        rows: parseRows(element.querySelector("rows")),
    };
};

const parseSendList = (element: Element | null): SendListData => {
    if (!element) {
        return { columns: [], rows: [] };
    }
    return {
        columns: parseColumns(element.querySelector("columns")),
        rows: parseSendListRows(element.querySelector("rows")),
    };
};

const parseLightingPatchList = (element: Element | null): LightingPatchListData => {
    if (!element) {
        return { columns: [], rows: [] };
    }
    return {
        columns: parseColumns(element.querySelector("columns")),
        rows: parseLightingPatchListRows(element.querySelector("rows")),
    };
};

const parseContact = (element: Element): ContactInfo => {
    const responsibilitiesElement = element.querySelector("responsibilities");
    const responsibilities = responsibilitiesElement
        ? Array.from(responsibilitiesElement.querySelectorAll("responsibility")).map(
            (r) => getTextContent(r) as ContactInfo["responsibilities"][number]
        )
        : [];

    return {
        id: element.getAttribute("id") || Math.random().toString(36).substring(2, 11),
        name: getTextContent(element.querySelector("name")),
        phone: getTextContent(element.querySelector("phone")),
        email: getTextContent(element.querySelector("email")),
        responsibilities,
    };
};

const parseContacts = (element: Element | null): ContactInfo[] => {
    if (!element) return [];
    const contactElements = element.querySelectorAll("contact");
    return Array.from(contactElements).map(parseContact);
};

const parsePdfSettings = (element: Element | null): PDFExportSettings => {
    if (!element) return DEFAULT_PDF_SETTINGS;

    // Helper to get boolean with default value fallback
    const getBool = (tag: string, defaultVal: boolean): boolean => {
        const val = getTextContent(element.querySelector(tag));
        return val === "" ? defaultVal : val === "true";
    };

    return {
        fontFamily: (getTextContent(element.querySelector("fontFamily")) as PDFExportSettings["fontFamily"]) || DEFAULT_PDF_SETTINGS.fontFamily,
        primaryColor: getTextContent(element.querySelector("primaryColor")) || DEFAULT_PDF_SETTINGS.primaryColor,
        accentColor: getTextContent(element.querySelector("accentColor")) || DEFAULT_PDF_SETTINGS.accentColor,
        showLogoOnAllPages: getBool("showLogoOnAllPages", DEFAULT_PDF_SETTINGS.showLogoOnAllPages),
        includeCoverPage: getBool("includeCoverPage", DEFAULT_PDF_SETTINGS.includeCoverPage),
        includeAboutSection: getBool("includeAboutSection", DEFAULT_PDF_SETTINGS.includeAboutSection),
        includeContactsSection: getBool("includeContactsSection", DEFAULT_PDF_SETTINGS.includeContactsSection),
        includeStageReqsSection: getBool("includeStageReqsSection", DEFAULT_PDF_SETTINGS.includeStageReqsSection),
        includeEquipmentSection: getBool("includeEquipmentSection", DEFAULT_PDF_SETTINGS.includeEquipmentSection),
        includeVenueNeedsSection: getBool("includeVenueNeedsSection", DEFAULT_PDF_SETTINGS.includeVenueNeedsSection),
        includeSendListSection: getBool("includeSendListSection", DEFAULT_PDF_SETTINGS.includeSendListSection),
        includeLightingSection: getBool("includeLightingSection", DEFAULT_PDF_SETTINGS.includeLightingSection),
        includeStagePlotSection: getBool("includeStagePlotSection", DEFAULT_PDF_SETTINGS.includeStagePlotSection),
        includeFooterNotes: getBool("includeFooterNotes", DEFAULT_PDF_SETTINGS.includeFooterNotes),
    };
};

export const parseXML = async (file: File): Promise<TechSpecData> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const parser = new DOMParser();
                const doc = parser.parseFromString(text, "application/xml");

                // Check for parsing errors
                const parseError = doc.querySelector("parsererror");
                if (parseError) {
                    throw new Error("Invalid XML file");
                }

                const techSpec = doc.querySelector("techSpec");
                if (!techSpec) {
                    throw new Error("Invalid tech spec file format");
                }

                const hasBringingLightingText = getTextContent(techSpec.querySelector("hasBringingLighting"));

                const data: TechSpecData = {
                    // Document Metadata
                    bandName: getTextContent(techSpec.querySelector("bandName")),
                    riderVersion: getTextContent(techSpec.querySelector("riderVersion")) || "1.0",
                    lastUpdated: getTextContent(techSpec.querySelector("lastUpdated")) || new Date().toISOString().split("T")[0],

                    // About You
                    aboutYou: getTextContent(techSpec.querySelector("aboutYou")),
                    bandLogo: getTextContent(techSpec.querySelector("bandLogo")) || null,
                    hasBringingLighting: hasBringingLightingText === "true",

                    // Contact Information (dynamic list)
                    contacts: parseContacts(techSpec.querySelector("contacts")),

                    // Stage & Technical Requirements
                    stageWidth: getTextContent(techSpec.querySelector("stageWidth")),
                    stageDepth: getTextContent(techSpec.querySelector("stageDepth")),
                    stageDimensionsNotNeeded: getTextContent(techSpec.querySelector("stageDimensionsNotNeeded")) === "true",
                    powerRequirements: getTextContent(techSpec.querySelector("powerRequirements")),
                    powerNotNeeded: getTextContent(techSpec.querySelector("powerNotNeeded")) === "true",
                    monitorRequirements: getTextContent(techSpec.querySelector("monitorRequirements")),
                    monitorsNotNeeded: getTextContent(techSpec.querySelector("monitorsNotNeeded")) === "true",
                    soundcheckDuration: getTextContent(techSpec.querySelector("soundcheckDuration")),
                    loadInNotes: getTextContent(techSpec.querySelector("loadInNotes")),
                    soundcheckNotNeeded: getTextContent(techSpec.querySelector("soundcheckNotNeeded")) === "true",

                    // Equipment Lists
                    whatYouBring: parseDynamicTable(techSpec.querySelector("whatYouBring")),
                    venueNeeds: parseDynamicTable(techSpec.querySelector("venueNeeds")),
                    sendList: parseSendList(techSpec.querySelector("sendList")),
                    lightingPatchList: parseLightingPatchList(techSpec.querySelector("lightingPatchList")),

                    // Band Plot
                    bandPlotImage: getTextContent(techSpec.querySelector("bandPlot > image")) || null,
                    stagePlotDescription: getTextContent(techSpec.querySelector("bandPlot > description")),
                    footerNotes: getTextContent(techSpec.querySelector("bandPlot > footerNotes")),

                    // PDF Settings
                    pdfSettings: parsePdfSettings(techSpec.querySelector("pdfSettings")),
                };

                resolve(data);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsText(file);
    });
};

