import { useEffect, useRef, useState } from "react";
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
  MessageSquare,
  Users,
  Copy,
  Clock,
  AlertCircle,
} from "lucide-react";
import { interviewService } from "@/services/interviewService";
import type { Interview } from "@/types/interview";

const EARLY_JOIN_MINUTES = 15;

export default function InterviewRoom() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [joined, setJoined] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Interview info & early join state
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [canJoin, setCanJoin] = useState(false);
  const [countdown, setCountdown] = useState("");

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
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch {
      toast.error("Không thể truy cập camera/microphone");
    }
  };

  const handleJoin = async () => {
    await startCamera();
    setJoined(true);
  };

  const handleLeave = () => {
    localStream?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
    setJoined(false);
    navigate("/interviews");
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
          <Badge className="bg-red-600 text-white animate-pulse">REC</Badge>
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
            <Users className="h-3 w-3 mr-1" /> 1
          </Badge>
        </div>
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

          {/* Remote video placeholder */}
          <div className="relative overflow-hidden rounded-2xl bg-gray-800">
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-700 text-2xl font-bold text-white mb-3">
                  ?
                </div>
                <p className="text-sm text-gray-400">Đang chờ ứng viên tham gia...</p>
              </div>
            </div>
            <div className="absolute bottom-3 left-3">
              <Badge className="bg-gray-900/70 text-white text-xs">Ứng viên</Badge>
            </div>
          </div>
        </div>
      </div>

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
        <Button size="icon" variant="outline" className="h-12 w-12 rounded-full border-gray-600 text-white hover:bg-gray-800">
          <Monitor className="h-5 w-5" />
        </Button>
        <Button size="icon" variant="outline" className="h-12 w-12 rounded-full border-gray-600 text-white hover:bg-gray-800">
          <MessageSquare className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          className="h-12 w-12 rounded-full bg-red-600 hover:bg-red-700"
          onClick={handleLeave}
        >
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
