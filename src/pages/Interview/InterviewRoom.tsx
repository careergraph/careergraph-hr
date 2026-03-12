import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { interviewService } from "@/services/interviewService";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useAuthStore } from "@/stores/authStore";
import type { Interview } from "@/types/interview";

const EARLY_JOIN_MINUTES = 15;

export default function InterviewRoom() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [joined, setJoined] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);

  // Recording state
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Kick confirmation
  const [showKickConfirm, setShowKickConfirm] = useState(false);

  // End meeting confirmation
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [ending, setEnding] = useState(false);

  // Interview info & early join state
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [canJoin, setCanJoin] = useState(false);
  const [countdown, setCountdown] = useState("");

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
  } = useWebRTC({
    roomCode: roomCode ?? "",
    token: accessToken ?? "",
    localStream: localStream,
  });

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Fetch interview info by room code
  useEffect(() => {
    if (!roomCode) return;
    setLoading(true);
    interviewService
      .fetchByRoomCode(roomCode)
      .then((resp) => {
        setInterview(resp?.data ?? null);
      })
      .catch(() => {
        toast.error("Không tìm thấy phòng phỏng vấn");
      })
      .finally(() => setLoading(false));
  }, [roomCode]);

  // Check if user can join (15 min before scheduled)
  useEffect(() => {
    if (!interview?.scheduledAt) return;

    const checkAccess = () => {
      const scheduled = new Date(interview.scheduledAt).getTime();
      const earlyJoinTime = scheduled - EARLY_JOIN_MINUTES * 60 * 1000;
      const now = Date.now();

      if (now >= earlyJoinTime) {
        setCanJoin(true);
        setCountdown("");
      } else {
        setCanJoin(false);
        const diff = earlyJoinTime - now;
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setCountdown(
          `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
        );
      }
    };

    checkAccess();
    const interval = setInterval(checkAccess, 1000);
    return () => clearInterval(interval);
  }, [interview]);

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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      cameraTrackRef.current = stream.getVideoTracks()[0] ?? null;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch {
      toast.error("Không thể truy cập camera/microphone");
    }
  };

  const handleJoin = async () => {
    if (!localStream || localStream.getTracks().every(t => t.readyState === "ended")) {
      await startCamera();
    }
    setJoined(true);
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
      setCameraOn((v) => !v);
    }
  };

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
      setMicOn((v) => !v);
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Đã sao chép link phòng phỏng vấn");
  };

  // ── Manual recording ────────────────────────────────
  const toggleRecording = useCallback(() => {
    if (recording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setRecording(false);
      emitRecordingStopped();
      toast.info("Đã dừng ghi hình");
    } else {
      // Start recording — combine local + remote into one stream
      const tracks: MediaStreamTrack[] = [];
      if (localStream) tracks.push(...localStream.getAudioTracks().filter(t => t.readyState === "live"));
      if (localStream) tracks.push(...localStream.getVideoTracks().filter(t => t.readyState === "live"));
      if (remoteStream) tracks.push(...remoteStream.getTracks().filter(t => t.readyState === "live"));
      if (tracks.length === 0) {
        toast.error("Không có stream để ghi hình. Hãy bật camera hoặc microphone trước.");
        return;
      }

      const combinedStream = new MediaStream(tracks);
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
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `interview-${roomCode}-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        recordedChunksRef.current = [];
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setRecording(true);
      emitRecordingStarted();
      toast.success("Đang ghi hình...");
    }
  }, [recording, localStream, remoteStream, roomCode, emitRecordingStarted, emitRecordingStopped]);

  // ── Kick candidate ──────────────────────────────────
  const handleKickConfirm = useCallback(() => {
    if (remotePeerId) {
      kickUser(remotePeerId);
      toast.info("Đã mời ứng viên rời phòng");
    }
    setShowKickConfirm(false);
  }, [kickUser, remotePeerId]);

  // Stop recording on leave
  const handleLeave = () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      emitRecordingStopped();
    }
    localStream?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
    setJoined(false);
    setScreenSharing(false);
    setRecording(false);
    navigate("/interviews");
  };

  // End meeting — mark interview as COMPLETED
  const handleEndMeeting = useCallback(async () => {
    if (!interview?.id) return;
    setEnding(true);
    try {
      await interviewService.completeInterview(interview.id);
      if (recording) {
        mediaRecorderRef.current?.stop();
        emitRecordingStopped();
      }
      localStream?.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
      setJoined(false);
      setScreenSharing(false);
      setRecording(false);
      toast.success("Phỏng vấn đã kết thúc");
      navigate("/interviews");
    } catch {
      toast.error("Không thể kết thúc phỏng vấn");
    } finally {
      setEnding(false);
      setShowEndConfirm(false);
    }
  }, [interview, recording, localStream, emitRecordingStopped, navigate]);

  const toggleScreenShare = async () => {
    if (screenSharing) {
      // Stop screen share → restore camera
      if (cameraTrackRef.current && localStream) {
        localStream.getVideoTracks().forEach((t) => t.stop());
        localStream.removeTrack(localStream.getVideoTracks()[0]);
        localStream.addTrack(cameraTrackRef.current);
        replaceTrack(cameraTrackRef.current, "video");
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
        }

        screenTrack.onended = () => {
          // User clicked browser "Stop sharing" button
          if (cameraTrackRef.current && localStream) {
            localStream.removeTrack(screenTrack);
            localStream.addTrack(cameraTrackRef.current);
            replaceTrack(cameraTrackRef.current, "video");
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

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-gray-600 border-t-white" />
          <p className="text-gray-400 text-sm">Đang tải thông tin phòng phỏng vấn...</p>
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

  // Interview already completed — block re-access
  if (interview?.interviewStatus === "COMPLETED") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950">
        <div className="w-full max-w-md space-y-6 px-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
            <CheckCircle2 className="h-8 w-8 text-green-400" />
          </div>
          <h1 className="text-xl font-bold text-white">Phỏng vấn đã kết thúc</h1>
          <p className="text-sm text-gray-400">
            Cuộc phỏng vấn này đã hoàn thành và không thể truy cập lại.
          </p>
          <Button variant="ghost" className="text-gray-400 hover:text-white" onClick={() => navigate("/interviews")}>
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  // Too early to join
  if (!canJoin && interview) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950">
        <div className="w-full max-w-md space-y-6 px-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20">
            <AlertCircle className="h-8 w-8 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Chưa đến giờ phỏng vấn</h1>
            <p className="mt-2 text-sm text-gray-400">
              Bạn có thể vào phòng trước {EARLY_JOIN_MINUTES} phút so với giờ hẹn
            </p>
          </div>
          <div className="rounded-2xl bg-gray-800/80 p-4 space-y-2">
            <p className="text-sm text-gray-400">Lịch phỏng vấn</p>
            <p className="text-lg font-semibold text-white">
              {new Date(interview.scheduledAt).toLocaleString("vi-VN")}
            </p>
            {interview.candidateName && (
              <p className="text-sm text-gray-400">
                Ứng viên: <span className="text-gray-300">{interview.candidateName}</span>
              </p>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Có thể vào sau</p>
            <p className="text-3xl font-mono font-bold text-white">{countdown}</p>
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
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950">
        <div className="w-full max-w-2xl space-y-6 px-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Phòng phỏng vấn</h1>
            <p className="mt-1 text-xs text-gray-500 font-mono">{roomCode}</p>
            {interview && (
              <p className="mt-2 text-sm text-gray-400">
                {interview.candidateName} — {new Date(interview.scheduledAt).toLocaleString("vi-VN")}
              </p>
            )}
          </div>

          <div className="relative mx-auto aspect-video max-w-md overflow-hidden rounded-2xl bg-gray-800">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            {!localStream && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-700">
                  <Video className="h-8 w-8 text-gray-400" />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-4">
            {!localStream ? (
              <Button onClick={startCamera} variant="outline" className="text-white border-gray-600 hover:bg-gray-800">
                <Video className="h-4 w-4 mr-2" /> Bật camera để kiểm tra
              </Button>
            ) : (
              <>
                <Button
                  size="icon"
                  variant={cameraOn ? "outline" : "destructive"}
                  className={cameraOn ? "border-gray-600 text-white hover:bg-gray-800" : ""}
                  onClick={toggleCamera}
                >
                  {cameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </Button>
                <Button
                  size="icon"
                  variant={micOn ? "outline" : "destructive"}
                  className={micOn ? "border-gray-600 text-white hover:bg-gray-800" : ""}
                  onClick={toggleMic}
                >
                  {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </Button>
              </>
            )}
          </div>

          <div className="flex justify-center gap-3">
            <Button onClick={handleJoin} className="bg-green-600 hover:bg-green-700 px-8">
              Tham gia phỏng vấn
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
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950">
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
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-white">Phòng phỏng vấn</p>
          <p className="text-xs text-gray-400 font-mono">{roomCode}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white" onClick={handleCopyLink}>
            <Copy className="h-4 w-4 mr-1" /> Sao chép link
          </Button>
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
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
          </div>
          {/* End meeting button */}
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={() => setShowEndConfirm(true)}
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
                <span className="text-sm font-medium text-gray-200">{req.fullName || req.userId}</span>
                {req.email && (
                  <span className="text-xs text-gray-400">{req.email}</span>
                )}
              </div>
                <Button
                  size="icon"
                  className="h-7 w-7 rounded-full bg-green-600 hover:bg-green-700"
                  onClick={() => admitUser(req.socketId)}
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
      <div className="flex-1 p-4">
        <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-2">
          {/* Local video */}
          <div className="relative overflow-hidden rounded-2xl bg-gray-800">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
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
          <div className="relative overflow-hidden rounded-2xl bg-gray-800">
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
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
            <div className="absolute bottom-3 left-3">
              <Badge className="bg-gray-900/70 text-white text-xs">Ứng viên</Badge>
            </div>
            {/* Kick button on remote video */}
            {connected && remotePeerId && (
              <div className="absolute top-3 right-3">
                <Button
                  size="icon"
                  className="h-8 w-8 rounded-full bg-red-600/80 hover:bg-red-600"
                  onClick={() => setShowKickConfirm(true)}
                  title="Mời ứng viên rời phòng"
                >
                  <UserX className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kick confirmation dialog */}
      {showKickConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
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
      <div className="flex items-center justify-center gap-3 border-t border-gray-800 px-4 py-4">
        <Button
          size="icon"
          variant={cameraOn ? "outline" : "destructive"}
          className={cameraOn ? "h-12 w-12 rounded-full border-gray-600 text-white hover:bg-gray-800" : "h-12 w-12 rounded-full"}
          onClick={toggleCamera}
        >
          {cameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Button>
        <Button
          size="icon"
          variant={micOn ? "outline" : "destructive"}
          className={micOn ? "h-12 w-12 rounded-full border-gray-600 text-white hover:bg-gray-800" : "h-12 w-12 rounded-full"}
          onClick={toggleMic}
        >
          {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </Button>
        <Button
          size="icon"
          variant={screenSharing ? "destructive" : "outline"}
          className={screenSharing ? "h-12 w-12 rounded-full" : "h-12 w-12 rounded-full border-gray-600 text-white hover:bg-gray-800"}
          onClick={toggleScreenShare}
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
        >
          {recording ? <Square className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
        </Button>
        <Button
          size="icon"
          className="h-12 w-12 rounded-full bg-red-600 hover:bg-red-700"
          onClick={() => setShowEndConfirm(true)}
          title="Kết thúc phỏng vấn"
        >
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>

      {/* End meeting confirmation dialog */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-2xl bg-gray-800 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">Kết thúc phỏng vấn</h3>
            <p className="text-sm text-gray-400">
              Bạn muốn kết thúc phỏng vấn hay chỉ rời phòng tạm thời?
            </p>
            <div className="flex flex-col gap-2">
              <Button
                className="bg-red-600 hover:bg-red-700 w-full"
                onClick={handleEndMeeting}
                disabled={ending}
              >
                {ending ? "Đang xử lý..." : "Kết thúc phỏng vấn (hoàn thành)"}
              </Button>
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
    </div>
  );
}
