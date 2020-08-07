import * as shortid from "shortid";

let db: any = [];
let matching: any = [];

export function setting() {
  db = [];
  matching = [];
  console.log("Setting", db);
}

export function socket(io) {
  io.sockets.on("connection", (socket) => {
    console.log("socket 서버 접속 완료 ");
    socket.on("Create", async (data: any) => {
      const random: string = shortid.generate().slice(0, 6);
      const rdata: any = JSON.parse(data);
      db.push({
        room_id: random,
        player: [
          {
            master: true,
            nickname: rdata.nickname,
            missed: false,
          },
        ],
      });
      //방에 들여보내줌
      console.log(db);
      socket.join(random);

      if (db.length != 0) {
        console.log("있음");
        let room = db.filter((value) => value.room_id == random);
        console.log(room[0]);
        if (room.length != 0) {
          io.sockets.in(random).emit("CreateR", room[0]);
        } else {
          io.sockets
            .in(socket.id)
            .emit("CreateFail", { msg: "방을 생성하지 못하였습니다." });
        }
      } else {
        console.log("없음");
        io.sockets
          .in(socket.id)
          .emit("CreateFail", { msg: "방을 생성하지 못하였습니다." });
      }
    });
    socket.on("Join", (data: any) => {
      const rdata: any = JSON.parse(data);
      console.log(db);
      if (db.length != 0) {
        console.log("있음");
        let room = db.filter((value) => value.room_id == rdata.room_id);
        console.log(room, room.length);
        if (room.length != 0) {
          console.log("성공", room[0]);
          socket.join(room[0].room_id);
          let dbs = [];
          let nowdb = [];
          db.forEach((value) => {
            if (value.room_id == rdata.room_id) {
              value.player = value.player.concat([
                { master: false, nickname: rdata.nickname, missed: false },
              ]);
              nowdb = value;
            }
            dbs.push(value);
          });
          db = dbs;
          console.log("Join Db", db);
          console.log("Now", nowdb);

          io.sockets.in(rdata.room_id).emit("GameStart", nowdb);
        } else {
          // 소켓 연결 실패 즉 일치한 아이디가 없음
          console.log("실패");
          io.sockets
            .in(socket.id)
            .emit("JoinFail", { msg: "비밀번호가 틀렸습니다." });
        }
      } else {
        console.log("없음");
        io.sockets
          .in(socket.id)
          .emit("JoinFail", { msg: "비밀번호가 틀렸습니다." });
      }
    });
    socket.on("Matching", (data: any) => {
      const rdata: any = JSON.parse(data);

      console.log("Matching", rdata, matching.length);
      matching.push({ socket_id: socket.id, nickname: rdata.nickname });
      while (matching.length > 1) {
        console.log("중복");
        let random: string = shortid.generate().slice(0, 6);
        let playerData = [];
        matching.slice(0, 2).forEach((element: any, index: number) => {
          console.log(element);
          playerData.push({
            master: index == 0 ? true : false,
            nickname: element.nickname,
            missed: false,
          });
          socket.join(random);
          io.sockets.in(element.socket_id).emit("Matched", {
            room_id: random,
            player: playerData,
          });
        });
        db.push({
          room_id: random,
          player: playerData,
        });
        matching.splice(0, 2);
        console.log("MatchingDb 삭제되는지 확인", matching);
      }
    });
    // 매칭 취소 만들기
    socket.on("CancelMatching", (data: any) => {
      const rdata: any = JSON.parse(data);
      console.log("CancelMatching", rdata, matching);
      matching = matching.filter((value) => value.socket_id != rdata.socket_id);
      io.sockets.in(socket.id).emit("CancelMatchingR", {
        msg: "매칭을 취소하였습니다.",
      });
    });

    // 게임 종료 방삭제
    socket.on("GameStop", (data: any) => {
      const rdata: any = JSON.parse(data);
      console.log("GameStop", rdata);
      db = db.filter((value) => value.room_id != rdata.room_id);
      io.sockets.in(rdata.room_id).emit("CancelGameR", {
        msg: "게임을 종료하였습니다.",
      });
      console.log(rdata.room_id);
      socket.leave(rdata.room_id);
    });

    // 처음에 데이터 가져오기
    socket.on("GetText", () => {
      console.log("GetText");
    });

    // roomDB쓰면안되용
    // socket.leave(dataArray[0]);
  });
}
