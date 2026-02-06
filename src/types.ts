export interface NodeData {
  id: number | string;
  pid?: number | string | null;
  uuid?: string;
  puuid?: string | null;
  label: string;
  x: number;
  y: number;
  marked?: boolean;

  children?: NodeData[];
  expanded?: boolean;
  nodeType?: NodeType;
}

export type NodeType = "new" | "edited" | "deleted";

export interface NoteDetailData {
  /**
   * note detail id
   */
  id: number;
  /**
   * note id
   */
  note_id: number;
}

export interface Point {
  x: number;
  y: number;
}
