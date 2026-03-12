const { io } = require("socket.io-client");
const http = require("http");

const HR_TOKEN =
  "eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJkMDAwMDAwMi0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDEiLCJjb21wYW55SWQiOiJjMDAwMDAwMS0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDEiLCJyb2xlIjoiSFIiLCJmYW0iOiI5ODcxMTU1Zi03MjAzLTRiYzEtYjE5ZC02NWQxODFlOGI1YzQiLCJpc3MiOiJjYXJlZXJncmFwaC1zeXN0ZW0iLCJleHAiOjE3NzMzMDU4OTIsImNhbmRpZGF0ZUlkIjoiIiwidHlwZSI6ImFjY2VzcyIsImlhdCI6MTc3MzMwMjI5MiwianRpIjoiZjg2ZThiZDQtYjM2Yy00Y2QxLTkxMmMtOWQyZjc0NTlmYjdmIiwiZW1haWwiOiJoci5mcHRAY2FyZWVyZ3JhcGgudm4ifQ.W3IVE82gJS12e9UsIx0ef1aBzsaSxuJEdr1Y6Xj0BPVHoiJxw-ZhDiY8ZPYi2_fj";

function login(email, password) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ email, password });
    const req = http.request(
      {
        hostname: "localhost",
        port: 8010,
        path: "/careergraph/api/v1/auth/login",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": data.length,
        },
      },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch {
            reject(new Error("Invalid JSON: " + body.slice(0, 200)));
          }
        });
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function test() {
  // Use a pre-generated candidate token (USER role)
  const candidateToken = "eyJhbGciOiJIUzM4NCIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjYW5kaWRhdGUtdGVzdC0wMDEiLCJyb2xlIjoiVVNFUiIsImNhbmRpZGF0ZUlkIjoiYy10ZXN0LTAwMSIsImNvbXBhbnlJZCI6IiIsInR5cGUiOiJhY2Nlc3MiLCJpc3MiOiJjYXJlZXJncmFwaC1zeXN0ZW0iLCJlbWFpbCI6InRlc3QtY2FuZGlkYXRlQHRlc3QuY29tIiwiaWF0IjoxNzczMzAzOTIyLCJleHAiOjE3NzMzMDc1MjJ9.1wriEeBb_CXBkQSZk61pamBxLRbZwiPTC7od6xvy6m52tskp8V7MxTOJAQIzjDfe";

  const ROOM = "e2e-test-room-" + Date.now();
  console.log("[TEST] room:", ROOM);

  // Connect HR
  const hr = io("http://localhost:4000", {
    auth: { token: HR_TOKEN },
    transports: ["websocket"],
  });

  hr.on("connect", () => {
    console.log("[HR] connected as", hr.id);
    hr.emit("join-room", ROOM);
  });

  hr.on("connect_error", (err) => {
    console.log("[HR] connect error:", err.message);
    process.exit(1);
  });
  hr.on("room-peers", (peers) => console.log("[HR] room-peers:", peers));
  hr.on("join-request", (req) => {
    console.log("[HR] >>> JOIN-REQUEST received <<<", req);
    hr.emit("admit-user", { socketId: req.socketId });
    console.log("[HR] admitted candidate", req.socketId);
  });

  // Wait for HR to join, then connect candidate
  setTimeout(() => {
    if (candidateToken == null) {
      console.log("[TEST] No candidate token, skipping candidate test");
      hr.disconnect();
      process.exit(0);
      return;
    }

    const cand = io("http://localhost:4000", {
      auth: { token: candidateToken },
      transports: ["websocket"],
    });

    cand.on("connect", () => {
      console.log("[CAND] connected as", cand.id);
      cand.emit("join-room", ROOM);
    });
    cand.on("connect_error", (err) => {
      console.log("[CAND] connect error:", err.message);
      process.exit(1);
    });
    cand.on("waiting-for-host", (s) =>
      console.log("[CAND] waiting-for-host:", s)
    );
    cand.on("admitted", () => console.log("[CAND] >>> ADMITTED <<<"));
    cand.on("rejected", () => console.log("[CAND] rejected"));
    cand.on("room-peers", (peers) => console.log("[CAND] room-peers:", peers));
    cand.on("user-joined", (u) => console.log("[CAND] user-joined:", u));

    setTimeout(() => {
      console.log("[TEST] === DONE ===");
      hr.disconnect();
      cand.disconnect();
      process.exit(0);
    }, 3000);
  }, 1000);
}

test();
