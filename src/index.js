require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SIGNER_KEY || "";
const CORS_ORIGINS = (
  process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:5000"
).split(",");

const io = new Server(server, {
  cors: { origin: CORS_ORIGINS, credentials: true },
});

// ── Room state ──────────────────────────────────────────────
// rooms: Map<roomCode, Set<socketId>>           — admitted peers
// hosts: Map<roomCode, socketId>                — the HR host socket
// waitingRoom: Map<roomCode, Map<socketId, { userId, email, displayName }>>  — pending candidates
// admittedUsers: Map<roomCode, Set<userId>>     — candidates who were approved at least once
const rooms = new Map();
const hosts = new Map();
const waitingRoom = new Map();
const admittedUsers = new Map();

// ── Auth middleware ─────────────────────────────────────────
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Missing token"));

  try {
    const decoded = jwt.verify(token, Buffer.from(JWT_SECRET, "base64"), {
      algorithms: ["HS384"],
    });
    socket.data.user = decoded;
    // Determine role from JWT (Spring Boot puts role in "scope" or "role" claim)
    const role = (decoded.role || decoded.scope || "").toString().toUpperCase();
    socket.data.isHost = role.includes("HR") || role.includes("ADMIN") || role.includes("ENTERPRISE");
    console.log(`[auth] sub=${decoded.sub} role=${decoded.role} scope=${decoded.scope} isHost=${socket.data.isHost}`);
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

// ── Helper: add socket to room ──────────────────────────────
function addToRoom(socket, roomCode) {
  const userId = socket.data.user.sub;
  socket.join(roomCode);
  socket.data.roomCode = roomCode;

  if (!rooms.has(roomCode)) rooms.set(roomCode, new Set());
  rooms.get(roomCode).add(socket.id);

  // Notify existing peers
  socket.to(roomCode).emit("user-joined", { socketId: socket.id, userId });

  // Tell joiner about existing peers
  const peers = [];
  for (const id of rooms.get(roomCode)) {
    if (id !== socket.id) {
      peers.push({ socketId: id, userId: io.sockets.sockets.get(id)?.data?.user?.sub });
    }
  }
  socket.emit("room-peers", peers);

  console.log(`[join] ${userId} → room ${roomCode} (${rooms.get(roomCode).size} peers)`);
}

function buildDisplayName(user) {
  if (!user || typeof user !== "object") return "";

  const firstName = (user.firstName || "").toString().trim();
  const lastName = (user.lastName || "").toString().trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  if (fullName) return fullName;

  const name = (user.name || "").toString().trim();
  if (name) return name;

  const email = (user.email || "").toString().trim();
  if (email.includes("@")) return email.split("@")[0];

  return "";
}

// ── Connection handler ──────────────────────────────────────
io.on("connection", (socket) => {
  const { sub: userId } = socket.data.user;
  const isHost = socket.data.isHost;
  console.log(`[connect] ${userId} (${socket.id}) host=${isHost}`);

  // ── Join room (HR host only — direct entry) ───────────────
  socket.on("join-room", (roomCode) => {
    if (!roomCode || typeof roomCode !== "string") return;

    if (isHost) {
      // HR joins directly and becomes host
      hosts.set(roomCode, socket.id);
      addToRoom(socket, roomCode);

      // If there are candidates in the waiting room, notify the host
      const waiting = waitingRoom.get(roomCode);
      if (waiting && waiting.size > 0) {
        for (const [wSocketId, info] of waiting) {
          socket.emit("join-request", {
            socketId: wSocketId,
            userId: info.userId,
            email: info.email || "",
            displayName: info.displayName || "",
          });
        }
      }
    } else {
      const admitted = admittedUsers.get(roomCode);
      if (admitted?.has(userId)) {
        socket.emit("admitted");
        addToRoom(socket, roomCode);
        console.log(`[rejoin] ${userId} rejoined ${roomCode} (already admitted)`);
        return;
      }

      // Candidate: check if host is present. If no host yet, go to waiting room.
      // If host exists, send join request for approval.
      if (!waitingRoom.has(roomCode)) waitingRoom.set(roomCode, new Map());
      waitingRoom.get(roomCode).set(socket.id, {
        userId,
        email: socket.data.user.email || "",
        displayName: buildDisplayName(socket.data.user),
      });
      socket.data.roomCode = roomCode;

      const hostSocketId = hosts.get(roomCode);
      if (hostSocketId) {
        io.to(hostSocketId).emit("join-request", {
          socketId: socket.id,
          userId,
          email: socket.data.user.email || "",
          displayName: buildDisplayName(socket.data.user),
        });
        socket.emit("waiting-for-host", { status: "pending" });
      } else {
        socket.emit("waiting-for-host", { status: "no-host" });
      }
      console.log(`[waiting] ${userId} → room ${roomCode}`);
    }
  });

  // ── Admit user (HR host approves candidate) ───────────────
  socket.on("admit-user", ({ socketId }) => {
    if (!isHost || !socketId) return;
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;

    const waiting = waitingRoom.get(roomCode);
    if (waiting) waiting.delete(socketId);

    const target = io.sockets.sockets.get(socketId);
    if (target) {
      if (!admittedUsers.has(roomCode)) admittedUsers.set(roomCode, new Set());
      admittedUsers.get(roomCode).add(target.data?.user?.sub);
      target.emit("admitted");
      addToRoom(target, roomCode);
    }
    console.log(`[admit] ${userId} admitted ${socketId} to ${roomCode}`);
  });

  // ── Reject user (HR host rejects candidate) ──────────────
  socket.on("reject-user", ({ socketId }) => {
    if (!isHost || !socketId) return;
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;

    const waiting = waitingRoom.get(roomCode);
    if (waiting) waiting.delete(socketId);

    io.to(socketId).emit("rejected");
    console.log(`[reject] ${userId} rejected ${socketId} from ${roomCode}`);
  });

  // ── Kick user (HR removes candidate from call) ───────────
  socket.on("kick-user", ({ socketId }) => {
    if (!isHost || !socketId) return;
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;

    const target = io.sockets.sockets.get(socketId);
    if (target) {
      admittedUsers.get(roomCode)?.delete(target.data?.user?.sub);
      io.to(socketId).emit("kicked");
      target.leave(roomCode);
      const roomSet = rooms.get(roomCode);
      if (roomSet) {
        roomSet.delete(socketId);
        socket.to(roomCode).emit("user-left", {
          socketId,
          userId: target.data?.user?.sub,
        });
      }
      target.data.roomCode = null;
    }
    console.log(`[kick] ${userId} kicked ${socketId} from ${roomCode}`);
  });

  // ── Recording signals (relay to room) ─────────────────────
  socket.on("recording-started", () => {
    if (!isHost) return;
    const roomCode = socket.data.roomCode;
    if (roomCode) socket.to(roomCode).emit("recording-started");
  });

  socket.on("recording-stopped", () => {
    if (!isHost) return;
    const roomCode = socket.data.roomCode;
    if (roomCode) socket.to(roomCode).emit("recording-stopped");
  });

  // ── WebRTC signaling ──────────────────────────────────────
  socket.on("offer", ({ to, offer }) => {
    if (!to || !offer) return;
    io.to(to).emit("offer", { from: socket.id, offer });
  });

  socket.on("answer", ({ to, answer }) => {
    if (!to || !answer) return;
    io.to(to).emit("answer", { from: socket.id, answer });
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    if (!to || !candidate) return;
    io.to(to).emit("ice-candidate", { from: socket.id, candidate });
  });

  // ── Disconnect ────────────────────────────────────────────
  socket.on("disconnect", () => {
    const roomCode = socket.data.roomCode;
    if (roomCode) {
      // Remove from room
      const roomSet = rooms.get(roomCode);
      if (roomSet) {
        roomSet.delete(socket.id);
        if (roomSet.size === 0) rooms.delete(roomCode);
        socket.to(roomCode).emit("user-left", { socketId: socket.id, userId });
      }

      // Remove from waiting room
      const waiting = waitingRoom.get(roomCode);
      if (waiting) {
        waiting.delete(socket.id);
        if (waiting.size === 0) waitingRoom.delete(roomCode);
        // Notify host that a waiting user left
        const hostSocketId = hosts.get(roomCode);
        if (hostSocketId) {
          io.to(hostSocketId).emit("waiting-user-left", { socketId: socket.id });
        }
      }

      // Remove host
      if (hosts.get(roomCode) === socket.id) {
        hosts.delete(roomCode);
      }

      const roomSetAfter = rooms.get(roomCode);
      const waitingAfter = waitingRoom.get(roomCode);
      const hasHost = hosts.has(roomCode);
      if ((!roomSetAfter || roomSetAfter.size === 0) && (!waitingAfter || waitingAfter.size === 0) && !hasHost) {
        admittedUsers.delete(roomCode);
      }
    }
    console.log(`[disconnect] ${userId}`);
  });
});

// ── Health endpoint ─────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok" }));

server.listen(PORT, () => {
  console.log(`[careergraph-rtc] Signaling server on :${PORT}`);
});
