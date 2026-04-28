
export interface NodeData {
  id: number | string;
  pid?: number | string | null;
  uuid?: string;
  puuid?: string | null;
  label: string;
  x: number;
  y: number;
  marked?: boolean;
  isDetail?: boolean;
  isShared?: boolean;

  children?: NodeData[];
  expanded?: boolean;
  nodeType?: NodeType;
  contentType?: NodeContentType;
  isTempImageUrl?: boolean;
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
}

export type NodeType = "new" | "edited" | "deleted";
export type NodeContentType = 'text' | 'image'

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
