import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const RTC_URL =
  import.meta.env.VITE_RTC_BASE_URL ?? "http://localhost:4000";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

interface UseWebRTCOptions {
  roomCode: string;
  token: string;
  localStream: MediaStream | null;
}

export interface JoinRequest {
  socketId: string;
  userId: string;
  email?: string;
  displayName?: string;
}

export type RoomStatus = "SCHEDULED" | "WAITING" | "ACTIVE" | "CLOSING" | "ENDED" | "EXPIRED";

export interface PeerMediaState {
  camera: boolean;
  mic: boolean;
  screen: boolean;
}

export function useWebRTC({ roomCode, token, localStream }: UseWebRTCOptions) {
  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const remoteSocketIdRef = useRef<string | null>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);
  localStreamRef.current = localStream;

  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connected, setConnected] = useState(false);
  const [peerCount, setPeerCount] = useState(0);

  // Admission control — queue of pending join requests
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);

  // Track the remote peer's socket ID for kick
  const [remotePeerId, setRemotePeerId] = useState<string | null>(null);

  // Room lifecycle
  const [roomStatus, setRoomStatus] = useState<RoomStatus>("WAITING");
  const [waitingCount, setWaitingCount] = useState(0);

  // Peer media states (remote participants)
  const [peerMediaStates, setPeerMediaStates] = useState<Record<string, PeerMediaState>>({});

  // ── Cleanup helpers ──────────────────────────────────
  const closePeer = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    remoteSocketIdRef.current = null;
    setRemoteStream(null);
    setConnected(false);
  }, []);

  const renegotiate = useCallback(async () => {
    const socket = socketRef.current;
    const pc = pcRef.current;
    const remoteSocketId = remoteSocketIdRef.current;
    if (!socket?.connected || !pc || !remoteSocketId) return;
    if (pc.signalingState !== "stable") return;

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("offer", { to: remoteSocketId, offer: pc.localDescription });
  }, []);

  // ── Create peer connection ───────────────────────────
  const createPeer = useCallback(
    (socket: Socket, remoteSocketId: string, initiator: boolean) => {
      closePeer();
      remoteSocketIdRef.current = remoteSocketId;

      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      // Add local tracks (use ref to avoid stale closure)
      const stream = localStreamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      } else {
        // No local media — add receive-only transceivers so we can still get remote tracks
        pc.addTransceiver("audio", { direction: "recvonly" });
        pc.addTransceiver("video", { direction: "recvonly" });
      }

      // Receive remote tracks
      const remote = new MediaStream();
      setRemoteStream(remote);

      pc.ontrack = (e) => {
        e.streams[0]?.getTracks().forEach((track) => {
          remote.addTrack(track);
        });
        setConnected(true);
      };

      // ICE candidates
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("ice-candidate", {
            to: remoteSocketId,
            candidate: e.candidate.toJSON(),
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
          setConnected(false);
        }
        if (pc.iceConnectionState === "connected") {
          setConnected(true);
        }
      };

      // If initiator, create offer
      if (initiator) {
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            socket.emit("offer", {
              to: remoteSocketId,
              offer: pc.localDescription,
            });
          });
      }

      return pc;
    },
    [closePeer]
  );

  // ── Socket connection (no localStream needed) ────────
  useEffect(() => {
    if (!roomCode || !token) return;
    const socket = io(RTC_URL, {
      auth: { token },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-room", roomCode);
    });

    socket.on("connect_error", (err) => {
      console.error("[useWebRTC] connection error:", err.message);
    });

    // Existing peers already in room — we initiate
    socket.on("room-peers", (peers: { socketId: string; userId?: string; isHost?: boolean; media?: PeerMediaState }[]) => {
      setPeerCount(peers.length);
      // Update peer media states
      const newStates: Record<string, PeerMediaState> = {};
      for (const p of peers) {
        if (p.media) newStates[p.socketId] = p.media;
      }
      setPeerMediaStates((prev) => ({ ...prev, ...newStates }));

      if (peers.length > 0) {
        setRemotePeerId(peers[0].socketId);
        createPeer(socket, peers[0].socketId, true);
      }
    });

    // New peer joined — they will send offer, we wait
    socket.on("user-joined", ({ socketId }: { socketId: string }) => {
      setPeerCount((c) => c + 1);
      setRemotePeerId(socketId);
      if (!pcRef.current || pcRef.current.connectionState === "closed") {
        createPeer(socket, socketId, true);
      }
    });

    // Receive offer
    socket.on("offer", async ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
      remoteSocketIdRef.current = from;
      const pc = createPeer(socket, from, false);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      for (const c of pendingCandidates.current) {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      }
      pendingCandidates.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { to: from, answer: pc.localDescription });
    });

    // Receive answer
    socket.on("answer", async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      const pc = pcRef.current;
      if (pc && pc.signalingState === "have-local-offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));

        for (const c of pendingCandidates.current) {
          await pc.addIceCandidate(new RTCIceCandidate(c));
        }
        pendingCandidates.current = [];
      }
    });

    // Receive ICE candidate
    socket.on("ice-candidate", async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      const pc = pcRef.current;
      if (pc && pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        pendingCandidates.current.push(candidate);
      }
    });

    // Peer left
    socket.on("user-left", () => {
      setPeerCount((c) => Math.max(0, c - 1));
      setRemotePeerId(null);
      closePeer();
    });

    // ── Admission control events (HR host) ─────────────
    socket.on("join-request", (req: JoinRequest) => {
      setJoinRequests((prev) => {
        if (prev.some((r) => r.socketId === req.socketId)) return prev;
        return [...prev, req];
      });
    });

    socket.on("waiting-user-left", ({ socketId }: { socketId: string }) => {
      setJoinRequests((prev) => prev.filter((r) => r.socketId !== socketId));
    });

    // ── Room lifecycle events ──────────────────────────
    socket.on("room-status-changed", ({ status }: { status: RoomStatus }) => {
      setRoomStatus(status);
    });

    socket.on("waiting-count", ({ count }: { count: number }) => {
      setWaitingCount(count);
    });

    // ── Peer media tracking ────────────────────────────
    socket.on("peer-media-changed", ({ socketId, media }: { socketId: string; userId?: string; media: PeerMediaState }) => {
      setPeerMediaStates((prev) => ({ ...prev, [socketId]: media }));
    });

    return () => {
      closePeer();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomCode, token, createPeer, closePeer]);

  // ── Sync local tracks to active peer and renegotiate ──
  useEffect(() => {
    const pc = pcRef.current;
    if (!localStream || !pc || pc.connectionState === "closed") return;

    let changed = false;
    const senders = pc.getSenders();

    localStream.getTracks().forEach((track) => {
      const sender = senders.find((s) => s.track?.kind === track.kind);
      if (!sender) {
        pc.addTrack(track, localStream);
        changed = true;
        return;
      }

      if (sender.track !== track) {
        sender.replaceTrack(track);
        changed = true;
      }
    });

    if (changed) {
      renegotiate().catch((err) => {
        console.error("[useWebRTC] renegotiate failed:", err);
      });
    }
  }, [localStream, peerCount, remotePeerId, renegotiate]);

  // ── Replace track (for screen sharing) ───────────────
  const replaceTrack = useCallback(
    (newTrack: MediaStreamTrack, kind: "video" | "audio") => {
      const pc = pcRef.current;
      if (!pc) return;
      const sender = pc.getSenders().find((s) => s.track?.kind === kind);
      if (sender) {
        sender.replaceTrack(newTrack);
      }
    },
    []
  );

  // ── Admit a candidate from waiting room ──────────────
  const admitUser = useCallback((socketId: string) => {
    socketRef.current?.emit("admit-user", { socketId });
    setJoinRequests((prev) => prev.filter((r) => r.socketId !== socketId));
  }, []);

  // ── Reject a candidate from waiting room ─────────────
  const rejectUser = useCallback((socketId: string) => {
    socketRef.current?.emit("reject-user", { socketId });
    setJoinRequests((prev) => prev.filter((r) => r.socketId !== socketId));
  }, []);

  // ── Kick connected candidate ─────────────────────────
  const kickUser = useCallback((socketId: string) => {
    socketRef.current?.emit("kick-user", { socketId });
  }, []);

  // ── Send recording state to room ─────────────────────
  const emitRecordingStarted = useCallback(() => {
    socketRef.current?.emit("recording-started");
  }, []);

  const emitRecordingStopped = useCallback(() => {
    socketRef.current?.emit("recording-stopped");
  }, []);

  // ── Room lifecycle controls (HR host) ────────────────
  const emitOpenRoom = useCallback(() => {
    socketRef.current?.emit("open-room");
  }, []);

  const emitCloseRoom = useCallback(() => {
    socketRef.current?.emit("close-room");
  }, []);

  const emitEndRoom = useCallback(() => {
    socketRef.current?.emit("end-room");
  }, []);

  // ── Media state broadcast ────────────────────────────
  const emitMediaStateChanged = useCallback((state: Partial<PeerMediaState>) => {
    socketRef.current?.emit("media-state-changed", state);
  }, []);

  // ── Disable peer media (HR → candidate) ─────────────
  const disablePeerMedia = useCallback((socketId: string, kind: "camera" | "mic") => {
    socketRef.current?.emit("disable-peer-media", { socketId, kind });
  }, []);

  return {
    remoteStream,
    connected,
    peerCount,
    replaceTrack,
    joinRequests,
    admitUser,
    rejectUser,
    kickUser,
    emitRecordingStarted,
    emitRecordingStopped,
    remotePeerId,
    roomStatus,
    waitingCount,
    peerMediaStates,
    emitOpenRoom,
    emitCloseRoom,
    emitEndRoom,
    emitMediaStateChanged,
    disablePeerMedia,
  };
}
