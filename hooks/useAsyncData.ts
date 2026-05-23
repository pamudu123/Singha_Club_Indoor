import { useCallback, useEffect, useState } from "react";

export function useAsyncData<T>(
  loader: () => Promise<{ data: T | null; error: string | null }>,
  deps: unknown[] = [],
  skipInitial = false
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!skipInitial);

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await loader();
    setData(result.data);
    setError(result.error);
    setLoading(false);
  }, deps);

  useEffect(() => {
    if (!skipInitial) {
      refresh();
    }
  }, [refresh]);

  return { data, error, loading, refresh };
}
