export const STORAGE_KEY_PREFIX = "craftjs_preview_json";
export const PERSISTENT_STORAGE_KEY_PREFIX = "craftjs_preview_persist";
export const UI_STATE_KEY_PREFIX = "craftjs_editor_ui";

// These must match the Viewport constants for proper page positioning
export const PAGE_GRID_ORIGIN_X = 30000;
export const PAGE_GRID_ORIGIN_Y = 30000;
export const PAGE_BASE_WIDTH = 1920;
export const PAGE_BASE_HEIGHT = 1200;

export const EMPTY_FRAME_DATA = JSON.stringify({
  ROOT: {
    type: { resolvedName: "Viewport" },
    isCanvas: true,
    props: {},
    displayName: "Viewport",
    custom: {},
    hidden: false,
    nodes: ["page-1"],
    linkedNodes: {},
  },
  "page-1": {
    type: { resolvedName: "Page" },
    isCanvas: true,
    props: {
      pageName: "Page 1",
      pageSlug: "page-0",
      canvasX: PAGE_GRID_ORIGIN_X,
      canvasY: PAGE_GRID_ORIGIN_Y,
      height: "1200px",
      background: "#ffffff"
    },
    displayName: "Page",
    custom: {},
    parent: "ROOT",
    hidden: false,
    nodes: [],
    linkedNodes: {},
  },
});

export const LEFT_PANEL_DEFAULT_WIDTH = 320;
export const RIGHT_PANEL_DEFAULT_WIDTH = 420;
export const MIN_PANEL_WIDTH = 200;
export const MAX_PANEL_WIDTH = 600;
export const MIN_CANVAS_VIEWPORT_WIDTH = 760;
export const TOP_PANEL_HEIGHT_PX = 48;
export const INFINITE_CANVAS_WIDTH_VW = 4000;
export const INFINITE_CANVAS_HEIGHT_VH = 4000;
export const INFINITE_CANVAS_PADDING_PX = 30000;

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export type EditorShellProps = {
  projectId: string;
  pageId?: string | null;
};
