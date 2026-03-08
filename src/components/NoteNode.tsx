import {
  use,
  useEffect,
  useLayoutEffect,
  // useMemo,
  useRef,
  useState,
} from "react";
import PaperContext from "../context/paperContext";
import { findDescendantsByIdInFlatTree } from "../lib";
import type { Size } from "../types/note";
import { useNavigate } from "react-router";
import type { NodeData } from "../types";
import { getImageNodeUrl } from "../utils";

const createNodeMenuEvent = (detail: {
  nodeId: number | string;
  source: "longtap" | "contextmenu";
}) => {
  return new CustomEvent("nodemenu", {
    bubbles: true,
    cancelable: true,
    detail,
  });
};

export default function NoteNode({
  id,
  x,
  y,
  label,
  // expanded,
  marked,
  isDetail,
  contentType,
  imageUrl,
  isTempImageUrl,
}: NodeData) {
  const navigate = useNavigate();

  // context
  const paperContext = use(PaperContext);
  const graphType = paperContext?.graphType;
  const browseMode = paperContext?.browseMode;
  const flatTree = paperContext?.flatTree;
  const editMode = paperContext?.editMode;
  const viewportZoom = paperContext?.viewportZoom;
  const setSelectedNodeId = paperContext?.setSelectedNodeId;
  const nodeMenuRef = paperContext?.nodeMenuRef;
  const isChoosingParent = paperContext?.isChoosingParent;
  const setFlatTree = paperContext?.setFlatTree;
  const setNodeMenuVisible = paperContext?.setNodeMenuVisible;
  const selectedNodeId = paperContext?.selectedNodeId;
  const setChosenParentNodeId = paperContext?.setChosenParentNodeId;

  const gRef = useRef<SVGGElement | null>(null);
  const positionRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
  });

  const tapInfoRef = useRef<{
    timerForLongTap: number | null;
    timerForDoubleTap: number | null;
    startX: number;
    startY: number;
  }>({
    timerForLongTap: null,
    timerForDoubleTap: null,
    startX: 0,
    startY: 0,
  });

  const descendantIdsRef = useRef<(number | string)[]>([]);
  // const hasChildren = useMemo(() => {
  //   return flatTree?.some((item) => item.pid === id);
  // }, [flatTree, id]);

  // used for double tap
  const firstTapRef = useRef(false);

  // node size
  const [nodeSize, setNodeSize] = useState<Size>({
    width: 0,
    height: 0,
  });

  const showOpenMenu = (e: React.MouseEvent<SVGGElement, MouseEvent>) => {
    e.preventDefault();
    if (!editMode) return;

    gRef.current?.dispatchEvent(
      createNodeMenuEvent({
        nodeId: id,
        source: "contextmenu",
      }),
    );
  };

  const handlePointerDown = (e: React.PointerEvent<SVGGElement>) => {
    if (isChoosingParent) {
      // 检查是否选择了自身作为父节点
      if (id === selectedNodeId) {
        alert("new parent node cannot be itself!");
        return;
      }
      // 检查是否选择了子孙节点作为父节点
      if (flatTree && selectedNodeId) {
        const descendants = findDescendantsByIdInFlatTree(flatTree, selectedNodeId);
        if (descendants.some((node) => node.id === id)) {
          alert("new parent node cannot be its descendant!");
          return;
        }
      }
      setChosenParentNodeId?.(id);
      return;
    }

    if (e.pointerType === "mouse") return;

    if (firstTapRef.current === false) {
      firstTapRef.current = true;

      // reset double tap after 200ms
      if (tapInfoRef.current.timerForDoubleTap) {
        clearTimeout(tapInfoRef.current.timerForDoubleTap);
      }

      tapInfoRef.current.timerForDoubleTap = setTimeout(() => {
        tapInfoRef.current.timerForDoubleTap = null;

        if (firstTapRef.current) {
          firstTapRef.current = false;
        }
      }, 200);
    } else {
      // handle double tap
      handleDoubleClick();
      firstTapRef.current = false;
      return;
    }

    // allow long tap only in edit mode
    if (!editMode) return;
    if (!e.isPrimary) return;

    // tap 后开启定时器
    if (tapInfoRef.current.timerForLongTap) {
      clearTimeout(tapInfoRef.current.timerForLongTap);
    }

    // triggerlong tap after 500ms
    tapInfoRef.current.startX = e.clientX;
    tapInfoRef.current.startY = e.clientY;
    tapInfoRef.current.timerForLongTap = setTimeout(() => {
      tapInfoRef.current.timerForLongTap = null;

      gRef.current?.dispatchEvent(
        createNodeMenuEvent({
          nodeId: id,
          source: "longtap",
        }),
      );
    }, 500);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGGElement>) => {
    // allow drag only in edit mode
    if (!editMode) return;

    // reset double tap if moved
    if (firstTapRef.current) {
      firstTapRef.current = false;
    }

    // TODO: 验证交互
    // tap 后移动超过10px，则认为是拖拽，而不是 menu
    if (tapInfoRef.current.timerForLongTap) {
      const deltaX = e.clientX - tapInfoRef.current.startX;
      const deltaY = e.clientY - tapInfoRef.current.startY;
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        clearTimeout(tapInfoRef.current.timerForLongTap);
        tapInfoRef.current.timerForLongTap = null;
      }
    }
  };

  const handlePointerUp = () => {
    if (tapInfoRef.current.timerForLongTap) {
      clearTimeout(tapInfoRef.current.timerForLongTap);
      tapInfoRef.current.timerForLongTap = null;
    }
  };

  const handlePointerCancel = () => {
    if (tapInfoRef.current.timerForLongTap) {
      clearTimeout(tapInfoRef.current.timerForLongTap);
      tapInfoRef.current.timerForLongTap = null;
    }
  };

  const handleDoubleClick = () => {
    if (!browseMode) {
      if (isDetail) {
        navigate(`/noteDetails/${id}`);
      }
    }

    // if (!editMode || !hasChildren) return;
    // const newExpanded = expanded === false ? true : false;

    // setFlatTree?.((prev) => {
    //   return prev.map((item) => {
    //     if (item.id === id) {
    //       return {
    //         ...item,
    //         expanded: newExpanded || newExpanded === undefined,
    //       };
    //     }
    //     return item;
    //   });
    // });
  };

  // drag node
  useEffect(() => {
    const gElem = gRef.current;
    const positionData = positionRef.current;

    const onPointerDown = (e: PointerEvent) => {
      if (!editMode) return;
      positionData.isDragging = true;
      positionData.startX = e.clientX;
      positionData.startY = e.clientY;

      // ⭐ after pointer down, "bind" the current pointer event to the g element.
      gElem?.setPointerCapture(e.pointerId);

      // get descendant nodes
      if (flatTree) {
        descendantIdsRef.current = findDescendantsByIdInFlatTree(
          flatTree,
          id,
        ).map((item) => item.id);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!positionData.isDragging) return;
      // console.log("pm");

      const deltaX = e.clientX - positionData.startX;
      const deltaY = e.clientY - positionData.startY;

      // update state
      setFlatTree?.((prev) => {
        return prev.map((item) => {
          if (item.id === id || descendantIdsRef.current.includes(item.id)) {
            return {
              ...item,
              x: item.x + deltaX * (viewportZoom ?? 1),
              y: item.y + deltaY * (viewportZoom ?? 1),
              nodeType: !item.nodeType ? "edited" : item.nodeType,
            };
          } else {
            return item;
          }
        });
      });

      // update positionRef
      positionData.startX = e.clientX;
      positionData.startY = e.clientY;
    };

    const onPointerUp = () => {
      positionData.isDragging = false;
    };

    gElem?.addEventListener("pointerdown", onPointerDown);
    gElem?.addEventListener("pointermove", onPointerMove);
    gElem?.addEventListener("pointerup", onPointerUp);

    return () => {
      gElem?.removeEventListener("pointerdown", onPointerDown);
      gElem?.removeEventListener("pointermove", onPointerMove);
      gElem?.removeEventListener("pointerup", onPointerUp);
    };
  }, [id, editMode, viewportZoom, flatTree, setFlatTree]);

  // menu event
  useEffect(() => {
    const gElem = gRef.current;

    const onNodeMenu = (
      e: CustomEvent<{
        nodeId: number;
        source: "longtap" | "contextmenu";
      }>,
    ) => {
      // console.log("node menu", e);
      const { left, top, width } = (
        e.target as SVGGElement
      ).getBoundingClientRect();

      setSelectedNodeId?.(e.detail.nodeId);

      nodeMenuRef?.current?.setPosition({
        x: left + width + 12,
        y: top,
      });
      setNodeMenuVisible?.(true);
    };

    gElem?.addEventListener("nodemenu", onNodeMenu as EventListener);

    return () => {
      gElem?.removeEventListener("nodemenu", onNodeMenu as EventListener);
    };
  }, [setSelectedNodeId, nodeMenuRef, setNodeMenuVisible]);

  useEffect(() => {
    return () => {
      if (tapInfoRef.current.timerForLongTap) {
        clearTimeout(tapInfoRef.current.timerForLongTap);
        tapInfoRef.current.timerForLongTap = null;
      }

      if (tapInfoRef.current.timerForDoubleTap) {
        clearTimeout(tapInfoRef.current.timerForDoubleTap);
        tapInfoRef.current.timerForDoubleTap = null;
      }
    };
  }, []);

  return (
    // double tap(double click) -> expand/collapse
    // drag -> move node
    // long tap(right click) -> open menu
    <g
      className={editMode ? "cursor-pointer" : ""}
      key={id}
      transform={`translate(${x}, ${y})`}
      ref={gRef}
      onContextMenu={showOpenMenu}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onDoubleClick={handleDoubleClick}
    >
      {(graphType === "directory" || contentType === "text") && (
        <NodeLabel
          label={label}
          marked={marked}
          isDetail={isDetail}
          size={nodeSize}
          setSize={setNodeSize}
        ></NodeLabel>
      )}

      {contentType === "image" && imageUrl && (
        <NodeImage
          isTempImageUrl={isTempImageUrl}
          imageUrl={imageUrl}
          size={nodeSize}
          setSize={setNodeSize}
        ></NodeImage>
      )}

      {/* expand icon */}
      {/* {editMode && hasChildren && (
        <text
          className="select-none"
          x={0}
          y={nodeLabelSize.height / -2 - 8}
          fill="white"
          textAnchor="middle"
          dominantBaseline="middle"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {expanded === false ? "+" : "-"}
        </text>
      )} */}
    </g>
  );
}

const PADDING_X = 16;
const PADDING_Y = 10;
const TEXT_HEIGHT = 20.5;

interface NodeLabelProps {
  label: string;
  marked?: boolean;
  isDetail?: boolean;
  size: Size;
  setSize: React.Dispatch<React.SetStateAction<Size>>;
}
function NodeLabel({ label, marked, isDetail, size, setSize }: NodeLabelProps) {
  const textList = label.split("\n");
  const textsRef = useRef<Map<number, SVGTextElement>>(new Map());

  const paperContext = use(PaperContext);
  const browseMode = paperContext?.browseMode;

  useLayoutEffect(() => {
    if (textsRef.current) {
      const widthList: number[] = [];

      for (const [, text] of textsRef.current) {
        const bbox = text.getBBox();
        // console.log("Text bounding box:", bbox);

        widthList.push(bbox.width);
      }

      setSize({
        width: Math.max(...widthList) + PADDING_X,
        height: textsRef.current.size * TEXT_HEIGHT + PADDING_Y,
      });
    }
  }, [label, setSize]);

  return (
    <>
      <rect
        x={size.width / -2}
        y={size.height / -2}
        width={size.width}
        height={size.height}
        fill={isDetail ? "var(--color-node-detail)" : "var(--color-node)"}
        rx="6"
        ry="6"
      />

      {textList.map((text, index) => (
        <text
          key={index}
          ref={(node) => {
            if (node) {
              textsRef.current.set(index, node);
            }

            return () => {
              textsRef.current.delete(index);
            };
          }}
          x={size.width / -2 + PADDING_X / 2}
          y={0}
          dy={index * TEXT_HEIGHT + ((textList.length - 1) * TEXT_HEIGHT) / -2}
          fill={marked ? "var(--color-node-marked)" : "white"}
          dominantBaseline="central"
          style={{ fontFamily: "monospace" }}
          className={browseMode ? "select-none" : ""}
          // 给 <text> 元素添加 xml:space="preserve" 属性，可以保留原始空格和换行（类似于 HTML 中的 <pre> 标签）
          xmlSpace="preserve"
        >
          {text}
        </text>
      ))}
    </>
  );
}

interface NodeImageProps {
  isTempImageUrl?: boolean;
  imageUrl: string;
  size: Size;
  setSize: React.Dispatch<React.SetStateAction<Size>>;
}

function NodeImage({
  isTempImageUrl,
  imageUrl,
  size,
  setSize,
}: NodeImageProps) {
  const imageRef = useRef<SVGImageElement | null>(null);

  const onImageLoad = () => {
    if (imageUrl && imageRef.current) {
      const { width, height } = imageRef.current.getBBox();

      setSize({
        width: width + PADDING_X,
        height: height + PADDING_X,
      });
    }
  };

  return (
    <>
      <rect
        x={size.width / -2}
        y={size.height / -2}
        width={size.width}
        height={size.height}
        fill={"var(--color-node)"}
        rx="6"
        ry="6"
      />
      <image
        ref={imageRef}
        href={getImageNodeUrl(imageUrl, isTempImageUrl)}
        x={-size.width / 2 + PADDING_X / 2}
        y={-size.height / 2 + PADDING_X / 2}
        onLoad={onImageLoad}
      />
    </>
  );
}
