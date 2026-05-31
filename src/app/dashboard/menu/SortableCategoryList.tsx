'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { reorderCategories } from '@/actions/categoryActions';
import { CategoryItem } from './CategoryItem';
import { toast } from 'sonner';

type Category = {
  id: string;
  name: string;
  restaurantId?: string;
  products: {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    isAvailable?: boolean;
  }[];
};

function SortableCategory({ category }: { category: Category }) {
  const { setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white">
      <CategoryItem category={category} />
    </div>
  );
}

export function SortableCategoryList({
  categories: initialCategories,
  restaurantId,
}: {
  categories: Category[];
  restaurantId: string;
}) {
  const [items, setItems] = useState(initialCategories);
  const [isReordering, setIsReordering] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...items];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    setItems(reordered);

    setIsReordering(true);
    const result = await reorderCategories(
      restaurantId,
      reordered.map((c) => c.id)
    );
    if (!result.success) {
      toast.error('Erro ao reordenar');
      setItems(items);
    }
    setIsReordering(false);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <SortableContext items={items.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <ul className="divide-y divide-gray-100">
          {items.map((category) => (
            <SortableCategory key={category.id} category={category} />
          ))}
        </ul>
      </SortableContext>
      {isReordering && (
        <div className="text-center py-2 text-xs text-gray-400">Salvando ordem...</div>
      )}
    </DndContext>
  );
}
