import { api } from '@/lib/api';
import { toast } from 'sonner';

/**
 * Optimistically remove `id` from `items` and fire DELETE at `url`.
 * On failure, restore the snapshot and show an error toast.
 * Keeps the UI instant — no full-list refetch needed.
 *
 * Usage (flat list):
 *   await optimisticDelete({ id, url: `/admin/skills/${id}`, items, setItems })
 *
 * Usage (paginated `data.items`):
 *   await optimisticDeletePaginated({ id, url, data, setData })
 */
export const optimisticDelete = async ({
  id, url, items, setItems, message = 'Deleted', keyField = 'id', onError,
}) => {
  const snapshot = items;
  setItems(items.filter((x) => x[keyField] !== id));
  try {
    await api.delete(url);
    if (message) toast.success(message);
    return true;
  } catch (e) {
    setItems(snapshot);
    toast.error('Delete failed');
    if (onError) onError(e);
    return false;
  }
};

/** Same idea, but for state shaped as { items, total, ... }. */
export const optimisticDeletePaginated = async ({
  id, url, data, setData, message = 'Deleted', keyField = 'id',
}) => {
  const snapshot = data;
  setData({
    ...data,
    items: (data.items || []).filter((x) => x[keyField] !== id),
    total: Math.max(0, (data.total || 0) - 1),
  });
  try {
    await api.delete(url);
    if (message) toast.success(message);
    return true;
  } catch (e) {
    setData(snapshot);
    toast.error('Delete failed');
    return false;
  }
};
