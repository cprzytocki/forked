type StoreWithErrorAndLoading = {
  error: string | null;
  isLoading: boolean;
};

type StoreSetter<T extends StoreWithErrorAndLoading> = (
  partial: Partial<T>,
) => void;

export async function runAction<T extends StoreWithErrorAndLoading>(
  set: StoreSetter<T>,
  fn: () => Promise<void>,
) {
  try {
    await fn();
  } catch (e) {
    set({ error: String(e) } as Partial<T>);
  }
}

export async function runWithLoading<T extends StoreWithErrorAndLoading>(
  set: StoreSetter<T>,
  fn: () => Promise<void>,
  clearError = true,
) {
  set(
    (clearError
      ? { isLoading: true, error: null }
      : { isLoading: true }) as Partial<T>,
  );
  try {
    await fn();
  } catch (e) {
    set({ error: String(e) } as Partial<T>);
  } finally {
    set({ isLoading: false } as Partial<T>);
  }
}
