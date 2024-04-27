import type { CachedMetadata } from "obsidian";
import type { CalEvent, CalEventCategory, Calendar } from "src/schemas";

export interface QueueMessage {
    type: "queue";
    paths: string[];
}
export interface OptionsMessage {
    type: "options";
    defaultCalendar: string;
    addToDefaultIfMissing: boolean;
    format: string;
    parseTitle: boolean;
    paths: (readonly [string, string])[];
    inlineEventsTag?: string | null;
    debug: boolean;
}
export interface CalendarsMessage {
    type: "calendars";
    calendars: Calendar[];
}
export interface FileCacheMessage {
    type: "file";
    path: string;
    file: { path: string; basename: string };
    cache: CachedMetadata;
    allTags: string[];
    data: string;
}
export interface GetFileCacheMessage {
    type: "get";
    path: string;
}
export interface NewCategoryMessage {
    type: "category";
    id: string;
    category: CalEventCategory;
}
export interface UpdateEventMessage {
    type: "update";
    id: string;
    index: number;
    event: CalEvent;
    original: CalEvent | undefined;
}
export interface DeleteEventMessage {
    type: "delete";
    id: string;
    path: string;
}

export interface SaveMessage {
    type: "save";
}

export type RenameMessage = {
    type: "rename";
    sourceCalendars: Calendar[];
    file: { path: string; basename: string; oldPath: string };
};
