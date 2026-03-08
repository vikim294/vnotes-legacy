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

/**
 * NodeMenuExpose - 暴露给父组件的接口
 * 用于从外部控制菜单位置
 */
export interface NodeMenuExpose {
  setPosition: Dispatch<SetStateAction<{ x: number; y: number }>>;
}

/**
 * NodeMenuProps - 节点菜单组件属性
 * @property ref - 用于暴露 setPosition 方法给父组件
 * @property visible - 控制菜单显示/隐藏
 * @property onEdit - 编辑节点内容回调
 * @property onAddChild - 添加子节点回调
 * @property onSetParent - 设置父节点回调
 * @property onDisconnectFromParent - 断开与父节点连接回调
 * @property onToggleMark - 切换标记状态回调（仅 detail 图可用）
 * @property onDelete - 删除节点回调
 * @property onClose - 关闭菜单回调
 */
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

/**
 * NodeMenu - 节点右键菜单组件
 * 
 * 功能说明：
 * - 显示在点击位置附近的浮动菜单
 * - 提供节点编辑、添加子节点、设置父节点等操作
 * - 使用 Portal 渲染到 document.body，避免被父容器裁剪
 * - 点击菜单外部区域自动关闭
 * 
 * 使用场景：
 * - 在树形图的节点上右键点击时弹出
 * - detail 图和主页图都支持，但标记功能仅在 detail 图可用
 */
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
  // 从 PaperContext 获取当前画布状态和选中的节点信息
  const paperContext = use(PaperContext);
  const graphType = paperContext?.graphType;
  const flatTree = paperContext?.flatTree;
  const selectedNodeId = paperContext?.selectedNodeId;
  
  /**
   * 根据 selectedNodeId 从 flatTree 中查找当前选中的节点
   * 用于判断节点类型（是否为 detail 节点）和标记状态
   */
  const selectedNode = useMemo(() => {
    return flatTree?.find((node) => node.id === selectedNodeId);
  }, [flatTree, selectedNodeId]);

  // 菜单位置状态，由父组件通过 ref 控制
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  /**
   * 暴露 setPosition 方法给父组件
   * 父组件可以通过 ref.current?.setPosition({x, y}) 来移动菜单位置
   */
  useImperativeHandle(
    ref,
    () => ({
      setPosition,
    }),
    [],
  );

  // 菜单不可见时不渲染任何内容
  if (!visible) return null;

  return createPortal(
    // 全屏透明遮罩层，点击时关闭菜单
    <div
      className="fixed top-0 right-0 bottom-0 left-0"
      onPointerDown={onClose}
    >
      {/* 菜单容器，定位在点击位置 */}
      <div
        className={`bg-plain fixed`}
        style={{ top: position.y, left: position.x }}
        onPointerDown={(e) => e.stopPropagation()} // 阻止事件冒泡，防止点击菜单时关闭
      >
        {/* 编辑节点内容 */}
        <Button className="block w-full" onClick={onEdit}>
          {
            selectedNode?.contentType === "image" ? "change image" : "edit text"
          }
        </Button>
        {
          !selectedNode?.isDetail && (
            // 非 detail 节点才能新增子结点
            // detail 节点是叶子节点，不允许有子节点
            <Button className="block w-full" onClick={onAddChild}>
              add child node
            </Button>
          )
        }
        {/* 设置父节点 - 用于重新组织树的结构 */}
        <Button className="block w-full" onClick={onSetParent}>
          set parent node
        </Button>
        {/* 断开与父节点的连接 - 将节点变为根节点 */}
        <Button className="block w-full" onClick={onDisconnectFromParent}>
          disconnect from parent
        </Button>
        {/* 标记功能 - 仅在 detail 视图中可用，且图片节点不支持标记 */}
        {graphType === "detail" && selectedNode?.contentType !== "image" && (
          <Button className="block w-full" onClick={onToggleMark}>
            {selectedNode?.marked ? "unmark" : "mark"}
          </Button>
        )}
        {/* 删除节点 - 危险操作，使用 danger 样式 */}
        <Button type="danger" className="block w-full" onClick={onDelete}>
          delete
        </Button>
      </div>
    </div>,
    document.body, // 使用 Portal 渲染到 body，避免被父容器裁剪
  );
}
