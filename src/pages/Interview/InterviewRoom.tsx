import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { toast } from "sonner";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Monitor,
  MonitorOff,
  Users,
  Copy,
  Clock,
  AlertCircle,
  Circle,
  Square,
  UserX,
  Check,
  X,
  ShieldAlert,
  CheckCircle2,
  DoorOpen,
  DoorClosed,
  Radio,
  ClipboardCheck,
  SearchX,
  RotateCcw,
  ArrowLeft,
} from "lucide-react";
import { interviewService } from "@/services/interviewService";
import { useWebRTC } from "@/hooks/useWebRTC";
import type { RoomStatus } from "@/hooks/useWebRTC";
import { useAuthStore } from "@/stores/authStore";
import type { Interview } from "@/types/interview";
import FeedbackModal from "./FeedbackModal";
import RecordingAssignModal from "./RecordingAssignModal";

const FINAL_INTERVIEW_STATUSES = new Set(["COMPLETED", "CANCELLED", "NO_SHOW"]);
const ROOM_OPEN_STATUSES = new Set(["SCHEDULED", "CONFIRMED", "PENDING_RESCHEDULE", "IN_PROGRESS"]);

interface RoomParticipantEntry {
  id: string;
  applicationId: string;
  candidateId: string;
  candidateName?: string;
  candidateEmail?: string;
  admitStatus?: string;
  joinedAt?: string;
  leftAt?: string;
}

interface RoomLookupError {
  type: "not-found" | "unavailable";
  title: string;
  description: string;
}

const toTimeMs = (value?: string) => {
  const parsed = value ? new Date(value).getTime() : Number.NaN;
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const pickRepresentativeInterview = (items: Interview[], fallback?: Interview | null) => {
  if (!Array.isArray(items) || items.length === 0) return fallback ?? null;

  const now = Date.now();
  const nonFinal = items.filter((iv) => !FINAL_INTERVIEW_STATUSES.has(iv.interviewStatus));

  const inProgress = nonFinal.find((iv) => iv.interviewStatus === "IN_PROGRESS");
  if (inProgress) return inProgress;

  const upcomingOrActive = nonFinal
    .filter((iv) => {
      const endMs = toTimeMs(iv.endAt);
      return Number.isFinite(endMs) && endMs >= now;
    })
    .sort((a, b) => toTimeMs(a.scheduledAt) - toTimeMs(b.scheduledAt));

  if (upcomingOrActive.length > 0) {
    return upcomingOrActive[0];
  }

  return [...items].sort((a, b) => toTimeMs(b.scheduledAt) - toTimeMs(a.scheduledAt))[0] ?? fallback ?? null;
};

export default function InterviewRoom() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const isMobile = useMediaQuery("(max-width: 767px)");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [joined, setJoined] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const [activeCandidateId, setActiveCandidateId] = useState<string | null>(null);

  // Recording state
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const recordingDrawIntervalRef = useRef<number | null>(null);
  const recordingAudioContextRef = useRef<AudioContext | null>(null);
  const recordingDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  // Kick confirmation
  const [showKickConfirm, setShowKickConfirm] = useState(false);

  // End meeting confirmation
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [ending, setEnding] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedFeedbackInterviewId, setSelectedFeedbackInterviewId] = useState<string | null>(null);
  const [feedbackIsPostMeeting, setFeedbackIsPostMeeting] = useState(false);
  const [isUploadingRecording, setIsUploadingRecording] = useState(false);

  // Recording assign modal state
  const [showRecordingAssignModal, setShowRecordingAssignModal] = useState(false);
  const [pendingRecordingUrl, setPendingRecordingUrl] = useState<string | null>(null);

  // Interview info & early join state
  const [interview, setInterview] = useState<Interview | null>(null);
  const [roomInterviews, setRoomInterviews] = useState<Interview[]>([]);
  const [roomParticipants, setRoomParticipants] = useState<RoomParticipantEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomLookupError, setRoomLookupError] = useState<RoomLookupError | null>(null);
  const [lookupRetryKey, setLookupRetryKey] = useState(0);

  const getCompanyOwnerId = useCallback(() => {
    const userObj = (user ?? null) as Record<string, unknown> | null;
    return typeof userObj?.companyId === "string" ? userObj.companyId : "";
  }, [user]);

  // WebRTC peer connection
  const {
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
  } = useWebRTC({
    roomCode: joined && roomCode ? roomCode : "",
    token: accessToken ?? "",
    localStream: localStream,
  });

  useEffect(() => {
    if (!remotePeerId) {
      setActiveCandidateId(null);
    }
  }, [remotePeerId]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Re-bind local stream whenever local video element is remounted (lobby <-> in-call).
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, joined]);

  // Fetch interview info by room code
  useEffect(() => {
    if (!roomCode) {
      setRoomLookupError({
        type: "not-found",
        title: "Mã phòng không hợp lệ",
        description: "Liên kết phòng phỏng vấn không đúng hoặc đã bị thay đổi.",
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    setRoomLookupError(null);

    Promise.all([
      interviewService.fetchByRoomCode(roomCode),
      interviewService.fetchAllByRoomCode(roomCode).catch(() => null),
      interviewService.fetchRoomParticipants(roomCode).catch(() => null),
    ])
      .then(([singleResp, allResp, participantResp]) => {
        const allItems: Interview[] = Array.isArray(allResp?.data)
          ? allResp.data
          : Array.isArray(allResp)
            ? allResp
            : [];
        const primaryInterview: Interview | null = (singleResp?.data ?? allItems[0] ?? null) as Interview | null;
        const normalizedItems: Interview[] = allItems.length > 0
          ? allItems
          : (primaryInterview ? [primaryInterview] : []);
        const representativeInterview = pickRepresentativeInterview(normalizedItems, primaryInterview);

        if (!representativeInterview) {
          setRoomLookupError({
            type: "not-found",
            title: "Không tìm thấy phòng phỏng vấn",
            description: "Phòng có thể đã bị đóng, hết hạn hoặc mã phòng không còn tồn tại.",
          });
          return;
        }

        setInterview(representativeInterview);
        setRoomInterviews(normalizedItems);

        const participantItems: RoomParticipantEntry[] = Array.isArray(participantResp?.data)
          ? participantResp.data
          : Array.isArray(participantResp)
            ? participantResp
            : [];
        setRoomParticipants(participantItems);
      })
      .catch((error: unknown) => {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 404) {
          setRoomLookupError({
            type: "not-found",
            title: "Không tìm thấy phòng phỏng vấn",
            description: "Phòng có thể đã bị đóng, hết hạn hoặc mã phòng không còn tồn tại.",
          });
          return;
        }

        setRoomLookupError({
          type: "unavailable",
          title: "Không thể kết nối tới phòng",
          description: "Hệ thống đang bận hoặc kết nối mạng không ổn định. Vui lòng thử lại sau vài giây.",
        });
      })
      .finally(() => setLoading(false));
  }, [roomCode, lookupRetryKey]);

  const resolveParticipantFromJoinRequest = useCallback(
    (req: { email?: string; userId?: string }) => {
      const requestEmail = req.email?.trim().toLowerCase();

      if (requestEmail) {
        const byEmail = roomParticipants.find(
          (p) => p.candidateEmail?.trim().toLowerCase() === requestEmail
        );
        if (byEmail) return byEmail;
      }

      if (req.userId) {
        const byCandidateId = roomParticipants.find((p) => p.candidateId === req.userId);
        if (byCandidateId) return byCandidateId;
      }

      return null;
    },
    [roomParticipants]
  );

  const getJoinRequestDisplayName = useCallback(
    (req: { email?: string; userId?: string; displayName?: string }) => {
      const matched = resolveParticipantFromJoinRequest(req);
      if (matched?.candidateName) return matched.candidateName;
      if (req.displayName) return req.displayName;
      if (req.email) return req.email;
      return req.userId || "Ứng viên";
    },
    [resolveParticipantFromJoinRequest]
  );

  const joinedCandidateApplicationIds = useMemo(() => {
    const ids = new Set<string>();
    roomParticipants.forEach((p) => {
      if (p.applicationId && p.joinedAt) {
        ids.add(p.applicationId);
      }
    });
    return ids;
  }, [roomParticipants]);

  const feedbackCandidateOptions = roomInterviews
    .filter((iv) => iv.interviewStatus === "COMPLETED")
    .filter((iv) => !Array.isArray(iv.feedback) || iv.feedback.length === 0)
    .filter((iv) => joinedCandidateApplicationIds.has(iv.applicationId))
    .map((iv) => ({
      interviewId: iv.id,
      candidateName: iv.candidateName,
    }));

  const handleCompleteCandidateInterview = useCallback(
    async (targetInterview: Interview) => {
      if (!roomCode) return;

      if (!joinedCandidateApplicationIds.has(targetInterview.applicationId)) {
        toast.error("Chỉ có thể hoàn thành ứng viên đã vào phòng phỏng vấn");
        return;
      }

      if (targetInterview.interviewStatus === "COMPLETED") {
        toast.info("Ứng viên này đã được hoàn thành phỏng vấn");
        return;
      }

      await interviewService.completeInterview(targetInterview.id);

      if (targetInterview.candidateId) {
        interviewService.completeParticipant(roomCode, targetInterview.candidateId).catch(() => null);
        setRoomParticipants((prev) =>
          prev.map((p) =>
            p.candidateId === targetInterview.candidateId
              ? { ...p, admitStatus: "COMPLETED", leftAt: new Date().toISOString() }
              : p
          )
        );
      }

      setRoomInterviews((prev) =>
        prev.map((iv) =>
          iv.id === targetInterview.id ? { ...iv, interviewStatus: "COMPLETED" } : iv
        )
      );

      if (interview?.id === targetInterview.id) {
        setInterview((prev) =>
          prev ? { ...prev, interviewStatus: "COMPLETED" } : prev
        );
      }

      toast.success(`Đã hoàn thành phỏng vấn ứng viên ${targetInterview.candidateName}`);
    },
    [roomCode, interview?.id, joinedCandidateApplicationIds]
  );

  const candidateActionItems = roomInterviews
    .filter((iv) => iv.interviewStatus !== "CANCELLED" && iv.interviewStatus !== "NO_SHOW")
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const isRoomEnded = useMemo(() => {
    const now = Date.now();
    const source = roomInterviews.length > 0
      ? roomInterviews
      : interview
        ? [interview]
        : [];

    const hasOpenWindow = source.some((iv) => {
      if (!ROOM_OPEN_STATUSES.has(iv.interviewStatus)) return false;
      const endMs = toTimeMs(iv.endAt);
      return Number.isFinite(endMs) && endMs >= now;
    });

    return !hasOpenWindow;
  }, [roomInterviews, interview]);

  // Timer
  useEffect(() => {
    if (!joined) return;
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [joined]);

  const fmtElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  // ── Media device detection & initialization ──────────
  // Distinguishes "no device" (allow join) from "permission denied / busy" (block join).
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [hasMic, setHasMic] = useState<boolean | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const initMedia = async (): Promise<"ok" | "no-devices" | "error"> => {
    setMediaError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Trình duyệt không hỗ trợ truy cập thiết bị media");
      setMediaError("unsupported");
      return "error";
    }

    // Step 1: Detect which device types are available
    let devices: MediaDeviceInfo[] = [];
    try {
      devices = await navigator.mediaDevices.enumerateDevices();
    } catch {
      // enumerateDevices failed — try getUserMedia directly below
    }

    const videoInputs = devices.filter((d) => d.kind === "videoinput");
    const audioInputs = devices.filter((d) => d.kind === "audioinput");
    const wantVideo = videoInputs.length > 0;
    const wantAudio = audioInputs.length > 0;

    setHasCamera(wantVideo);
    setHasMic(wantAudio);

    // No media devices at all → view-only mode, allow join
    if (!wantVideo && !wantAudio) {
      setCameraOn(false);
      setMicOn(false);
      return "no-devices";
    }

    // Step 2: Request only the devices that exist
    localStream?.getTracks().forEach((t) => t.stop());

    let stream: MediaStream | null = null;

    // Try combined first if both exist
    if (wantVideo && wantAudio) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch {
        stream = null; // Fall through to individual attempts
      }
    }

    // If combined failed or only one type, try individually
    if (!stream || stream.getTracks().length === 0) {
      let videoStream: MediaStream | null = null;
      let audioStream: MediaStream | null = null;
      let videoError: DOMException | null = null;
      let audioError: DOMException | null = null;

      if (wantVideo) {
        try {
          videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        } catch (e: unknown) {
          videoError = e instanceof DOMException ? e : null;
        }
      }

      if (wantAudio) {
        try {
          audioStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        } catch (e: unknown) {
          audioError = e instanceof DOMException ? e : null;
        }
      }

      // Check for blocking errors (permission denied / device busy)
      const blockingErrors = [videoError, audioError].filter(Boolean) as DOMException[];
      const permissionDenied = blockingErrors.filter((e) => e.name === "NotAllowedError");
      const deviceBusy = blockingErrors.filter((e) => e.name === "NotReadableError" || e.name === "AbortError");

      if (permissionDenied.length > 0 && !videoStream && !audioStream) {
        const msg = "Bạn đã chặn quyền truy cập camera/microphone.\nHãy mở Cài đặt trình duyệt → Quyền riêng tư → Cho phép camera/microphone cho trang này, sau đó tải lại trang.";
        toast.error(msg, { duration: 8000 });
        setMediaError("permission-denied");
        return "error";
      }

      if (deviceBusy.length > 0 && !videoStream && !audioStream) {
        const msg = "Thiết bị camera/microphone đang được sử dụng bởi ứng dụng khác.\nHãy đóng ứng dụng đó và thử lại.";
        toast.error(msg, { duration: 8000 });
        setMediaError("device-busy");
        return "error";
      }

      // Build stream from what we got
      const tracks = [
        ...(videoStream?.getVideoTracks() ?? []),
        ...(audioStream?.getAudioTracks() ?? []),
      ];

      if (tracks.length > 0) {
        stream = new MediaStream(tracks);
      }

      // Report partial failures as warnings
      if (wantVideo && !videoStream && audioStream) {
        const reason = videoError?.name === "NotAllowedError" ? " (quyền bị chặn)" : "";
        toast.warning(`Không thể truy cập camera${reason}. Bạn sẽ tham gia chỉ với microphone.`);
        setHasCamera(false);
      }
      if (wantAudio && !audioStream && videoStream) {
        const reason = audioError?.name === "NotAllowedError" ? " (quyền bị chặn)" : "";
        toast.warning(`Không thể truy cập microphone${reason}. Bạn sẽ tham gia chỉ với camera.`);
        setHasMic(false);
      }
    }

    // Step 3: Apply stream
    if (stream && stream.getTracks().length > 0) {
      setLocalStream(stream);
      cameraTrackRef.current = stream.getVideoTracks()[0] ?? null;
      setCameraOn(stream.getVideoTracks().some((t) => t.enabled));
      setMicOn(stream.getAudioTracks().some((t) => t.enabled));
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return "ok";
    }

    // All attempts failed but not from permission/busy — treat as no-devices
    setCameraOn(false);
    setMicOn(false);
    setHasCamera(false);
    setHasMic(false);
    return "no-devices";
  };

  const handleJoin = async () => {
    // If we already have usable tracks, join directly
    if (localStream?.getTracks().some((t) => t.readyState === "live")) {
      setJoined(true);
      return;
    }

    // Try to init media
    const result = await initMedia();
    if (result === "error") return; // Blocking error — user must fix first
    // "ok" or "no-devices" → allow join
    setJoined(true);
  };

  const toggleCamera = () => {
    if (!localStream) return;
    const videoTracks = localStream.getVideoTracks();
    if (videoTracks.length === 0) return;
    const newState = !videoTracks[0].enabled;
    videoTracks.forEach((t) => (t.enabled = newState));
    setCameraOn(newState);
    emitMediaStateChanged({ camera: newState });
  };

  const toggleMic = () => {
    if (!localStream) return;
    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length === 0) return;
    const newState = !audioTracks[0].enabled;
    audioTracks.forEach((t) => (t.enabled = newState));
    setMicOn(newState);
    emitMediaStateChanged({ mic: newState });
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Đã sao chép link phòng phỏng vấn");
  };

  const cleanupRecordingResources = useCallback(() => {
    if (recordingDrawIntervalRef.current) {
      window.clearInterval(recordingDrawIntervalRef.current);
      recordingDrawIntervalRef.current = null;
    }

    if (recordingCanvasRef.current) {
      recordingCanvasRef.current = null;
    }

    if (recordingDestinationRef.current) {
      recordingDestinationRef.current.stream.getTracks().forEach((t) => t.stop());
      recordingDestinationRef.current = null;
    }

    if (recordingAudioContextRef.current) {
      recordingAudioContextRef.current.close().catch(() => null);
      recordingAudioContextRef.current = null;
    }
  }, []);

  const createCompositedRecordingStream = useCallback(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const drawFrame = () => {
      const localVideo = localVideoRef.current;
      const remoteVideo = remoteVideoRef.current;
      const halfWidth = canvas.width / 2;

      ctx.fillStyle = "#0b1220";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (localVideo && localVideo.readyState >= 2) {
        ctx.drawImage(localVideo, 0, 0, halfWidth, canvas.height);
      } else {
        ctx.fillStyle = "#1f2937";
        ctx.fillRect(0, 0, halfWidth, canvas.height);
        ctx.fillStyle = "#d1d5db";
        ctx.font = "bold 28px sans-serif";
        ctx.fillText("HR", 40, 60);
      }

      if (remoteVideo && remoteVideo.readyState >= 2) {
        ctx.drawImage(remoteVideo, halfWidth, 0, halfWidth, canvas.height);
      } else {
        ctx.fillStyle = "#111827";
        ctx.fillRect(halfWidth, 0, halfWidth, canvas.height);
        ctx.fillStyle = "#d1d5db";
        ctx.font = "bold 28px sans-serif";
        ctx.fillText("Candidate", halfWidth + 40, 60);
      }
    };

    drawFrame();
    recordingDrawIntervalRef.current = window.setInterval(drawFrame, 1000 / 24);

    const videoStream = canvas.captureStream(24);
    const composed = new MediaStream(videoStream.getVideoTracks());

    const audioContext = new AudioContext();
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }
    const destination = audioContext.createMediaStreamDestination();
    recordingAudioContextRef.current = audioContext;
    recordingDestinationRef.current = destination;

    const localAudioTracks = localStream?.getAudioTracks().filter((t) => t.readyState === "live") ?? [];
    const remoteAudioTracks = remoteStream?.getAudioTracks().filter((t) => t.readyState === "live") ?? [];

    if (localAudioTracks.length > 0) {
      const localAudioStream = new MediaStream(localAudioTracks);
      const localSource = audioContext.createMediaStreamSource(localAudioStream);
      localSource.connect(destination);
    }

    if (remoteAudioTracks.length > 0) {
      const remoteAudioStream = new MediaStream(remoteAudioTracks);
      const remoteSource = audioContext.createMediaStreamSource(remoteAudioStream);
      remoteSource.connect(destination);
    }

    destination.stream.getAudioTracks().forEach((t) => composed.addTrack(t));

    recordingCanvasRef.current = canvas;
    return composed;
  }, [localStream, remoteStream]);

  const uploadRecordingBlob = useCallback(
    async (blob: Blob) => {
      const ownerId = getCompanyOwnerId();
      if (!ownerId) {
        toast.warning("Không tìm thấy companyId, không thể upload bản ghi");
        return null;
      }

      setIsUploadingRecording(true);
      try {
        const resp = await interviewService.uploadInterviewRecording({
          file: blob,
          ownerType: "company",
          ownerId,
          fileName: `interview-${roomCode}-${Date.now()}.webm`,
        });

        const uploadedUrl =
          typeof resp?.url === "string"
            ? resp.url
            : typeof resp?.data?.url === "string"
              ? resp.data.url
              : "";

        if (uploadedUrl) {
          toast.success("Đã upload bản ghi phỏng vấn");
          return uploadedUrl;
        }

        toast.warning("Upload bản ghi không trả về URL hợp lệ");
        return null;
      } catch {
        toast.error("Upload bản ghi thất bại");
        return null;
      } finally {
        setIsUploadingRecording(false);
      }
    },
    [getCompanyOwnerId, roomCode]
  );

  // ── Manual recording ────────────────────────────────
  const toggleRecording = useCallback(async () => {
    if (recording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setRecording(false);
      emitRecordingStopped();
      toast.info("Đã dừng ghi hình");
    } else {
      // Start recording — compose local + remote video into one canvas stream
      const combinedStream = await createCompositedRecordingStream();
      if (!combinedStream || combinedStream.getVideoTracks().length === 0) {
        toast.error("Không có stream để ghi hình. Hãy bật camera hoặc microphone trước.");
        return;
      }
      const recorder = new MediaRecorder(combinedStream, {
        mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
          ? "video/webm;codecs=vp9,opus"
          : "video/webm",
      });

      recordedChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        recordedChunksRef.current = [];
        cleanupRecordingResources();

        uploadRecordingBlob(blob).then((uploadedUrl) => {
          if (uploadedUrl) {
            // Show recording assign modal to let HR assign to a candidate
            setPendingRecordingUrl(uploadedUrl);
            setShowRecordingAssignModal(true);
            return;
          }

          // Fallback local download if upload fails.
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `interview-${roomCode}-${Date.now()}.webm`;
          a.click();
          URL.revokeObjectURL(url);
        });
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setRecording(true);
      emitRecordingStarted();
      toast.success("Đang ghi hình...");
    }
  }, [recording, roomCode, emitRecordingStarted, emitRecordingStopped, createCompositedRecordingStream, cleanupRecordingResources, uploadRecordingBlob]);

  // ── Kick candidate ──────────────────────────────────
  const handleKickConfirm = useCallback(() => {
    if (remotePeerId) {
      kickUser(remotePeerId);
      if (roomCode && activeCandidateId) {
        interviewService.removeParticipant(roomCode, activeCandidateId).catch(() => null);
        setRoomParticipants((prev) =>
          prev.map((p) =>
            p.candidateId === activeCandidateId
              ? { ...p, admitStatus: "REMOVED", leftAt: new Date().toISOString() }
              : p
          )
        );
      }
          setActiveCandidateId(null);
      toast.info("Đã mời ứng viên rời phòng");
    }
    setShowKickConfirm(false);
  }, [kickUser, remotePeerId, roomCode, activeCandidateId]);

  // Stop recording on leave
  const handleLeave = () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      emitRecordingStopped();
      cleanupRecordingResources();
    }
    localStream?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
    setJoined(false);
    setScreenSharing(false);
    setRecording(false);
    navigate("/interviews");
  };

  // End meeting session — close room/signaling only. Per-candidate completion is handled explicitly.
  const handleEndMeeting = useCallback(async () => {
    setEnding(true);
    try {
      emitEndRoom();
      if (roomCode) {
        interviewService.closeRoom(roomCode).catch(() => {});
      }
      if (recording) {
        mediaRecorderRef.current?.stop();
        emitRecordingStopped();
        cleanupRecordingResources();
      }
      localStream?.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
      setJoined(false);
      setScreenSharing(false);
      setRecording(false);
      toast.success("Đã kết thúc phiên họp phòng phỏng vấn");
      navigate("/interviews");
    } catch {
      toast.error("Không thể kết thúc phỏng vấn");
    } finally {
      setEnding(false);
      setShowEndConfirm(false);
    }
  }, [recording, localStream, roomCode, emitEndRoom, emitRecordingStopped, cleanupRecordingResources, navigate]);

  // Close room gracefully (5-min grace period)
  const handleCloseRoom = useCallback(() => {
    emitCloseRoom();
    if (roomCode) {
      interviewService.closeRoom(roomCode).catch(() => {});
    }
    toast.info("Phòng đang đóng. Ứng viên có 5 phút để hoàn thành.");
  }, [roomCode, emitCloseRoom]);

  // Open room — allow candidates to join
  const handleOpenRoom = useCallback(() => {
    emitOpenRoom();
    if (roomCode) {
      interviewService.openRoom(roomCode).catch(() => {});
    }
    // Also start the interview if it hasn't started
    if (interview?.id && interview?.interviewStatus !== "IN_PROGRESS") {
      interviewService.startInterview(interview.id).catch(() => {});
    }
    toast.success("Phòng đã mở. Ứng viên có thể tham gia.");
  }, [roomCode, interview, emitOpenRoom]);

  const toggleScreenShare = async () => {
    if (screenSharing) {
      // Stop screen share → restore camera (if we had one)
      if (localStream) {
        const screenTrack = localStream.getVideoTracks()[0];
        if (screenTrack) {
          screenTrack.stop();
          localStream.removeTrack(screenTrack);
        }
        if (cameraTrackRef.current) {
          localStream.addTrack(cameraTrackRef.current);
          replaceTrack(cameraTrackRef.current, "video");
        }
        if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
      }
      setScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        if (localStream) {
          const oldVideo = localStream.getVideoTracks()[0];
          if (oldVideo) localStream.removeTrack(oldVideo);
          localStream.addTrack(screenTrack);
          replaceTrack(screenTrack, "video");
          if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
        } else {
          // No local stream (no devices) — create one just for screen share
          const newStream = new MediaStream([screenTrack]);
          setLocalStream(newStream);
          if (localVideoRef.current) localVideoRef.current.srcObject = newStream;
        }

        screenTrack.onended = () => {
          if (localStream) {
            localStream.removeTrack(screenTrack);
            if (cameraTrackRef.current) {
              localStream.addTrack(cameraTrackRef.current);
              replaceTrack(cameraTrackRef.current, "video");
            }
            if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
          }
          setScreenSharing(false);
        };

        setScreenSharing(true);
      } catch {
        // User cancelled screen share picker
      }
    }
  };

  // ── Room status badge helper ─────────────────────────
  const roomStatusBadge = (status: RoomStatus) => {
    const map: Record<RoomStatus, { label: string; cls: string }> = {
      SCHEDULED: { label: "Đã lên lịch", cls: "bg-gray-600" },
      WAITING: { label: "Chờ mở phòng", cls: "bg-yellow-600" },
      ACTIVE: { label: "Đang diễn ra", cls: "bg-green-600" },
      CLOSING: { label: "Đang đóng", cls: "bg-orange-600 animate-pulse" },
      ENDED: { label: "Đã kết thúc", cls: "bg-gray-600" },
      EXPIRED: { label: "Hết hạn", cls: "bg-gray-600" },
    };
    const info = map[status] || map.WAITING;
    return <Badge className={`${info.cls} text-white text-xs`}>{info.label}</Badge>;
  };

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[radial-gradient(circle_at_top,#0f172a_0%,#111827_45%,#020617_100%)] px-4">
        <div className="w-full max-w-lg rounded-3xl border border-sky-500/20 bg-slate-900/80 p-8 text-center shadow-2xl shadow-black/50 backdrop-blur-sm">
          <div className="mx-auto mb-5 h-11 w-11 animate-spin rounded-full border-2 border-sky-300/25 border-t-sky-300" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300/80">Room Access Check</p>
          <h1 className="mt-2 text-xl font-bold text-white">Đang kiểm tra phòng phỏng vấn</h1>
          <p className="mt-3 text-sm text-slate-300">
            Hệ thống đang xác minh phòng trước khi mở giao diện phỏng vấn.
          </p>
          {roomCode && <p className="mt-4 text-xs font-mono text-sky-200/70">Mã phòng: {roomCode}</p>}
        </div>
      </div>
    );
  }

  if (roomLookupError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[radial-gradient(circle_at_top,#3f1d2e_0%,#111827_45%,#020617_100%)] px-4">
        <div className="w-full max-w-xl rounded-3xl border border-rose-300/20 bg-slate-950/90 p-8 shadow-2xl shadow-black/60">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-200">
            {roomLookupError.type === "not-found" ? <SearchX className="h-7 w-7" /> : <AlertCircle className="h-7 w-7" />}
          </div>
          <h1 className="mt-5 text-center text-2xl font-bold text-white">{roomLookupError.title}</h1>
          <p className="mx-auto mt-3 max-w-md text-center text-sm leading-6 text-rose-100/80">
            {roomLookupError.description}
          </p>
          {roomCode && <p className="mt-4 text-center text-xs font-mono text-rose-200/70">Mã phòng: {roomCode}</p>}
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              type="button"
              onClick={() => setLookupRetryKey((value) => value + 1)}
              className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-500"
            >
              <RotateCcw className="h-4 w-4" />
              Thử lại
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/interviews")}
              className="inline-flex items-center gap-2 border-slate-700 text-slate-200 hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay về lịch phỏng vấn
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Role check — only HR/ADMIN can access host interview room
  if (user?.role !== "HR" && user?.role !== "ADMIN") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950">
        <div className="w-full max-w-md space-y-6 px-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
            <ShieldAlert className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white">Không có quyền truy cập</h1>
          <p className="text-sm text-gray-400">
            Chỉ HR hoặc Admin mới có thể truy cập phòng phỏng vấn này.
          </p>
          <Button variant="ghost" className="text-gray-400 hover:text-white" onClick={() => navigate("/interviews")}>
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  if (isRoomEnded && interview) {
    const interviewDate = new Date(interview.scheduledAt).toLocaleDateString("vi-VN");

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950">
        <div className="w-full max-w-md space-y-6 px-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-700/40">
            <AlertCircle className="h-8 w-8 text-gray-300" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Phòng phỏng vấn đã kết thúc</h1>
            <p className="mt-2 text-sm text-gray-400">
              Tất cả lịch phỏng vấn hợp lệ trong phòng này đã hết thời gian hoặc đã hoàn tất.
            </p>
          </div>
          <div className="rounded-2xl bg-gray-800/80 p-4 space-y-2">
            <p className="text-sm text-gray-400">Tóm tắt phòng</p>
            <p className="text-lg font-semibold text-white">{interview.jobTitle}</p>
            <p className="text-sm text-gray-400">Ngày phỏng vấn: {interviewDate}</p>
            <p className="text-sm text-gray-400">
              Tổng ứng viên trong phòng: <span className="text-gray-300">{candidateActionItems.length}</span>
            </p>
          </div>
          <Button variant="ghost" className="text-gray-400 hover:text-white" onClick={() => navigate(-1)}>
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  // Pre-join lobby
  if (!joined) {
    const noCamera = hasCamera === false;
    const noMic = hasMic === false;
    const noDevices = noCamera && noMic;
    const hasStream = localStream && localStream.getTracks().some((t) => t.readyState === "live");

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950">
        <div className="w-full max-w-2xl space-y-6 px-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Phòng phỏng vấn</h1>
            <p className="mt-1 text-xs text-gray-500 font-mono">{roomCode}</p>
            {interview && (
              <p className="mt-2 text-sm text-gray-400">
                {interview.jobTitle} — {new Date(interview.scheduledAt).toLocaleString("vi-VN")}
              </p>
            )}
            {candidateActionItems.length > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                {candidateActionItems.length} ứng viên đã được lên lịch trong phòng hôm nay
              </p>
            )}
          </div>

          <div className="relative mx-auto aspect-video max-w-md overflow-hidden rounded-2xl bg-gray-800">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full bg-black object-contain"
            />
            {!hasStream && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-700">
                  {noDevices ? (
                    <VideoOff className="h-8 w-8 text-gray-500" />
                  ) : (
                    <Video className="h-8 w-8 text-gray-400" />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Device status indicators */}
          {hasCamera !== null && (
            <div className="flex items-center justify-center gap-4 text-xs">
              <span className={`flex items-center gap-1 ${hasCamera ? "text-green-400" : "text-gray-500"}`}>
                {hasCamera ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
                {hasCamera ? "Camera sẵn sàng" : "Không có camera"}
              </span>
              <span className={`flex items-center gap-1 ${hasMic ? "text-green-400" : "text-gray-500"}`}>
                {hasMic ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                {hasMic ? "Microphone sẵn sàng" : "Không có microphone"}
              </span>
            </div>
          )}

          {/* Media error message */}
          {mediaError && (
            <div className="mx-auto max-w-md rounded-xl bg-red-900/30 border border-red-800/50 px-4 py-3 text-center">
              <p className="text-sm text-red-300">
                {mediaError === "permission-denied" && "Quyền camera/microphone bị chặn. Hãy cho phép trong cài đặt trình duyệt rồi tải lại trang."}
                {mediaError === "device-busy" && "Thiết bị đang bị ứng dụng khác chiếm dụng. Hãy đóng ứng dụng đó và thử lại."}
                {mediaError === "unsupported" && "Trình duyệt không hỗ trợ truy cập thiết bị media."}
              </p>
            </div>
          )}

          {/* No-devices info banner */}
          {noDevices && hasCamera !== null && !mediaError && (
            <div className="mx-auto max-w-md rounded-xl bg-gray-800/80 border border-gray-700 px-4 py-3 text-center">
              <p className="text-sm text-gray-300">
                Không phát hiện camera và microphone. Bạn vẫn có thể tham gia ở chế độ xem để điều hành phỏng vấn.
              </p>
            </div>
          )}

          <div className="flex items-center justify-center gap-4">
            {hasCamera === null ? (
              <Button onClick={initMedia} variant="outline" className="text-white border-gray-600 hover:bg-gray-800">
                <Video className="h-4 w-4 mr-2" /> Kiểm tra thiết bị
              </Button>
            ) : hasStream ? (
              <>
                <Button
                  size="icon"
                  variant={cameraOn ? "outline" : "destructive"}
                  className={cameraOn ? "border-gray-600 text-white hover:bg-gray-800" : ""}
                  onClick={toggleCamera}
                  disabled={noCamera}
                >
                  {cameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </Button>
                <Button
                  size="icon"
                  variant={micOn ? "outline" : "destructive"}
                  className={micOn ? "border-gray-600 text-white hover:bg-gray-800" : ""}
                  onClick={toggleMic}
                  disabled={noMic}
                >
                  {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </Button>
              </>
            ) : null}
          </div>

          <div className="flex justify-center gap-3">
            <Button
              onClick={handleJoin}
              className="bg-green-600 hover:bg-green-700 px-8"
              disabled={!!mediaError}
            >
              {noDevices ? "Tham gia (chế độ xem)" : "Tham gia phỏng vấn"}
            </Button>
            <Button variant="ghost" className="text-gray-400 hover:text-white" onClick={() => navigate(-1)}>
              Quay lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // In-call UI
  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-gray-950">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2">
        <div className="flex items-center gap-3">
          {recording && (
            <Badge className="bg-red-600 text-white animate-pulse">REC</Badge>
          )}
          <span className="flex items-center gap-1.5 text-sm text-gray-300">
            <Clock className="h-3.5 w-3.5" />
            {fmtElapsed(elapsed)}
          </span>
          {roomStatusBadge(roomStatus)}
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-white">Phòng phỏng vấn</p>
          <p className="text-xs text-gray-400 font-mono">{roomCode}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white" onClick={handleCopyLink}>
            <Copy className="h-4 w-4 mr-1" /> Sao chép link
          </Button>
          {waitingCount > 0 && (
            <Badge className="bg-amber-600 text-white text-xs">
              <Users className="h-3 w-3 mr-1" /> {waitingCount} chờ
            </Badge>
          )}
          <Badge variant="outline" className="border-gray-600 text-gray-300">
            <Users className="h-3 w-3 mr-1" /> {peerCount + 1}
          </Badge>
          {connected && (
            <Badge className="bg-green-600 text-white text-xs">Đã kết nối</Badge>
          )}
        </div>
      </div>

      {/* Host control panel — always visible */}
      <div className="border-b border-gray-800 bg-gray-900/50 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            {/* Room lifecycle buttons */}
            {roomStatus === "WAITING" && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleOpenRoom}
              >
                <DoorOpen className="h-4 w-4 mr-1" /> Mở phòng
              </Button>
            )}
            {roomStatus === "ACTIVE" && (
              <Button
                size="sm"
                variant="outline"
                className="border-orange-600 text-orange-400 hover:bg-orange-900/30"
                onClick={handleCloseRoom}
              >
                <DoorClosed className="h-4 w-4 mr-1" /> Đóng phòng
              </Button>
            )}
            {roomStatus === "CLOSING" && (
              <Badge className="bg-orange-600 text-white animate-pulse">
                <Radio className="h-3 w-3 mr-1" /> Đang đóng (5 phút)
              </Badge>
            )}

            {/* Admission requests */}
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-300">
                <Users className="inline h-4 w-4 mr-1" />
                Yêu cầu tham gia
              </p>
              {joinRequests.length > 0 ? (
                <Badge className="bg-amber-600 text-white">{joinRequests.length}</Badge>
              ) : (
                <span className="text-xs text-gray-500">— Không có</span>
              )}
            </div>
            {/* Kick button */}
            {connected && remotePeerId && (
              <Button
                size="sm"
                variant="ghost"
                className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
                onClick={() => setShowKickConfirm(true)}
              >
                <UserX className="h-4 w-4 mr-1" /> Mời rời phòng
              </Button>
            )}
            {/* In-room evaluate button */}
            {feedbackCandidateOptions.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/30"
                onClick={() => {
                  setFeedbackIsPostMeeting(false);
                  setShowFeedbackModal(true);
                }}
              >
                <ClipboardCheck className="h-4 w-4 mr-1" /> Đánh giá
              </Button>
            )}
          </div>
          {/* End meeting button */}
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={() => setShowEndConfirm(true)}
            disabled={isUploadingRecording}
          >
            <PhoneOff className="h-4 w-4 mr-1" /> Kết thúc phỏng vấn
          </Button>
        </div>
        {/* Join request cards */}
        {joinRequests.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {joinRequests.map((req) => (
              <div
                key={req.socketId}
                className="flex items-center gap-2 rounded-lg bg-gray-800 px-3 py-2"
              >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-200">
                  {getJoinRequestDisplayName(req)}
                </span>
                {req.email && (
                  <span className="text-xs text-gray-400">{req.email}</span>
                )}
              </div>
                <Button
                  size="icon"
                  className="h-7 w-7 rounded-full bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    admitUser(req.socketId);
                    const matched = resolveParticipantFromJoinRequest(req);
                    if (roomCode && matched?.candidateId) {
                      setActiveCandidateId(matched.candidateId);
                      interviewService.admitParticipant(roomCode, matched.candidateId).catch(() => null);
                      setRoomParticipants((prev) =>
                        prev.map((p) =>
                          p.candidateId === matched.candidateId
                            ? { ...p, admitStatus: "ADMITTED", joinedAt: new Date().toISOString() }
                            : p
                        )
                      );
                    }
                  }}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  className="h-7 w-7 rounded-full bg-red-600 hover:bg-red-700"
                  onClick={() => rejectUser(req.socketId)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video grid */}
      <div className="flex-1 min-h-0 p-2 md:p-4">
        <div className="relative flex h-full min-h-0 gap-4">
          <div className="min-h-0 min-w-0 flex-1">
            {isMobile ? (
              /* Mobile: stacked layout — remote full + local PiP */
              <div className="relative h-full">
                {/* Remote video — full area */}
                <div className="absolute inset-0 overflow-hidden rounded-2xl bg-gray-800">
                  {remoteStream ? (
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="h-full w-full bg-black object-contain"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <div className="text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-700 text-2xl font-bold text-white mb-3">
                          ?
                        </div>
                        <p className="text-sm text-gray-400">Đang chờ ứng viên...</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <Badge className="bg-gray-900/70 text-white text-xs">Ứng viên</Badge>
                    {remotePeerId && peerMediaStates[remotePeerId] && (
                      <>
                        {!peerMediaStates[remotePeerId].mic && (
                          <MicOff className="h-3.5 w-3.5 text-red-400" />
                        )}
                        {!peerMediaStates[remotePeerId].camera && (
                          <VideoOff className="h-3.5 w-3.5 text-red-400" />
                        )}
                      </>
                    )}
                  </div>
                </div>
                {/* Local PiP — top-right corner 80×112px */}
                <div className="absolute right-2 top-2 z-10 h-28 w-20 overflow-hidden rounded-xl border-2 border-gray-700 bg-gray-800 shadow-lg">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full bg-black object-cover"
                  />
                  {!cameraOn && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                      <span className="text-xs font-bold text-white">HR</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Tablet/Desktop: side-by-side grid */
              <div className="grid h-full min-h-0 grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
              {/* Local video */}
              <div className="relative min-h-55 overflow-hidden rounded-2xl bg-gray-800">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full bg-black object-contain"
            />
            {!cameraOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-700 text-2xl font-bold text-white">
                  HR
                </div>
              </div>
            )}
            <div className="absolute bottom-3 left-3">
              <Badge className="bg-gray-900/70 text-white text-xs">Bạn (HR)</Badge>
            </div>
            {!micOn && (
              <div className="absolute bottom-3 right-3">
                <MicOff className="h-4 w-4 text-red-400" />
              </div>
            )}
              </div>

              {/* Remote video */}
              <div className="relative min-h-55 overflow-hidden rounded-2xl bg-gray-800">
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="h-full w-full bg-black object-contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-700 text-2xl font-bold text-white mb-3">
                    ?
                  </div>
                  <p className="text-sm text-gray-400">Đang chờ ứng viên tham gia...</p>
                </div>
              </div>
            )}
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <Badge className="bg-gray-900/70 text-white text-xs">Ứng viên</Badge>
              {/* Remote peer media indicators */}
              {remotePeerId && peerMediaStates[remotePeerId] && (
                <>
                  {!peerMediaStates[remotePeerId].mic && (
                    <MicOff className="h-3.5 w-3.5 text-red-400" />
                  )}
                  {!peerMediaStates[remotePeerId].camera && (
                    <VideoOff className="h-3.5 w-3.5 text-red-400" />
                  )}
                  {peerMediaStates[remotePeerId].screen && (
                    <Monitor className="h-3.5 w-3.5 text-blue-400" />
                  )}
                </>
              )}
            </div>
            {/* HR controls on remote video */}
            {connected && remotePeerId && (
              <div className="absolute top-3 right-3 flex items-center gap-1">
                {/* Disable candidate camera */}
                <Button
                  size="icon"
                  className="h-7 w-7 rounded-full bg-gray-800/80 hover:bg-gray-700"
                  onClick={() => disablePeerMedia(remotePeerId, "camera")}
                  title="Tắt camera ứng viên"
                >
                  <VideoOff className="h-3.5 w-3.5 text-gray-300" />
                </Button>
                {/* Disable candidate mic */}
                <Button
                  size="icon"
                  className="h-7 w-7 rounded-full bg-gray-800/80 hover:bg-gray-700"
                  onClick={() => disablePeerMedia(remotePeerId, "mic")}
                  title="Tắt mic ứng viên"
                >
                  <MicOff className="h-3.5 w-3.5 text-gray-300" />
                </Button>
                {/* Kick */}
                <Button
                  size="icon"
                  className="h-7 w-7 rounded-full bg-red-600/80 hover:bg-red-600"
                  onClick={() => setShowKickConfirm(true)}
                  title="Mời ứng viên rời phòng"
                >
                  <UserX className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
              </div>
            </div>
            )}
          </div>

          {/* Candidate management sidebar */}
          <aside className="hidden w-80 shrink-0 rounded-2xl border border-gray-800 bg-gray-900/70 p-3 xl:block">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Quản lý ứng viên trong phòng</p>
              <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs">
                {candidateActionItems.length}
              </Badge>
            </div>

            <div className="space-y-2 max-h-[58vh] overflow-auto pr-1">
              {candidateActionItems.map((iv) => {
                const hasJoined = joinedCandidateApplicationIds.has(iv.applicationId);
                const completed = iv.interviewStatus === "COMPLETED";
                const alreadyReviewed = Array.isArray(iv.feedback) && iv.feedback.length > 0;
                const canReview = hasJoined && completed && !alreadyReviewed;
                return (
                  <div key={iv.id} className="rounded-xl border border-gray-800 bg-gray-900/80 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-100">{iv.candidateName}</p>
                        <p className="mt-1 text-[11px] text-gray-400">
                          {new Date(iv.scheduledAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <Badge className={completed ? "bg-green-600 text-white" : hasJoined ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-200"}>
                        {completed ? "Đã hoàn thành" : hasJoined ? "Đã vào phòng" : "Chưa vào phòng"}
                      </Badge>
                    </div>

                    {!hasJoined && (
                      <p className="mt-2 text-[11px] text-amber-300">
                        Chỉ đánh giá/gán bản ghi sau khi ứng viên đã vào phòng.
                      </p>
                    )}

                    <div className="mt-3 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-gray-600 text-gray-200 hover:bg-gray-800"
                        disabled={completed || !hasJoined}
                        onClick={() => {
                          handleCompleteCandidateInterview(iv).catch(() => {
                            toast.error("Không thể hoàn thành phỏng vấn ứng viên này");
                          });
                        }}
                      >
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Hoàn thành
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 bg-blue-600 hover:bg-blue-700"
                        disabled={!canReview}
                        onClick={() => {
                          if (!canReview) return;
                          setSelectedFeedbackInterviewId(iv.id);
                          setFeedbackIsPostMeeting(false);
                          setShowFeedbackModal(true);
                        }}
                      >
                        <ClipboardCheck className="mr-1 h-3.5 w-3.5" /> {alreadyReviewed ? "Đã đánh giá" : "Đánh giá"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      </div>

      {/* Kick confirmation dialog */}
      {showKickConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-2xl bg-gray-800 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">Xác nhận</h3>
            <p className="text-sm text-gray-400">
              Bạn có chắc muốn mời ứng viên rời khỏi phòng phỏng vấn?
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                className="text-gray-400 hover:text-white"
                onClick={() => setShowKickConfirm(false)}
              >
                Hủy
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={handleKickConfirm}
              >
                Xác nhận
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="flex flex-wrap items-center justify-center gap-3 border-t border-gray-800 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <Button
          size="icon"
          variant={cameraOn ? "outline" : "destructive"}
          className={cameraOn ? "h-12 w-12 rounded-full border-gray-600 text-white hover:bg-gray-800" : "h-12 w-12 rounded-full"}
          onClick={toggleCamera}
          disabled={!localStream || localStream.getVideoTracks().length === 0}
          title={!localStream || localStream.getVideoTracks().length === 0 ? "Không có camera" : undefined}
          aria-label={cameraOn ? "Tắt camera" : "Bật camera"}
        >
          {cameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Button>
        <Button
          size="icon"
          variant={micOn ? "outline" : "destructive"}
          className={micOn ? "h-12 w-12 rounded-full border-gray-600 text-white hover:bg-gray-800" : "h-12 w-12 rounded-full"}
          onClick={toggleMic}
          disabled={!localStream || localStream.getAudioTracks().length === 0}
          title={!localStream || localStream.getAudioTracks().length === 0 ? "Không có microphone" : undefined}
          aria-label={micOn ? "Tắt mic" : "Bật mic"}
        >
          {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </Button>
        <Button
          size="icon"
          variant={screenSharing ? "destructive" : "outline"}
          className={`hidden md:inline-flex ${screenSharing ? "h-12 w-12 rounded-full" : "h-12 w-12 rounded-full border-gray-600 text-white hover:bg-gray-800"}`}
          onClick={toggleScreenShare}
          aria-label={screenSharing ? "Dừng chia sẻ màn hình" : "Chia sẻ màn hình"}
        >
          {screenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
        </Button>
        {/* Manual Record button */}
        <Button
          size="icon"
          variant={recording ? "destructive" : "outline"}
          className={recording ? "h-12 w-12 rounded-full" : "h-12 w-12 rounded-full border-gray-600 text-white hover:bg-gray-800"}
          onClick={toggleRecording}
          title={recording ? "Dừng ghi hình" : "Ghi hình"}
          aria-label={recording ? "Dừng ghi hình" : "Ghi hình"}
        >
          {recording ? <Square className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
        </Button>
        <Button
          size="icon"
          className="h-12 w-12 rounded-full bg-red-600 hover:bg-red-700"
          onClick={() => setShowEndConfirm(true)}
          title="Kết thúc phỏng vấn"
          aria-label="Kết thúc phỏng vấn"
        >
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>

      {/* End meeting confirmation dialog */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-2xl bg-gray-800 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">Kết thúc phỏng vấn</h3>
            <p className="text-sm text-gray-400">
              Bạn muốn kết thúc phỏng vấn hay chỉ rời phòng tạm thời?
            </p>
            <div className="flex flex-col gap-2">
              <Button
                className="bg-red-600 hover:bg-red-700 w-full"
                onClick={handleEndMeeting}
                disabled={ending || isUploadingRecording}
              >
                {ending ? "Đang xử lý..." : "Kết thúc phiên họp"}
              </Button>
              {roomStatus === "ACTIVE" && (
                <Button
                  variant="outline"
                  className="border-orange-600 text-orange-400 hover:bg-orange-900/30 w-full"
                  onClick={() => {
                    handleCloseRoom();
                    setShowEndConfirm(false);
                  }}
                >
                  <DoorClosed className="h-4 w-4 mr-1" /> Đóng phòng (5 phút)
                </Button>
              )}
              <Button
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700 w-full"
                onClick={handleLeave}
              >
                Rời phòng tạm thời
              </Button>
              <Button
                variant="ghost"
                className="text-gray-500 hover:text-white w-full"
                onClick={() => setShowEndConfirm(false)}
              >
                Hủy
              </Button>
            </div>
          </div>
        </div>
      )}

      {showFeedbackModal && interview?.id ? (
        <FeedbackModal
          open={showFeedbackModal}
          onClose={() => {
            setShowFeedbackModal(false);
            setSelectedFeedbackInterviewId(null);
            if (feedbackIsPostMeeting) {
              navigate("/interviews");
            }
          }}
          interviewId={interview.id}
          initialInterviewId={selectedFeedbackInterviewId ?? undefined}
          candidateName={interview.candidateName}
          candidateOptions={feedbackCandidateOptions}
          onSubmitted={async (submittedInterviewId) => {
            const target = roomInterviews.find((iv) => iv.id === submittedInterviewId);
            if (!target) return;
            if (target.interviewStatus === "COMPLETED") return;

            try {
              await handleCompleteCandidateInterview(target);
            } catch {
              toast.warning("Đã gửi đánh giá nhưng chưa thể cập nhật trạng thái hoàn thành");
            }
          }}
        />
      ) : null}

      {showRecordingAssignModal && interview?.id && roomCode ? (
        <RecordingAssignModal
          open={showRecordingAssignModal}
          onClose={() => {
            setShowRecordingAssignModal(false);
            setPendingRecordingUrl(null);
          }}
          roomCode={roomCode}
          recordingUrl={pendingRecordingUrl}
          interviewId={interview.id}
          roomInterviews={roomInterviews}
        />
      ) : null}
    </div>
  );
}
