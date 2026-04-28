const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { randomUUID } = require("crypto");
const mongoose = require("mongoose");

const app = express();



const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/device.html");
});

app.use(express.static("public"));

function generateRoomCode(length = 5){
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code;

  do {
    code = "";
    for(let i = 0; i < length; i++){
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while(rooms[code]);

  return code;
}

let rooms = {};

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB conectado"))
  .catch(err => console.error("❌ Erro ao conectar MongoDB:", err));

mongoose.connection.on("connected", () => {
  console.log("✅ Mongoose conectado de verdade");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ Erro de conexão Mongoose:", err.message);
});

const roomLogSchema = new mongoose.Schema({
  roomCode: String,
  createdAt: Date,
  closedAt: Date,
  status: String,
  players: {
    blue: String,
    red: String
  },
  spectators: [String],
  accesses: [
    {
      name: String,
      role: String,
      action: String,
      socketId: String,
      at: Date
    }
  ]
});

const RoomLog = mongoose.model("RoomLog", roomLogSchema);

const DEV_PANEL_PASSWORD = process.env.DEV_PANEL_PASSWORD || "admin123";

function getRoomDuration(createdAt, closedAt = null){
  if(!createdAt) return "00:00:00";

  const end = closedAt ? new Date(closedAt).getTime() : Date.now();
  const start = new Date(createdAt).getTime();

  let seconds = Math.floor((end - start) / 1000);

  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  seconds %= 3600;

  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");

  return `${h}:${m}:${s}`;
}

async function registerRoomAccess(roomCode, socket, action){
  console.log("📌 registerRoomAccess chamado:", {
  roomCode,
  action,
  name: socket.playerName,
  role: socket.role
});
  const room = rooms[roomCode];
  if(!room) return;

  if(!room.devInfo){
    room.devInfo = {
      roomCode,
      createdAt: new Date().toISOString(),
      closedAt: null,
      accesses: []
    };
  }

  const now = new Date();

  const lastSame = [...room.devInfo.accesses]
    .reverse()
    .find(a =>
      a.name === socket.playerName &&
      a.role === socket.role &&
      a.action === action
    );

  if(lastSame && now - new Date(lastSame.at) < 3000){
    return;
  }

  const access = {
    name: socket.playerName || "Sem nome",
    role: socket.role || "sem função",
    socketId: socket.id,
    action,
    at: now
  };

  room.devInfo.accesses.push(access);

  try{
    await RoomLog.findOneAndUpdate(
      { roomCode },
      {
        $setOnInsert: {
          roomCode,
          createdAt: room.devInfo.createdAt
        },
        $set: {
          players: room.players || {},
          spectators: room.spectators || [],
          closedAt: room.devInfo.closedAt || null,
          status: room.devInfo.closedAt ? "encerrada" : "aberta"
        },
        $push: {
          accesses: access
        }
      },
      {
        upsert: true,
        new: true
      }
    );
    console.log("✅ Registro salvo no Mongo:", roomCode, action);
  }catch(err){
    console.error("❌ Erro ao salvar log no Mongo:", err.message);
    console.error(err);
  }
}

function shuffle(array){
  for(let i = array.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
/* ===============================
   🎴 DECKS OFICIAIS (SERVIDOR)
================================ */

rooms["TESTE"] = {
  players: {        // 🔥 ADICIONE ISSO
    blue: null,
    red: null
  },

  blueConnected:false,
  redConnected:false,

  hands:{ blue:[], red:[] },

  decks:{ 
    A:[],M:[],D:[],G:[],P:[],T:[],
    A_red:[],M_red:[],D_red:[],G_red:[],P_red:[]
  },

  boardSlots:{
    A:[],M:[],D:[],G:[],
    A_red:[],M_red:[],D_red:[],G_red:[],
    P1:[],P2:[],P1_red:[],P2_red:[]
  },

  twists:[],
  subTokens:{}
};

let decks = {

  /* ================= AZUL ================= */

  A: [
    {type:"A",value:1,front:"https://i.imgur.com/vUy286Z.png"},
    {type:"A",value:2,front:"https://i.imgur.com/PcI0Vg0.png"},
    {type:"A",value:3,front:"https://i.imgur.com/tQ5NRhZ.png"},
    {type:"A",value:4,front:"https://i.imgur.com/qvVCUvs.png"},
    {type:"A",value:5,front:"https://i.imgur.com/b8BUvIr.png"},
    {type:"A",value:6,front:"https://i.imgur.com/uUYXht4.png"},
    {type:"A",value:7,front:"https://i.imgur.com/9JlDEiD.png"},
    {type:"A",value:8,front:"https://i.imgur.com/7p064Zr.png"},
    {type:"A",value:9,front:"https://i.imgur.com/JnGApCb.png"},
    {type:"A",value:10,front:"https://i.imgur.com/s4cqIRX.png"},
    {type:"A",value:11,front:"https://i.imgur.com/oShuvz0.png"}
  ],

  M: [
    {type:"M",value:1,front:"https://i.imgur.com/ugO1evz.png"},
    {type:"M",value:2,front:"https://i.imgur.com/mmTSHr0.png"},
    {type:"M",value:3,front:"https://i.imgur.com/waMOMtp.png"},
    {type:"M",value:4,front:"https://i.imgur.com/wZRwPFu.png"},
    {type:"M",value:5,front:"https://i.imgur.com/IS6ZtbR.png"},
    {type:"M",value:6,front:"https://i.imgur.com/jAWX4zE.png"},
    {type:"M",value:7,front:"https://i.imgur.com/LJhq0nv.png"},
    {type:"M",value:8,front:"https://i.imgur.com/vqdoNCs.png"},
    {type:"M",value:9,front:"https://i.imgur.com/rj4f8V4.png"},
    {type:"M",value:10,front:"https://i.imgur.com/z6Iu3cF.png"},
    {type:"M",value:11,front:"https://i.imgur.com/ZOLX7FA.png"}
  ],

  D: [
    {type:"D",value:1,front:"https://i.imgur.com/D1Y4e26.png"},
    {type:"D",value:2,front:"https://i.imgur.com/oMZM3MY.png"},
    {type:"D",value:3,front:"https://i.imgur.com/RuSt23l.png"},
    {type:"D",value:4,front:"https://i.imgur.com/S8solyg.png"},
    {type:"D",value:5,front:"https://i.imgur.com/SvbTxPU.png"},
    {type:"D",value:6,front:"https://i.imgur.com/CBX45jL.png"},
    {type:"D",value:7,front:"https://i.imgur.com/VrydzEx.png"},
    {type:"D",value:8,front:"https://i.imgur.com/TZtXcos.png"},
    {type:"D",value:9,front:"https://i.imgur.com/edygsCM.png"},
    {type:"D",value:10,front:"https://i.imgur.com/5ozxRfC.png"},
    {type:"D",value:11,front:"https://i.imgur.com/tMM8885.png"}
  ],

  G: [
    {type:"G",value:1,front:"https://i.imgur.com/lp3QMF3.png"},
    {type:"G",value:2,front:"https://i.imgur.com/3jcTA5Y.png"},
    {type:"G",value:3,front:"https://i.imgur.com/H6xUtnk.png"},
    {type:"G",value:4,front:"https://i.imgur.com/Dnu7miw.png"},
    {type:"G",value:5,front:"https://i.imgur.com/whdZPGA.png"},
    {type:"G",value:6,front:"https://i.imgur.com/RxQwOpm.png"},
    {type:"G",value:7,front:"https://i.imgur.com/A2gOjsC.png"},
    {type:"G",value:8,front:"https://i.imgur.com/Hzr5yXJ.png"},
    {type:"G",value:9,front:"https://i.imgur.com/TDJACZ7.png"},
    {type:"G",value:10,front:"https://i.imgur.com/8KBP5mp.png"},
    {type:"G",value:11,front:"https://i.imgur.com/YbpqY9d.png"}
  ],

  P: [
    {type:"P",value:1,front:"https://i.imgur.com/q918kK5.png"},
    {type:"P",value:2,front:"https://i.imgur.com/E6oqQUD.png"},
    {type:"P",value:3,front:"https://i.imgur.com/LUdrcpW.png"},
    {type:"P",value:4,front:"https://i.imgur.com/Dyd1beK.png"}
  ],

  /* ================= VERMELHO ================= */

  A_red: [
    {type:"A_red",value:1,front:"https://i.imgur.com/Ox1fYFc.png"},
    {type:"A_red",value:2,front:"https://i.imgur.com/3f4rk4X.png"},
    {type:"A_red",value:3,front:"https://i.imgur.com/VVlU4jz.png"},
    {type:"A_red",value:4,front:"https://i.imgur.com/7qfxbUY.png"},
    {type:"A_red",value:5,front:"https://i.imgur.com/npFXh4J.png"},
    {type:"A_red",value:6,front:"https://i.imgur.com/uiA8HxH.png"},
    {type:"A_red",value:7,front:"https://i.imgur.com/p3Z6cCH.png"},
    {type:"A_red",value:8,front:"https://i.imgur.com/AvqPnY1.png"},
    {type:"A_red",value:9,front:"https://i.imgur.com/AWvBiuS.png"},
    {type:"A_red",value:10,front:"https://i.imgur.com/6tLct3H.png"},
    {type:"A_red",value:11,front:"https://i.imgur.com/zp11MUZ.png"}
  ],

  M_red: [
    {type:"M_red",value:1,front:"https://i.imgur.com/ZcPx8cX.png"},
    {type:"M_red",value:2,front:"https://i.imgur.com/mcKvtAH.png"},
    {type:"M_red",value:3,front:"https://i.imgur.com/CEh861E.png"},
    {type:"M_red",value:4,front:"https://i.imgur.com/kkbZpfH.png"},
    {type:"M_red",value:5,front:"https://i.imgur.com/Vba63zo.png"},
    {type:"M_red",value:6,front:"https://i.imgur.com/1mhakyR.png"},
    {type:"M_red",value:7,front:"https://i.imgur.com/OZp4Efe.png"},
    {type:"M_red",value:8,front:"https://i.imgur.com/IFreM5i.png"},
    {type:"M_red",value:9,front:"https://i.imgur.com/P7cTZDA.png"},
    {type:"M_red",value:10,front:"https://i.imgur.com/76Z7zJl.png"},
    {type:"M_red",value:11,front:"https://i.imgur.com/pAnCm23.png"}
  ],

  D_red: [
    {type:"D_red",value:1,front:"https://i.imgur.com/lPZesbG.png"},
    {type:"D_red",value:2,front:"https://i.imgur.com/v3F4Kct.png"},
    {type:"D_red",value:3,front:"https://i.imgur.com/9qcc0CE.png"},
    {type:"D_red",value:4,front:"https://i.imgur.com/dhHbgan.png"},
    {type:"D_red",value:5,front:"https://i.imgur.com/c6w9629.png"},
    {type:"D_red",value:6,front:"https://i.imgur.com/wh15noc.png"},
    {type:"D_red",value:7,front:"https://i.imgur.com/oBNLGs0.png"},
    {type:"D_red",value:8,front:"https://i.imgur.com/CnJo00j.png"},
    {type:"D_red",value:9,front:"https://i.imgur.com/DqWaWdG.png"},
    {type:"D_red",value:10,front:"https://i.imgur.com/m22k8OK.png"},
    {type:"D_red",value:11,front:"https://i.imgur.com/Z1pg7Wi.png"}
  ],

  G_red: [
    {type:"G_red",value:1,front:"https://i.imgur.com/JFzyatJ.png"},
    {type:"G_red",value:2,front:"https://i.imgur.com/OZJV6IK.png"},
    {type:"G_red",value:3,front:"https://i.imgur.com/Hz8nzLI.png"},
    {type:"G_red",value:4,front:"https://i.imgur.com/q61mnXU.png"},
    {type:"G_red",value:5,front:"https://i.imgur.com/rcV44fT.png"},
    {type:"G_red",value:6,front:"https://i.imgur.com/2MvaDeB.png"},
    {type:"G_red",value:7,front:"https://i.imgur.com/cGecO58.png"},
    {type:"G_red",value:8,front:"https://i.imgur.com/QCOHL64.png"},
    {type:"G_red",value:9,front:"https://i.imgur.com/HkHASpy.png"},
    {type:"G_red",value:10,front:"https://i.imgur.com/nBXhvP6.png"},
    {type:"G_red",value:11,front:"https://i.imgur.com/AZ4KvrL.png"}
  ],

  P_red: [
    {type:"P_red",value:1,front:"https://i.imgur.com/xABDnQG.png"},
    {type:"P_red",value:2,front:"https://i.imgur.com/BDpzEAt.png"},
    {type:"P_red",value:3,front:"https://i.imgur.com/XXvlGNz.png"},
    {type:"P_red",value:4,front:"https://i.imgur.com/oXv1IYu.png"}
  ],

  /* ================= TWIST ================= */

T: [
  {type:"T",front:"https://i.imgur.com/6Kxyh6N.png"},
  {type:"T",front:"https://i.imgur.com/B0Y9Ds4.png"},
  {type:"T",front:"https://i.imgur.com/SQXBeAz.png"},
  {type:"T",front:"https://i.imgur.com/wqTpJvc.png"},
  {type:"T",front:"https://i.imgur.com/F4y6U0T.png"},
  {type:"T",front:"https://i.imgur.com/sUrInpH.png"},
  {type:"T",front:"https://i.imgur.com/iIn1lut.png"},
  {type:"T",front:"https://i.imgur.com/qANVSWD.png"},
  {type:"T",front:"https://i.imgur.com/ERgLl9n.png"},
  {type:"T",front:"https://i.imgur.com/mBzWEvE.png"},
  {type:"T",front:"https://i.imgur.com/wESmsd4.png"},
  {type:"T",front:"https://i.imgur.com/gxdT1gp.png"},
  {type:"T",front:"https://i.imgur.com/2eLRpl0.png"},
  {type:"T",front:"https://i.imgur.com/NOIqTLa.png"},
  {type:"T",front:"https://i.imgur.com/b9p5Hip.png"},
  {type:"T",front:"https://i.imgur.com/D1QvgFu.png"},
  {type:"T",front:"https://i.imgur.com/EEurGjD.png"},
  {type:"T",front:"https://i.imgur.com/IrPk7wE.png"},
  {type:"T",front:"https://i.imgur.com/yttdDNw.png"},
  {type:"T",front:"https://i.imgur.com/rFCOpxf.png"},
  {type:"T",front:"https://i.imgur.com/94hak5l.png"},
  {type:"T",front:"https://i.imgur.com/Nt0BKrf.png"},
  {type:"T",front:"https://i.imgur.com/2nU1zUD.png"},
  {type:"T",front:"https://i.imgur.com/shHpbAS.png"},
  {type:"T",front:"https://i.imgur.com/bJCnl8k.png"},
  {type:"T",front:"https://i.imgur.com/JZodwKv.png"},
  {type:"T",front:"https://i.imgur.com/Q9Dp9Tw.png"},
  {type:"T",front:"https://i.imgur.com/MtWOpaU.png"},
  {type:"T",front:"https://i.imgur.com/DK1qQql.png"},
  {type:"T",front:"https://i.imgur.com/dcHyXTw.png"}
]
};

function countHandTypes(hand){

  return {
    A: hand.filter(c=>c.type==="A").length,
    M: hand.filter(c=>c.type==="M").length,
    D: hand.filter(c=>c.type==="D").length,
    G: hand.filter(c=>c.type==="G").length,

    A_red: hand.filter(c=>c.type==="A_red").length,
    M_red: hand.filter(c=>c.type==="M_red").length,
    D_red: hand.filter(c=>c.type==="D_red").length,
    G_red: hand.filter(c=>c.type==="G_red").length
  };

}

function emitActionLog(roomCode, text, color){
  if(!roomCode || !text) return;

  io.to(roomCode).emit("actionLog", {
    text,
    color
  });
}

function createShuffledDecks(){

  const newDecks = {};

  Object.keys(decks).forEach(type => {

    newDecks[type] = [...decks[type]];

    shuffle(newDecks[type]);

  });

  return newDecks;
}

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Servidor rodando na porta:", PORT);
});

app.get("/api/dev-salas", async (req, res) => {
  try{
    const logs = await RoomLog
      .find({})
      .sort({ createdAt: -1 })
      .lean();

    const data = logs.map(room => ({
      roomCode: room.roomCode,
      createdAt: room.createdAt,
      closedAt: room.closedAt,
      duration: "-",
      status: room.status || "aberta",
      players: room.players || {},
      spectators: room.spectators || [],
      accesses: room.accesses || []
    }));

    res.json(data);
  }catch(err){
    console.error("Erro ao buscar logs:", err);

    res.status(500).json({
      error: err.message,
      name: err.name
    });
  }
});

/* ===============================
   CONEXÃO
================================ */

io.on("connection", (socket) => {

socket.on("startSecondHalf", ()=>{

  const room = rooms[socket.roomCode];
  if(!room) return;

    // 🚫 BLOQUEIO DE ESPECTADOR
  if(socket.role === "spectator") return;

  // 🔒 Opcional: só jogadores podem iniciar
  if(socket.role !== "blue" && socket.role !== "red") return;

  // 🔁 devolver cartas das mãos
  room.hands.blue.forEach(card=>{
    room.decks[card.type].push(card);
  });

  room.hands.red.forEach(card=>{
    room.decks[card.type].push(card);
  });

  // 🧹 limpar mãos
  room.hands.blue = [];
  room.hands.red  = [];

  // 🔁 devolver cartas dos slots
  Object.keys(room.boardSlots).forEach(slot=>{
    room.boardSlots[slot].forEach(card=>{
      room.decks[card.type].push(card);
    });
    room.boardSlots[slot] = [];
  });

  // 🔀 embaralhar todos os decks
  Object.keys(room.decks).forEach(type=>{
    shuffle(room.decks[type]);
  });
  room.lastSlotPlayed = null;
  // atualizar clientes
  io.to(socket.roomCode).emit("updateBoardSlots", {
  slots: room.boardSlots,
  lastSlot: room.lastSlotPlayed
});
  io.to(socket.roomCode).emit("syncDeckSizes", room.decks);

  io.to(socket.roomCode).emit("handCounts", {
  blue: countHandTypes(room.hands.blue),
  red: countHandTypes(room.hands.red)
});

  io.to(socket.roomCode).emit("secondHalfStarted");

  emitActionLog(socket.roomCode, `${socket.playerName} iniciou o 2º tempo`, socket.role);
});


socket.on("updateFormation", ({ formation }) => {

  const room = rooms[socket.roomCode];
  if (!room) return;

  const role = socket.role;
  if (!role || !formation) return;

  room.formation = room.formation || {
    blue: { A: 3, M: 4, D: 3, G: 3 },
    red: { A: 3, M: 4, D: 3, G: 3 }
  };

  room.formation[role] = {
    ...formation
  };

  emitActionLog(
  socket.roomCode,
  `${socket.playerName} alterou a formação para A${formation.A} M${formation.M} D${formation.D} G${formation.G}`, socket.role);

  io.to(socket.roomCode).emit("syncFormation", {
    blue: { ...room.formation.blue },
    red: { ...room.formation.red }
  });

  io.to(socket.roomCode).emit("handCounts", {
    blue: countHandTypes(room.hands.blue),
    red: countHandTypes(room.hands.red)
  });

});

socket.on("returnTwistToDeck", ({id})=>{

  const room = rooms[socket.roomCode];
  if(!room) return;

  const index = room.twists.findIndex(t => t.id == id);
  if(index === -1) return;

  const twist = room.twists[index];

  // remove da mesa
  room.twists.splice(index,1);

  // remove propriedades de mesa
  delete twist.id;
  delete twist.x;
  delete twist.y;
  delete twist.rotation;

  // devolve exatamente a mesma carta ao deck
  room.decks.T.push(twist);

  // embaralha
  shuffle(room.decks.T);

  io.to(socket.roomCode).emit("syncDeckSizes", room.decks);
  io.to(socket.roomCode).emit("twistRemoved", id);
  io.to(socket.roomCode).emit("deckShuffled","T");

});



  socket.on("returnCardToDeck", ({ cardId, deck }) => {

  const room = rooms[socket.roomCode];
  if(!room) return;

  let playerHand;

  if(socket.role === "blue"){
    playerHand = room.hands.blue;
  }

  if(socket.role === "red"){
    playerHand = room.hands.red;
  }

  if(!playerHand) return;

  const index = playerHand.findIndex(c => c.id === cardId);
  if(index === -1) return;

  const card = playerHand.splice(index, 1)[0];

  room.decks[deck].push(card);

  emitActionLog(socket.roomCode, `${socket.playerName} devolveu ${card.type} para o deck ${deck}`, socket.role);

  io.to(socket.roomCode).emit("syncDeckSizes", room.decks);

  socket.emit("yourHand", playerHand);

  io.to(socket.roomCode).emit("handCounts", {
  blue: countHandTypes(room.hands.blue),
  red: countHandTypes(room.hands.red)
});

});

socket.on("returnSlotCardToDeck", ({ card, fromSlot }) => {

  const room = rooms[socket.roomCode];
  if(!room) return;

  if(!room.boardSlots[fromSlot]) return;

  room.boardSlots[fromSlot] =
    room.boardSlots[fromSlot].filter(c => c.id !== card.id);

  room.decks[card.type].push(card);

  emitActionLog(
    socket.roomCode,
    `${socket.playerName} devolveu ${card.type} do slot ${fromSlot} para o deck`,
    socket.role
  );

  io.to(socket.roomCode).emit("syncDeckSizes", room.decks);

  io.to(socket.roomCode).emit("updateBoardSlots", {
    slots: room.boardSlots,
    lastSlot: room.lastSlotPlayed || null
  });

  io.to(socket.roomCode).emit("handCounts", {
    blue: countHandTypes(room.hands.blue),
    red: countHandTypes(room.hands.red)
  });

});


socket.on("flipSubToken", ({anchor, faceUp})=>{

  const roomCode = socket.roomCode;
  if(!roomCode || !rooms[roomCode]) return;

  const room = rooms[roomCode];

  if(!room.subTokens){
    room.subTokens = {};
  }

  // salva estado REAL recebido
  room.subTokens[anchor] = faceUp;

  io.to(roomCode).emit("subTokenFlipped", {
    anchor,
    faceUp
  });

});

socket.on("flipSubToken", ({anchor, faceUp})=>{

  const roomCode = socket.roomCode;
  if(!roomCode || !rooms[roomCode]) return;

  const room = rooms[roomCode];

  if(!room.subTokens){
    room.subTokens = {};
  }

  room.subTokens[anchor] = faceUp;

  io.to(roomCode).emit("subTokenFlipped", {
    anchor,
    faceUp
  });

});
  

socket.on("drawTwist", ()=>{

  const room = rooms[socket.roomCode];
  if(!room) return;

  if(room.decks.T.length === 0) return;

  const index = Math.floor(Math.random() * room.decks.T.length);
  const card = room.decks.T.splice(index,1)[0];

  const twistObj = {
    id: randomUUID(),
    front: card.front,
    x: 200,
    y: 210,
    rotation: 0
  };

  room.twists.push(twistObj);

  io.to(socket.roomCode).emit("spawnTwist", twistObj);
  io.to(socket.roomCode).emit("syncDeckSizes", room.decks);

});

socket.on("rotateTwist", ({id, double})=>{

  const room = rooms[socket.roomCode];
  if(!room) return;

  const twist = room.twists.find(t=>t.id == id);
  if(!twist) return;

  // 🔥 define rotação
  const amount = double ? 180 : 90;

  twist.rotation = (twist.rotation + amount) % 360;

  io.to(socket.roomCode).emit("twistRotated", twist);

});

  // 🔥 MOVIMENTO DE TOKEN
socket.on("moveToken", (data) => {

  const room = rooms[socket.roomCode];
  if(!room) return;

  if(!room.tokens) room.tokens = {};

  room.tokens[data.anchor] = {
    x:data.x,
    y:data.y
  };

  emitActionLog(socket.roomCode, `${socket.playerName} moveu o token ${data.anchor}`, socket.role);

  io.to(socket.roomCode).emit("tokenMoved", data);

  if(data.anchor === "tokengola"){
    io.to(socket.roomCode).emit("goalScored", {
      team: "blue"
    });
  }

  if(data.anchor === "tokengolv"){
    io.to(socket.roomCode).emit("goalScored", {
      team: "red"
    });
  }

});

socket.on("requestHand", ()=>{
  const room = rooms[socket.roomCode];
  if(!room) return;

  if(socket.role === "blue"){
    socket.emit("yourHand", room.hands.blue || []);
    return;
  }

  if(socket.role === "red"){
    socket.emit("yourHand", room.hands.red || []);
    return;
  }
});

  socket.on("playCardToSlot", ({cardId, slot}) => {

    const room = rooms[socket.roomCode];
    if(!room) return;

    let playerHand;

    if(socket.role === "blue"){
      playerHand = room.hands.blue;
    }

    if(socket.role === "red"){
      playerHand = room.hands.red;
    }

    if(!playerHand) return;

    const cardIndex = playerHand.findIndex(c => c.id === cardId);
    if(cardIndex === -1) return;

    const card = playerHand.splice(cardIndex, 1)[0];

    if(!room.boardSlots[slot]){
      console.log("Slot inválido recebido:", slot);
      return;
    }

    room.boardSlots[slot].push(card);
    
    emitActionLog(socket.roomCode, `${socket.playerName} jogou ${card.type} no slot ${slot}`, socket.role);

    room.lastSlotPlayed = slot;

    socket.emit("yourHand", playerHand);

    io.to(socket.roomCode).emit("updateBoardSlots", {
  slots: room.boardSlots,
  lastSlot: room.lastSlotPlayed
});

    io.to(socket.roomCode).emit("handCounts", {
      blue: countHandTypes(room.hands.blue),
      red: countHandTypes(room.hands.red)
    });

  });

socket.on("returnCardToHand", ({ cardId, slot }) => {

  const room = rooms[socket.roomCode];
  if(!room) return;

  const pile = room.boardSlots[slot];
  if(!pile) return;

  const index = pile.findIndex(c=>c.id === cardId);
  if(index === -1) return;

  const card = pile.splice(index,1)[0];

  if(socket.role === "blue"){
    room.hands.blue.push(card);
    socket.emit("yourHand", room.hands.blue);
  }

  if(socket.role === "red"){
    room.hands.red.push(card);
    socket.emit("yourHand", room.hands.red);
  }

  io.to(socket.roomCode).emit("updateBoardSlots", {
  slots: room.boardSlots,
  lastSlot: room.lastSlotPlayed
});

  io.to(socket.roomCode).emit("handCounts", {
  blue: countHandTypes(room.hands.blue),
  red: countHandTypes(room.hands.red)
});

});

socket.on("createRoom", ({ name, role }) => {

  const roomCode = generateRoomCode();

  rooms[roomCode] = {
    players:{ blue:null, red:null },
    hands:{ blue:[], red:[] },
    boardSlots:{
      A:[],M:[],D:[],G:[],
      A_red:[],M_red:[],D_red:[],G_red:[],
      P1:[],P2:[],P1_red:[],P2_red:[]
    },
    twists:[],
    tokens:{},
    decks: createShuffledDecks(),
    subTokens:{},
    blueConnected:false,
    redConnected:false,
    spectators:[],
devInfo:{
  roomCode,
  createdAt: new Date().toISOString(),
  closedAt: null,
  accesses:[]
}
  };


  // 🔥 ENTRA NA SALA
  socket.role = role;
  socket.roomCode = roomCode;
  socket.playerName = name;

  socket.join(roomCode);

if(role === "blue") rooms[roomCode].players.blue = name;
if(role === "red")  rooms[roomCode].players.red  = name;
if(role === "spectator") rooms[roomCode].spectators.push(name);

registerRoomAccess(roomCode, socket, "createRoom");

  socket.emit("roomCreated", roomCode);

  io.to(roomCode).emit("syncPlayers", rooms[roomCode].players);
  io.to(roomCode).emit("syncSpectators", rooms[roomCode].spectators);

});

socket.on("joinRoom", ({ name, role, roomCode }) => {

  console.log("Tentando entrar na sala:", roomCode);
  console.log("Salas existentes:", Object.keys(rooms));

  if(!rooms[roomCode]){
    socket.emit("roomError", "Sala não existe.");
    return;
  }

  const room = rooms[roomCode];

  if(!room.players){
    room.players = { blue:null, red:null };
  }

  if(!room.spectators){
    room.spectators = [];
  }

  // 🚫 BLOQUEIO DE TIMES
  if(role === "blue" && room.players.blue){
    socket.emit("roomError", "O Time Azul já está sendo usado.");
    return;
  }

  if(role === "red" && room.players.red){
    socket.emit("roomError", "O Time Vermelho já está sendo usado.");
    return;
  }

  // ✅ AGORA SIM ENTRA NA SALA
  socket.role = role;
  socket.roomCode = roomCode;
  socket.playerName = name;

  socket.join(roomCode);

if(role === "blue"){
  room.players.blue = name;
}

if(role === "red"){
  room.players.red = name;
}

if(role === "spectator"){
  room.spectators.push(name);
}

registerRoomAccess(roomCode, socket, "joinRoom");

// 🔥 CONFIRMA ENTRADA
socket.emit("roomJoined", roomCode);


  // 🔥 MENSAGEM GLOBAL DE ENTRADA
  io.to(roomCode).emit("playerJoinedMessage", {
    name,
    role
  });

  if(role === "blue"){
  emitActionLog(roomCode, `${name} entrou no Time Azul`, "blue");
}

if(role === "red"){
  emitActionLog(roomCode, `${name} entrou no Time Vermelho`, "red");
}

if(role === "spectator"){
  emitActionLog(roomCode, `${name} entrou como Espectador`, "white");
}

  io.to(roomCode).emit("syncPlayers", room.players);
  io.to(roomCode).emit("syncSpectators", room.spectators);

  socket.emit("updateBoardSlots", {
  slots: room.boardSlots,
  lastSlot: room.lastSlotPlayed || null
});
  socket.emit("syncSubTokens", room.subTokens || {});
  socket.emit("syncTwists", room.twists || []);
  socket.emit("syncTokens", room.tokens || {});
  socket.emit("syncDeckSizes", room.decks);

  socket.emit("syncFormation", room.formation || {
  blue: { A:3, M:4, D:3, G:3 },
  red:  { A:3, M:4, D:3, G:3 }
});

  io.to(roomCode).emit("handCounts", {
    blue: countHandTypes(room.hands.blue),
    red: countHandTypes(room.hands.red)
  });

  // 🔥 envia mão correta
  if(role === "blue"){
    socket.emit("yourHand", room.hands.blue);
  }

  if(role === "red"){
    socket.emit("yourHand", room.hands.red);
  }

  
});

socket.on("reconnectRoom", ({ name, role, roomCode }) => {

  if(!rooms[roomCode]) return;

  const room = rooms[roomCode];

  socket.role = role;
  socket.roomCode = roomCode;
  socket.playerName = name;

 socket.join(roomCode);

// 🔥 REASSUME POSIÇÃO
if(role === "blue"){
  room.players.blue = name;
}

if(role === "red"){
  room.players.red = name;
}

if(role === "spectator"){
  if(!room.spectators.includes(name)){
    room.spectators.push(name);
  }
}

registerRoomAccess(roomCode, socket, "reconnectRoom");

  io.to(roomCode).emit("syncPlayers", room.players);
  io.to(roomCode).emit("syncSpectators", room.spectators);

  socket.emit("handCounts", {
  blue: countHandTypes(room.hands.blue),
  red: countHandTypes(room.hands.red)
});

  socket.emit("updateBoardSlots", {
  slots: room.boardSlots,
  lastSlot: room.lastSlotPlayed || null
});
  socket.emit("syncSubTokens", room.subTokens || {});
  socket.emit("syncTwists", room.twists || []);
  socket.emit("syncDeckSizes", room.decks);

  socket.emit("syncFormation", room.formation || {
  blue: { A:3, M:4, D:3, G:3 },
  red:  { A:3, M:4, D:3, G:3 }
});

  socket.emit("syncTokens", room.tokens || {});

  if(role === "blue"){
	socket.emit("yourHand", room.hands.blue || []);
}

if(role === "red"){
	socket.emit("yourHand", room.hands.red || []);
}

  io.to(roomCode).emit("handCounts", {
    blue: countHandTypes(room.hands.blue),
    red: countHandTypes(room.hands.red)
  });


});

socket.on("restartMatch", ()=>{

  const room = rooms[socket.roomCode];

  if(!room) return;

  // 🚫 espectador não pode
  if(socket.role === "spectator") return;

  // 🔒 só jogadores
  if(socket.role !== "blue" && socket.role !== "red") return;

  // 🔁 devolver cartas das mãos
  room.hands.blue.forEach(card=>{
    room.decks[card.type].push(card);
  });

  room.hands.red.forEach(card=>{
    room.decks[card.type].push(card);
  });

  // 🔁 devolver cartas dos slots
  Object.keys(room.boardSlots).forEach(slot=>{
    room.boardSlots[slot].forEach(card=>{
      room.decks[card.type].push(card);
    });
  });

  // 🔀 embaralhar todos os decks
  Object.keys(room.decks).forEach(type=>{
    shuffle(room.decks[type]);
  });

  // limpa mãos
  room.hands.blue = [];
  room.hands.red  = [];

  // limpa slots
  room.boardSlots = {
    A:[],M:[],D:[],G:[],
    A_red:[],M_red:[],D_red:[],G_red:[],
    P1:[],P2:[],P1_red:[],P2_red:[]
  };

  // limpa twists
  room.twists = [];

  // limpa sub tokens
  room.subTokens = {};

  // limpa posições de tokens
  room.tokens = {};

  // 🔥 envia estado completo
  io.to(socket.roomCode).emit("matchRestarted");
  room.lastSlotPlayed = null;
  io.to(socket.roomCode).emit("updateBoardSlots", {
  slots: room.boardSlots,
  lastSlot: null
});
  io.to(socket.roomCode).emit("syncTwists", room.twists);
  io.to(socket.roomCode).emit("syncSubTokens", room.subTokens);
  io.to(socket.roomCode).emit("syncDeckSizes", room.decks);
  io.to(socket.roomCode).emit("handCounts", {
  blue: countHandTypes(room.hands.blue),
  red: countHandTypes(room.hands.red)
});
});













  socket.on("spectatorMark", (data)=>{

    io.to(socket.roomCode).emit("spawnMark", data);

  });
    
    socket.on("removeMark", ()=>{
    io.to(socket.roomCode).emit("removeMark");
  });


  /* ===============================
    COMPRAR CARTA
  ================================ */

socket.on("drawCard", (deckType) => {

  const room = rooms[socket.roomCode];
  if(!room) return;

  const deck = room.decks[deckType];
  if(!deck || deck.length === 0) return;

  const index = Math.floor(Math.random() * deck.length);
  const rawCard = deck.splice(index, 1)[0];

  const card = {
    ...rawCard,
    id: randomUUID()
  };

  if(socket.role === "blue"){
    room.hands.blue.push(card);
    socket.emit("yourHand", room.hands.blue);
  }

  if(socket.role === "red"){
    room.hands.red.push(card);
    socket.emit("yourHand", room.hands.red);
  }

  io.to(socket.roomCode).emit("handCounts", {
    blue: countHandTypes(room.hands.blue),
    red: countHandTypes(room.hands.red)
  });

  emitActionLog(
    socket.roomCode,
    `${socket.playerName} comprou uma carta do deck ${deckType}`,
    socket.role
  );

  io.to(socket.roomCode).emit("syncDeckSizes", room.decks);

});




  socket.on("shuffleDeck", (deckType) => {

    const room = rooms[socket.roomCode];
    if(!room) return;

    const deck = room.decks[deckType];
    if(!deck) return;

    shuffle(deck);

    // envia para todos da sala
    io.to(socket.roomCode).emit("deckShuffled", deckType);

  });

socket.on("moveTwist", (data)=>{

  const room = rooms[socket.roomCode];
  if(!room) return;

  const twist = room.twists.find(t => t.id == data.id);
  if(!twist) return;

  twist.x = data.x;
  twist.y = data.y;

  io.to(socket.roomCode).emit("twistMoved", twist);
});

  socket.on("disconnect", () => {
	const roomCode = socket.roomCode;
	const role = socket.role;
	const playerName = socket.playerName;

	if(!roomCode || !rooms[roomCode]) return;

	setTimeout(() => {
		const room = rooms[roomCode];
		if(!room) return;

		const stillConnected = Array.from(io.sockets.adapter.rooms.get(roomCode) || [])
			.some(id => {
				const s = io.sockets.sockets.get(id);
				return s && s.role === role && s.playerName === playerName;
			});

		if(stillConnected) return;

		if(role === "blue") room.players.blue = null;
		if(role === "red") room.players.red = null;
		if(role === "spectator"){
			room.spectators = room.spectators.filter(n => n !== playerName);
		}

    registerRoomAccess(roomCode, socket, "disconnect");

const hasBlue = !!room.players.blue;
const hasRed = !!room.players.red;
const hasSpectators = room.spectators && room.spectators.length > 0;

if(!hasBlue && !hasRed && !hasSpectators){
  if(room.devInfo && !room.devInfo.closedAt){
    room.devInfo.closedAt = new Date().toISOString();
  }
}

if(room.devInfo?.closedAt){
  RoomLog.findOneAndUpdate(
    { roomCode },
    {
      $set: {
        closedAt: room.devInfo.closedAt,
        status: "encerrada",
        players: room.players || {},
        spectators: room.spectators || []
      }
    }
  ).catch(err => console.error("Erro ao encerrar sala no Mongo:", err));
}

		io.to(roomCode).emit("syncPlayers", room.players);
		io.to(roomCode).emit("syncSpectators", room.spectators);
	}, 10000);
});
});