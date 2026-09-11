import { api } from "@lib";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MoveDownLeft, MoveDownRight, User } from "lucide-react";
import { useMemo, useState } from "react";

interface TreeNode {
  id: number;
  firstName: string;
  lastName: string | null;
  leftUser: number | null;
  rightUser: number | null;
  depth: number;
}

function buildTree(nodes: TreeNode[], rootId: number) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  return { byId, root: byId.get(rootId) ?? null };
}

function NodeCard({
  node,
  isRoot,
  onExpand,
}: {
  node: TreeNode | undefined;
  isRoot?: boolean;
  onExpand: (id: number) => void;
}) {
  if (!node) {
    return (
      <div className="w-28 sm:w-32 p-2.5 rounded-xl border border-dashed border-amber-200 bg-amber-50/10 text-center">
        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
          Empty
        </span>
      </div>
    );
  }

  const name = node.lastName
    ? `${node.firstName} ${node.lastName}`
    : node.firstName;

  return (
    <button
      type="button"
      onClick={() => onExpand(node.id)}
      className={`w-28 sm:w-32 p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
        isRoot
          ? "border-[var(--gmc-gold)] bg-gradient-to-br from-amber-50 to-white shadow-md"
          : "border-amber-100 bg-white hover:bg-amber-50/40 hover:border-amber-200 shadow-sm"
      }`}
      title="View this member's tree"
    >
      <div className="w-7 h-7 mx-auto mb-1 rounded-full bg-amber-50 text-[var(--gmc-gold-deep)] border border-amber-100 flex items-center justify-center">
        <User className="w-3.5 h-3.5" />
      </div>
      <div className="text-[11px] font-extrabold text-slate-800 truncate">
        {name}
      </div>
      <div className="text-[9px] font-mono text-slate-400">#{node.id}</div>
    </button>
  );
}

function Branch({
  byId,
  nodeId,
  depth,
  maxDepth,
  onExpand,
}: {
  byId: Map<number, TreeNode>;
  nodeId: number | null;
  depth: number;
  maxDepth: number;
  onExpand: (id: number) => void;
}) {
  const node = nodeId != null ? byId.get(nodeId) : undefined;

  return (
    <div className="flex flex-col items-center">
      <NodeCard node={node} onExpand={onExpand} />
      {depth < maxDepth && node && (node.leftUser || node.rightUser) && (
        <div className="flex flex-col items-center">
          <div className="w-px h-4 bg-amber-200" />
          <div className="flex items-start gap-4 sm:gap-8">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 mb-1">
                <MoveDownLeft className="w-3 h-3 text-sky-500" />
                <span className="text-[9px] font-black text-sky-600 uppercase tracking-widest">
                  L
                </span>
              </div>
              <Branch
                byId={byId}
                nodeId={node.leftUser}
                depth={depth + 1}
                maxDepth={maxDepth}
                onExpand={onExpand}
              />
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[9px] font-black text-fuchsia-600 uppercase tracking-widest">
                  R
                </span>
                <MoveDownRight className="w-3 h-3 text-fuchsia-500" />
              </div>
              <Branch
                byId={byId}
                nodeId={node.rightUser}
                depth={depth + 1}
                maxDepth={maxDepth}
                onExpand={onExpand}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TreeView({ rootId }: { rootId?: number }) {
  const [focusId, setFocusId] = useState<number | undefined>(rootId);
  const depth = 3;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["team-tree", focusId, depth],
    queryFn: async () => {
      const { data } = await api.users.team.tree.get({
        query: { id: focusId, depth },
      });
      return data?.data ?? null;
    },
  });

  const { byId, root } = useMemo(() => {
    if (!data) return { byId: new Map<number, TreeNode>(), root: null };
    return buildTree(data.nodes, data.rootId);
  }, [data]);

  const stats = useMemo(() => {
    if (!root) return null;
    const left = root.leftUser != null;
    const right = root.rightUser != null;
    return { left, right };
  }, [root]);

  return (
    <div className="bg-white/95 backdrop-blur-md border border-amber-200/40 rounded-3xl shadow-sm p-4 md:p-6 lg:p-8 overflow-x-auto">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-10 w-10 animate-spin text-[var(--gmc-gold)] mb-4" />
          <p className="text-slate-500 font-bold text-sm">Loading tree...</p>
        </div>
      ) : isError || !data ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-slate-900 font-extrabold mb-2">
            Could not load tree
          </p>
        </div>
      ) : (
        <div className="min-w-max flex justify-center py-4">
          <Branch
            byId={byId}
            nodeId={data.rootId}
            depth={0}
            maxDepth={depth}
            onExpand={(id) => setFocusId(id)}
          />
        </div>
      )}
      {stats && (
        <p className="mt-6 text-center text-[11px] text-slate-400 font-semibold">
          Tap any node to re-center the tree on that member.
        </p>
      )}
    </div>
  );
}
