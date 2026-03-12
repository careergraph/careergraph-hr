import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const RTC_URL =
  import.meta.env.VITE_RTC_URL ?? "http://localhost:4000";

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
  fullName?: string;
}

export function useWebRTC({ roomCode, token, localStream }: UseWebRTCOptions) {
  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
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

  // ── Cleanup helpers ──────────────────────────────────
  const closePeer = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    setRemoteStream(null);
    setConnected(false);
  }, []);

  // ── Create peer connection ───────────────────────────
  const createPeer = useCallback(
    (socket: Socket, remoteSocketId: string, initiator: boolean) => {
      closePeer();

      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      // Add local tracks (use ref to avoid stale closure)
      const stream = localStreamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
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
    socket.on("room-peers", (peers: { socketId: string }[]) => {
      setPeerCount(peers.length);
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

    return () => {
      closePeer();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomCode, token, createPeer, closePeer]);

  // ── Create peer when localStream becomes available ───
  useEffect(() => {
    const socket = socketRef.current;
    if (!localStream || !socket?.connected || !remotePeerId) return;
    if (pcRef.current && pcRef.current.connectionState !== "closed") return;
    createPeer(socket, remotePeerId, true);
  }, [localStream, remotePeerId, createPeer]);

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
  };
}
