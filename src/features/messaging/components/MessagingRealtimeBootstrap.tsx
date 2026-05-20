import { useEffect, useMemo, useRef, useState } from "react";
import useChatSocket from "@/features/messaging/hooks/useChatSocket";
import useThreads from "@/features/messaging/hooks/useThreads";
import messagingApi from "@/features/messaging/api/messagingApi";
import { useAuthStore } from "@/stores/authStore";

const MAX_BACKGROUND_THREADS = 100;

export function MessagingRealtimeBootstrap() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [backgroundThreadIds, setBackgroundThreadIds] = useState<string[]>([]);

  const { threads } = useThreads({ autoLoad: Boolean(accessToken), archived: false });
  const { joinThread, leaveThread } = useChatSocket(accessToken);

  const joinedRef = useRef<Set<string>>(new Set());

  const targetThreadIds = useMemo(() => {
    const ids = [
      ...backgroundThreadIds,
      ...threads.map((thread) => thread.threadId),
    ];

    return Array.from(new Set(ids))
      .filter((threadId): threadId is string => Boolean(threadId))
      .slice(0, MAX_BACKGROUND_THREADS);
  }, [backgroundThreadIds, threads]);

  useEffect(() => {
    if (!accessToken) {
      setBackgroundThreadIds([]);
      return;
    }

    let isMounted = true;

    const loadBackgroundThreads = async () => {
      try {
        const response = await messagingApi.getThreads(0, MAX_BACKGROUND_THREADS, false);
        if (!isMounted) return;

        setBackgroundThreadIds(
          response.content
            .map((thread) => thread.threadId)
            .filter((threadId): threadId is string => Boolean(threadId))
        );
      } catch {
        if (isMounted) {
          setBackgroundThreadIds([]);
        }
      }
    };

    void loadBackgroundThreads();

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) {
      joinedRef.current.clear();
      return;
    }

    const nextIds = new Set(targetThreadIds);

    for (const threadId of nextIds) {
      if (!joinedRef.current.has(threadId)) {
        joinThread(threadId);
        joinedRef.current.add(threadId);
      }
    }

    for (const threadId of Array.from(joinedRef.current)) {
      if (!nextIds.has(threadId)) {
        leaveThread(threadId);
        joinedRef.current.delete(threadId);
      }
    }
  }, [accessToken, joinThread, leaveThread, targetThreadIds]);

  useEffect(() => {
    return () => {
      for (const threadId of joinedRef.current) {
        leaveThread(threadId);
      }
      joinedRef.current.clear();
    };
  }, [leaveThread]);

  return null;
}

export default MessagingRealtimeBootstrap;
