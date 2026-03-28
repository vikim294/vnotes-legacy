import { useEffect, useState } from "react";

import { type NodeData, type NoteDetailData } from "../../types";
import { useParams, useSearchParams } from "react-router";
import { API_BASE_URL } from "../../api";
import NoteGraph from "../../components/NoteGraph";

function NoteDetail() {
  const [flatTree, setFlatTree] = useState<NodeData[]>([]);

  // data related
  const { id: noteId } = useParams();
  const [ searchParams ] = useSearchParams();
  const noteTitle = searchParams.get("label") || "Untitled Note";
  const [noteDetail, setNoteDetail] = useState<NoteDetailData | null>(null);

  const getNoteDetail = async () => {
    const response = await fetch(`${API_BASE_URL}/noteDetails/${noteId}`);
    const res = await response.json();
    if (res.code === 0) {
      setNoteDetail(res.data.detail);
      setFlatTree(
        res.data.nodes.map((node: NodeData) => ({
          ...node,
          x: Number(node.x),
          y: Number(node.y),
          imageWidth: Number(node.imageWidth),
          imageHeight: Number(node.imageHeight),
        })),
      );
    }
  };

  useEffect(() => {
    if (noteId) {
      // fetch note detail
      getNoteDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  return (
    <NoteGraph
      graphType="detail"
      noteTitle={noteTitle}
      noteDetail={noteDetail}
      flatTree={flatTree}
      setFlatTree={setFlatTree}
      onExitEdit={getNoteDetail}
    />
  );
}

export default NoteDetail;
