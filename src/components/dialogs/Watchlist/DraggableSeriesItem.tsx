import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
interface DragItem {
  index: number;
  id: number;
  type: string;
}
interface DraggableSeriesItemProps {
  series: any;
  index: number;
  moveItem: (from: number, to: number) => void;
  children: React.ReactNode;
}
export const DraggableSeriesItem = ({
  series,
  index,
  moveItem,
  children,
}: DraggableSeriesItemProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag({
    type: 'series',
    item: { index, id: series.id } as DragItem,
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });
  const [, drop] = useDrop<DragItem, void, { isOver: boolean }>({
    accept: 'series',
    collect: (monitor) => ({ isOver: monitor.isOver() }),
    hover(item, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      const tolerance = 5;
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY + tolerance)
        return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY - tolerance)
        return;
      moveItem(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });
  drag(drop(ref));
  return (
    <div
      ref={ref}
      style={{
        boxSizing: 'border-box',
        opacity: isDragging ? 1 : 1,
        cursor: 'grab',
        transform: isDragging ? 'scale(1.05)' : 'none',
        transition: 'transform 0.2s ease',
        border: 'none',
      }}
    >
      {children}
    </div>
  );
};
