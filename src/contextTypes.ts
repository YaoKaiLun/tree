/**
 * Webpack has bug for import loop, which is not the same behavior as ES module.
 * When util.js imports the TreeNode for tree generate will cause treeContextTypes be empty.
 */
import * as React from 'react';
import { IconType, Key, DataEntity, NodeInstance } from './interface';
import { InternalTreeNodeProps } from './TreeNode';

type NodeMouseEventHandler = (e: MouseEvent, node: React.Component<InternalTreeNodeProps>) => void;

export interface TreeContextProps {
  prefixCls: string;
  selectable: boolean;
  showIcon: boolean;
  icon: IconType;
  switcherIcon: IconType;
  draggable: boolean;
  checkable: boolean | React.ReactNode;
  checkStrictly: boolean;
  disabled: boolean;
  keyEntities: Record<Key, DataEntity>;

  loadData: (treeNode: NodeInstance) => Promise<void>;
  filterTreeNode: (treeNode: NodeInstance) => boolean;

  onNodeClick: NodeMouseEventHandler;
  onNodeDoubleClick: NodeMouseEventHandler;
  onNodeExpand: NodeMouseEventHandler;
  onNodeSelect: NodeMouseEventHandler;
  onNodeCheck: (e: MouseEvent, treeNode: NodeInstance, checked: boolean) => void;
  onNodeLoad: (treeNode: NodeInstance) => void;
  onNodeMouseEnter: NodeMouseEventHandler;
  onNodeMouseLeave: NodeMouseEventHandler;
  onNodeContextMenu: NodeMouseEventHandler;
  onNodeDragStart: NodeMouseEventHandler;
  onNodeDragEnter: NodeMouseEventHandler;
  onNodeDragOver: NodeMouseEventHandler;
  onNodeDragLeave: NodeMouseEventHandler;
  onNodeDragEnd: NodeMouseEventHandler;
  onNodeDrop: NodeMouseEventHandler;
}

export const TreeContext: React.Context<TreeContextProps | null> = React.createContext(null);
