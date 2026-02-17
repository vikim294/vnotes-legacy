import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { v4 as uuidv4 } from "uuid";
import {
  findDescendantsByIdInFlatTree,
  // flattenTree,
  getDistanceBetweenTwoPoints,
} from "../../lib";
import Button from "../../components/Button";
import NodeMenu, { type NodeMenuExpose } from "../../components/NodeMenu";
// import { tree, flattenedTree } from "../../mock/nodeData";
import NoteTree from "../../components/NoteTree";
import PaperContext from "../../context/paperContext";
import useModal from "../../components/useModal";
import { type NodeData, type NoteDetailData } from "../../types";
import { useParams } from "react-router";
import { API_BASE_URL } from "../../api";

interface GestureInfo {
  type: "none" | "panning" | "pinchAndZoom";
  startX1: number;
  startY1: number;
  startX2: number;
  startY2: number;
  startD: number;
  centerPointX: number;
  centerPointY: number;
  viewportStartX: number;
  viewportStartY: number;
  viewportStartZoom: number;
}

function NoteDetail() {
  // const [flatTree, setFlatTree] = useState(() => flattenTree(tree));
  // console.log(JSON.stringify(flatTree))
  // const [flatTree, setFlatTree] = useState(flattenedTree);
  const [flatTree, setFlatTree] = useState<NodeData[]>([]);

  const hasMountedRef = useRef(false);

  const [paperSize, setPaperSize] = useState({ width: 0, height: 0 });
  const [viewport, setViewport] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    zoom: 1,
  });
  const viewportRef = useRef(viewport);
  const paperRef = useRef<SVGSVGElement>(null);
  const gestureInfo = useRef<GestureInfo>({
    type: "none",
    startX1: 0,
    startY1: 0,
    startX2: 0,
    startY2: 0,
    startD: 0,
    centerPointX: 0,
    centerPointY: 0,
    viewportStartX: 0,
    viewportStartY: 0,
    viewportStartZoom: 1,
  });

  const [isAllExpanded, setIsAllExpand] = useState(true);

  // edit mode
  const [editMode, setEditMode] = useState(false);
  const [nodeMenuVisible, setNodeMenuVisible] = useState(false);
  const nodeMenuRef = useRef<NodeMenuExpose | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<number | string | null>(
    null,
  );

  // add new node
  const {
    Modal: NewNodeAddModal,
    openModal: openNewNodeAddModal,
    closeModal: closeNewNodeAddModal,
  } = useModal({
    onModalVisible: useCallback(
      () => newNodeAddModalInputRef.current?.focus(),
      [],
    ),
  });
  const newNodeAddModalInputRef = useRef<HTMLTextAreaElement>(null);

  // edit node
  const {
    Modal: NodeEditModal,
    openModal: openNodeEditModal,
    closeModal: closeNodeEditModal,
  } = useModal({
    onModalVisible: useCallback(() => {
      nodeEditModalInputRef.current?.focus();
      // ⚠️ textarea 会把光标移动到文本前面，这里把光标移动到文本后面
      const len = nodeEditModalInputRef.current?.value.length ?? 0;
      nodeEditModalInputRef.current?.setSelectionRange(len, len);
    }, []),
  });
  const [nodeEditContent, setNodeEditContent] = useState("");
  const nodeEditModalInputRef = useRef<HTMLTextAreaElement>(null);

  // add node
  const {
    Modal: NodeAddModal,
    openModal: openNodeAddModal,
    closeModal: closeNodeAddModal,
  } = useModal({
    onModalVisible: useCallback(
      () => nodeAddModalInputRef.current?.focus(),
      [],
    ),
  });
  const nodeAddModalInputRef = useRef<HTMLTextAreaElement>(null);

  // set parent node
  const [isChoosingParent, setIsChoosingParent] = useState(false);
  const [chosenParentNodeId, setChosenParentNodeId] = useState<
    number | string | null
  >(null);

  // delete node
  const {
    Modal: NodeDeleteConfirmModal,
    openModal: openNodeDeleteConfirmModal,
    closeModal: closeNodeDeleteConfirmModal,
  } = useModal();

  // context
  const paperContext = useMemo(
    () => ({
      flatTree,
      editMode,
      viewportZoom: viewport.zoom,
      selectedNodeId,
      setSelectedNodeId,
      nodeMenuRef,
      isChoosingParent,
      setFlatTree,
      setNodeMenuVisible,
      setChosenParentNodeId,
    }),
    [flatTree, editMode, viewport.zoom, selectedNodeId, isChoosingParent],
  );

  // data related
  const { id: noteId } = useParams();
  const [noteDetail, setNoteDetail] = useState<NoteDetailData | null>(null);

  const handleAddNewNode = () => {
    setNodeEditContent("");
    openNewNodeAddModal();
  };

  const handleSaveEdit = async () => {
    // console.log("save edit:", flatTree);

    // added 新增的结点
    // 必有 uuid，无 id，无视 id
    // 如果是新增的子结点，则
    //                     有 puuid（如果是新增结点的子结点）
    //                     有 pid（如果是旧结点的新增子结点）
    // updated 旧结点
    //     必有 id，无视 uuid
    //     如果旧结点只更新了除 pid 之外的数据，pid 没变
    //     如果旧结点更新了 pid 为 某个旧结点的 id
    //     如果旧结点更新了 pid 为 某个新结点的 uuid

    // 保存本次编辑结果到后端 API
    const added: NodeData[] = [];
    const updated: NodeData[] = [];
    const deletedNodeIds: (number | string)[] = [];

    for (const node of flatTree) {
      if (node.nodeType === "new") {
        if (node.puuid !== null) {
          // 是新增结点的新增子结点，要把 pid 置为 null
          added.push({
            ...node,
            pid: null,
          });
        } else {
          added.push(node);
        }
      } else if (node.nodeType === "edited") {
        updated.push(node);
      } else if (node.nodeType === "deleted") {
        deletedNodeIds.push(node.id);
      }
    }

    const params = {
      noteDetailId: noteDetail?.id,
      added,
      updated,
      deletedNodeIds,
    };

    // console.log(added, updated, deletedNodeIds);

    const response = await fetch(`${API_BASE_URL}/noteNodes/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });
    const res = await response.json();
    if (res.code === 0) {
      // 根据返回结果，更新 flatTree
      const newFlatTree = [];

      // added -> update id, pid
      // updated -> update pid
      // deleted -> remove from flatTree

      for (const item of flatTree) {
        if (deletedNodeIds.includes(item.id)) {
          continue;
        } else {
          // reset nodeType
          const newItem: NodeData = { ...item, nodeType: undefined };

          if (res.data.uuidToId[item.id]) {
            newItem.id = res.data.uuidToId[item.id];
          }

          if (item.pid && res.data.uuidToId[item.pid]) {
            newItem.pid = res.data.uuidToId[item.pid];
          }

          newFlatTree.push(newItem);
        }
      }

      setFlatTree(newFlatTree);
      setEditMode(false);
    }
  };

  const handleExitEdit = () => {
    setEditMode(false);
    getNoteDetail();
  };

  const resetZoom = () => {
    setViewport((prev) => ({
      ...prev,
      width: paperSize.width,
      height: paperSize.height,
      zoom: 1,
    }));
  };

  const handleNodeEdit = () => {
    // show the current value
    setNodeEditContent(
      flatTree.find((node) => node.id === selectedNodeId)?.label ?? "",
    );
    openNodeEditModal();
  };

  const handleNodeAddChild = () => {
    setNodeEditContent("");
    openNodeAddModal();
  };

  const handleNodeSetParent = () => {
    setNodeMenuVisible(false);
    setIsChoosingParent(true);
  };

  const handleNodeToggleMark = () => {
    if (!selectedNodeId) return;

    setFlatTree((prev) => {
      return prev.map((node) => {
        if (node.id === selectedNodeId) {
          return {
            ...node,
            marked: !node.marked,
            nodeType: node.nodeType === "new" ? "new" : "edited",
          };
        }
        return node;
      });
    });
  };

  const handleNodeDelete = () => {
    openNodeDeleteConfirmModal();
  };

  const handleNodeMenuClose = () => {
    setNodeMenuVisible(false);
  };

  const handleNewNodeAddConfirm = () => {
    const id = uuidv4();
    const newNode: NodeData = {
      id,
      uuid: id,
      label: nodeEditContent,
      x: viewport.x + viewport.width / 2,
      y: viewport.y + viewport.height / 2,
      pid: null,
      puuid: null,
      nodeType: "new",
    };

    setFlatTree((prev) => [...prev, newNode]);

    closeNewNodeAddModal();
  };

  const handleNodeEditConfirm = () => {
    if (!selectedNodeId) return;

    setFlatTree((prev) => {
      const res = prev.map((node) => {
        if (node.id === selectedNodeId) {
          return {
            ...node,
            label: nodeEditContent,
            nodeType: node.nodeType === "new" ? "new" : "edited",
          } as NodeData;
        } else return node;
      });

      return res;
    });

    closeNodeEditModal();
    handleNodeMenuClose();
  };

  const handleNodeAddConfirm = () => {
    if (!selectedNodeId) return;

    const pNode = flatTree.find(
      (item) => item.id === selectedNodeId,
    ) as NodeData;

    const id = uuidv4();

    let newNode: NodeData | null = null;

    if (pNode.nodeType === "new") {
      // 新结点的新增子结点
      newNode = {
        id,
        uuid: id,
        pid: pNode.id,
        puuid: pNode.uuid,
        label: nodeEditContent,
        x: pNode.x + 100,
        y: pNode.y + 100,
        nodeType: "new",
      };
    } else {
      // 旧结点的新增子结点
      newNode = {
        id,
        uuid: id,
        pid: pNode.id,
        puuid: null,
        label: nodeEditContent,
        x: pNode.x + 100,
        y: pNode.y + 100,
        nodeType: "new",
      };
    }

    setFlatTree((prev) => [...prev, newNode]);

    closeNodeAddModal();
    handleNodeMenuClose();
  };

  const handleNodeDeleteConfirm = () => {
    if (!selectedNodeId) return;

    const nodeIdsToBeDeleted = [
      selectedNodeId,
      ...findDescendantsByIdInFlatTree(flatTree, selectedNodeId).map(
        (item) => item.id,
      ),
    ];

    const newFlatTree: NodeData[] = [];

    for (const node of flatTree) {
      // 待删结点
      if (nodeIdsToBeDeleted.includes(node.id)) {
        // 临时结点不保留
        if (node.nodeType === "new") {
          continue;
        }
        // 旧结点改 deleted
        else {
          newFlatTree.push({
            ...node,
            nodeType: "deleted",
          });
        }
      } else {
        // 非待删结点
        newFlatTree.push(node);
      }
    }

    setFlatTree(newFlatTree);

    closeNodeDeleteConfirmModal();
    handleNodeMenuClose();
  };

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
        })),
      );
    }
  };

  useLayoutEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  useLayoutEffect(() => {
    const updatePaperSize = () => {
      setPaperSize({ width: window.innerWidth, height: window.innerHeight });
    };

    const updateViewport = () => {
      setViewport((prev) => ({
        ...prev,
        width: window.innerWidth,
        height: window.innerHeight,
      }));
    };

    window.addEventListener("resize", updatePaperSize);
    updatePaperSize();
    updateViewport();

    return () => {
      window.removeEventListener("resize", updatePaperSize);
    };
  }, []);

  // panning and pinch & zoom
  useEffect(() => {
    const paperEl = paperRef.current;
    const gestureData = gestureInfo.current;

    const onPointerDown = (e: PointerEvent) => {
      if (e.target !== paperEl && editMode) return;
      // return if it's not left click when clicking
      if (e.pointerType === "mouse" && e.button !== 0) return;

      paperEl?.setPointerCapture(e.pointerId);

      if (e.isPrimary) {
        gestureData.type = "panning";
        gestureData.startX1 = e.clientX;
        gestureData.startY1 = e.clientY;
      } else {
        gestureData.type = "pinchAndZoom";
        gestureData.startX2 = e.clientX;
        gestureData.startY2 = e.clientY;

        const v = viewportRef.current;
        const p1 = { x: gestureData.startX1, y: gestureData.startY1 };
        const p2 = { x: gestureData.startX2, y: gestureData.startY2 };

        gestureData.startD = getDistanceBetweenTwoPoints(p1, p2);
        gestureData.centerPointX = (p1.x + p2.x) / 2;
        gestureData.centerPointY = (p1.y + p2.y) / 2;
        gestureData.viewportStartX = v.x;
        gestureData.viewportStartY = v.y;
        gestureData.viewportStartZoom = v.zoom;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (gestureData.type === "panning") {
        const deltaX = e.clientX - gestureData.startX1;
        const deltaY = e.clientY - gestureData.startY1;

        gestureData.startX1 = e.clientX;
        gestureData.startY1 = e.clientY;

        setViewport((prev) => ({
          ...prev,
          x: prev.x + -deltaX * prev.zoom,
          y: prev.y + -deltaY * prev.zoom,
        }));
      } else if (gestureData.type === "pinchAndZoom") {
        let newD = 0;
        let p1 = { x: e.clientX, y: e.clientY };
        let p2 = { x: e.clientX, y: e.clientY };

        if (e.isPrimary) {
          p2 = { x: gestureData.startX2, y: gestureData.startY2 };
          // 更新 gestureData
          gestureData.startX1 = e.clientX;
          gestureData.startY1 = e.clientY;
        } else {
          p1 = { x: gestureData.startX1, y: gestureData.startY1 };
          // 更新 gestureData
          gestureData.startX2 = e.clientX;
          gestureData.startY2 = e.clientY;
        }

        newD = getDistanceBetweenTwoPoints(p1, p2);

        let newZoom = gestureData.viewportStartZoom;

        // startD: newD = startZoom: newZoom
        const ratio = newD / gestureData.startD;
        if (ratio !== 1) {
          // zoom in or zoom out
          newZoom = (1 / ratio) * gestureData.viewportStartZoom;
        }

        if (newZoom === 0) return;

        // the position ratio of pointer in the paper
        const ratioX = gestureData.centerPointX / paperSize.width;
        const ratioY = gestureData.centerPointY / paperSize.height;
        const deltaX =
          paperSize.width * -(newZoom - gestureData.viewportStartZoom) * ratioX;
        const deltaY =
          paperSize.height *
          -(newZoom - gestureData.viewportStartZoom) *
          ratioY;

        setViewport({
          x: gestureData.viewportStartX + deltaX,
          y: gestureData.viewportStartY + deltaY,
          width: paperSize.width * newZoom,
          height: paperSize.height * newZoom,
          zoom: newZoom,
        });
      }
    };

    const onPointerUp = () => {
      gestureData.type = "none";
    };

    const touchHandler = (e: TouchEvent) => {
      e.preventDefault();
    };

    // https://javascript.info/default-browser-action#the-passive-handler-option
    // The optional passive: true option of addEventListener signals the browser that the handler is not going to call preventDefault().
    // For some browsers (Firefox, Chrome), passive is true by default for touchstart and touchmove events.
    // passive: false 使得 e.preventDefault() 能够生效
    paperEl?.addEventListener("touchstart", touchHandler, {
      passive: false,
    });
    paperEl?.addEventListener("touchmove", touchHandler, {
      passive: false,
    });

    paperEl?.addEventListener("pointerdown", onPointerDown);
    paperEl?.addEventListener("pointermove", onPointerMove);
    paperEl?.addEventListener("pointerup", onPointerUp);

    return () => {
      paperEl?.removeEventListener("touchstart", touchHandler);
      paperEl?.removeEventListener("touchmove", touchHandler);

      paperEl?.removeEventListener("pointerdown", onPointerDown);
      paperEl?.removeEventListener("pointermove", onPointerMove);
      paperEl?.removeEventListener("pointerup", onPointerUp);
    };
  }, [paperSize, editMode]);

  // zooming
  useEffect(() => {
    const paperEl = paperRef.current;

    const onWheel = (e: WheelEvent) => {
      // console.log(e);

      setViewport((prev) => {
        const zoom = prev.zoom;
        let newZoom = prev.zoom;

        if (e.deltaY < 0) {
          // up -> zoom in
          newZoom /= 1.1;
        } else if (e.deltaY > 0) {
          // down -> zoom out
          newZoom *= 1.1;
        }

        // console.log(newZoom)

        // the position ratio of pointer in the paper
        const ratioX = e.clientX / paperSize.width;
        const ratioY = e.clientY / paperSize.height;
        const deltaX = paperSize.width * -(newZoom - zoom) * ratioX;
        const deltaY = paperSize.height * -(newZoom - zoom) * ratioY;

        return {
          x: prev.x + deltaX,
          y: prev.y + deltaY,
          width: paperSize.width * newZoom,
          height: paperSize.height * newZoom,
          zoom: newZoom,
        };
      });
    };

    paperEl?.addEventListener("wheel", onWheel);

    return () => {
      paperEl?.removeEventListener("wheel", onWheel);
    };
  }, [paperSize]);

  useEffect(() => {
    if (noteId) {
      // fetch note detail
      getNoteDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  useEffect(() => {
    if (hasMountedRef.current) return;

    if (flatTree.length > 0 && viewport.width > 0 && viewport.height > 0) {
      hasMountedRef.current = true;

      const firstRootNode = flatTree.find(
        (node) => node.pid === null,
      ) as NodeData;

      setViewport((prev) => ({
        ...prev,
        x: firstRootNode.x - viewport.width / 2,
        y: firstRootNode.y - viewport.height / 2,
      }));
    }
  }, [flatTree, viewport.width, viewport.height]);

  return (
    <PaperContext value={paperContext}>
      <div className="h-screen bg-black">
        <svg
          ref={paperRef}
          width={paperSize.width}
          height={paperSize.height}
          // ⭐ viewBox 会先应用 x 和 y，然后才应用 width 和 height
          // viewBox 的效果：以 (x, y) 为左上角，显示 width × height 区域，并投影到 svg 画布上
          viewBox={`${viewport.x} ${viewport.y} ${viewport.width} ${viewport.height}`}
          onContextMenu={(e) => e.preventDefault()}
        >
          <NoteTree flatTree={flatTree} />
        </svg>
        <div className="text-surface fixed top-0 right-0">
          {viewport.zoom !== 1 && (
            <button
              onClick={resetZoom}
              className="hover:text-primary cursor-pointer transition-colors"
            >
              {viewport.zoom.toFixed(2)} reset zoom
            </button>
          )}
        </div>

        {!isChoosingParent && chosenParentNodeId === null && (
          <div className="fixed top-25 right-0">
            {/* expand/collapse all button */}
            <div>
              <Button
                onClick={() => {
                  const newValue = !isAllExpanded;

                  setFlatTree((prev) =>
                    prev.map((item) => ({
                      ...item,
                      expanded: newValue ? true : false,
                    })),
                  );

                  setIsAllExpand(newValue);
                }}
              >
                {isAllExpanded ? "collapseAll" : "expandAll"}
              </Button>
            </div>

            {/* edit mode */}
            {!editMode && (
              <Button type="primary" onClick={() => setEditMode(true)}>
                edit mode
              </Button>
            )}

            {editMode && (
              <>
                <div>
                  <Button type="secondary" onClick={handleAddNewNode}>
                    add new node
                  </Button>
                </div>
                <div>
                  <Button type="primary" onClick={handleSaveEdit}>
                    save
                  </Button>
                </div>
                <div>
                  <Button onClick={handleExitEdit}>exit</Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* node menu */}
        <NodeMenu
          ref={nodeMenuRef}
          visible={nodeMenuVisible}
          onEdit={handleNodeEdit}
          onAddChild={handleNodeAddChild}
          onSetParent={handleNodeSetParent}
          onToggleMark={handleNodeToggleMark}
          onDelete={handleNodeDelete}
          onClose={handleNodeMenuClose}
        />

        {/* choosing a parent node */}
        {isChoosingParent && chosenParentNodeId === null && (
          <div className="fixed top-10 left-1/2 -translate-x-1/2 text-white">
            please choose a parent node
          </div>
        )}
        {chosenParentNodeId !== null && (
          <div className="fixed top-10 left-1/2 flex -translate-x-1/2 gap-2">
            <Button
              onClick={() => {
                setIsChoosingParent(false);
                setChosenParentNodeId(null);
                setNodeMenuVisible(true);
              }}
            >
              cancel
            </Button>
            <Button
              onClick={() => {
                // set parent node
                setFlatTree((prev) =>
                  prev.map((item) => {
                    if (item.id === selectedNodeId) {
                      const pNode = prev.find(
                        (item) => item.id === chosenParentNodeId,
                      ) as NodeData;

                      if (pNode.nodeType === "new") {
                        // 旧结点把 新增结点设为了父结点
                        return {
                          ...item,
                          pid: chosenParentNodeId,
                          puuid: pNode.uuid,
                          nodeType: item.nodeType === "new" ? "new" : "edited",
                        };
                      } else {
                        // 旧结点把 另一个旧结点设为了父结点
                        return {
                          ...item,
                          pid: chosenParentNodeId,
                          puuid: null,
                          nodeType: item.nodeType === "new" ? "new" : "edited",
                        };
                      }
                    }
                    return item;
                  }),
                );
                setIsChoosingParent(false);
                setChosenParentNodeId(null);
                handleNodeMenuClose();
              }}
            >
              confirm
            </Button>
          </div>
        )}

        {/* modals */}
        <>
          <NewNodeAddModal
            width={800}
            header="添加新结点"
            footer={
              <div>
                <Button onClick={closeNewNodeAddModal}>取消</Button>
                <Button type="primary" onClick={handleNewNodeAddConfirm}>
                  确认
                </Button>
              </div>
            }
          >
            <textarea
              ref={newNodeAddModalInputRef}
              className="bg-textarea w-full resize-none p-2 outline-none"
              rows={6}
              maxLength={500}
              value={nodeEditContent}
              onChange={(e) => setNodeEditContent(e.target.value)}
            />
          </NewNodeAddModal>

          <NodeEditModal
            width={800}
            header="编辑结点"
            footer={
              <div>
                <Button onClick={closeNodeEditModal}>取消</Button>
                <Button type="primary" onClick={handleNodeEditConfirm}>
                  确认
                </Button>
              </div>
            }
          >
            <textarea
              ref={nodeEditModalInputRef}
              className="bg-textarea w-full resize-none p-2 outline-none"
              rows={6}
              maxLength={500}
              value={nodeEditContent}
              onChange={(e) => setNodeEditContent(e.target.value)}
            />
          </NodeEditModal>

          <NodeAddModal
            width={800}
            header="添加子结点"
            footer={
              <div>
                <Button onClick={closeNodeAddModal}>取消</Button>
                <Button type="primary" onClick={handleNodeAddConfirm}>
                  确认
                </Button>
              </div>
            }
          >
            <textarea
              ref={nodeAddModalInputRef}
              className="bg-textarea w-full resize-none p-2 outline-none"
              rows={6}
              maxLength={500}
              value={nodeEditContent}
              onChange={(e) => setNodeEditContent(e.target.value)}
            />
          </NodeAddModal>

          <NodeDeleteConfirmModal
            header="确认要删除该结点吗？"
            footer={
              <div>
                <Button onClick={closeNodeDeleteConfirmModal}>取消</Button>
                <Button type="primary" onClick={handleNodeDeleteConfirm}>
                  确认
                </Button>
              </div>
            }
          ></NodeDeleteConfirmModal>
        </>
      </div>
    </PaperContext>
  );
}

export default NoteDetail;
