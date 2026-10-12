// Seitenübersetzer (Google Translate) tauschen Textknoten aus, die React noch als Anker hält.
export function installDomTranslationGuard(): void {
  if (typeof Node !== 'function') return;
  const proto = Node.prototype;
  const originalRemoveChild = proto.removeChild;
  const originalInsertBefore = proto.insertBefore;

  proto.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode === this) return originalRemoveChild.call(this, child) as T;
    if (child.parentNode && this.contains(child)) {
      return originalRemoveChild.call(child.parentNode, child) as T;
    }
    return child;
  };

  proto.insertBefore = function <T extends Node>(this: Node, node: T, child: Node | null): T {
    if (!child || child.parentNode === this) {
      return originalInsertBefore.call(this, node, child) as T;
    }
    let anchor = child.parentNode;
    while (anchor && anchor.parentNode !== this) anchor = anchor.parentNode;
    return originalInsertBefore.call(this, node, anchor) as T;
  };
}
