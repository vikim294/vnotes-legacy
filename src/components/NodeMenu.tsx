import { createPortal } from "react-dom";
import Button from "./Button";
import {
  use,
  useImperativeHandle,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import PaperContext from "../context/paperContext";

export interface NodeMenuExpose {
  setPosition: Dispatch<SetStateAction<{ x: number; y: number }>>;
}

interface NodeMenuProps {
  ref: React.RefObject<NodeMenuExpose | null>;
  visible: boolean;
  onEdit: () => void;
  onAddChild: () => void;
  onSetParent: () => void;
  onDisconnectFromParent: () => void;
  onToggleMark: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function NodeMenu({
  ref,
  visible,
  onEdit,
  onAddChild,
  onSetParent,
  onDisconnectFromParent,
  onToggleMark,
  onDelete,
  onClose,
}: NodeMenuProps) {
  const paperContext = use(PaperContext);
  const graphType = paperContext?.graphType;
  const flatTree = paperContext?.flatTree;
  const selectedNodeId = paperContext?.selectedNodeId;
  const selectedNode = useMemo(() => {
    return flatTree?.find((node) => node.id === selectedNodeId);
  }, [flatTree, selectedNodeId]);

  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  useImperativeHandle(
    ref,
    () => ({
      setPosition,
    }),
    [],
  );

  if (!visible) return null;

  return createPortal(
    <div
      className="fixed top-0 right-0 bottom-0 left-0"
      onPointerDown={onClose}
    >
      <div
        className={`bg-plain fixed`}
        style={{ top: position.y, left: position.x }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Button className="block w-full" onClick={onEdit}>
          edit content
        </Button>
        <Button type="secondary" className="block w-full" onClick={onAddChild}>
          add child node
        </Button>
        <Button className="block w-full" onClick={onSetParent}>
          set parent node
        </Button>
        <Button className="block w-full" onClick={onDisconnectFromParent}>
          disconnect from parent
        </Button>
        {graphType === "detail" && (
          <Button className="block w-full" onClick={onToggleMark}>
            {selectedNode?.marked ? "unmark" : "mark"}
          </Button>
        )}
        <Button type="danger" className="block w-full" onClick={onDelete}>
          delete
        </Button>
      </div>
    </div>,
    document.body,
  );
}
