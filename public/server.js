"use strict";

const required_players = 2;
let rooms;
var playerNonce = 0;
var projectileNonce = 0;

class RoomList {

    constructor() {

        this.rooms = [];

        this.add = function (room) {
            this.rooms.push(room)
        };
        this.byId = function (id) {
            return this.rooms.filter(function (room) {
                return room.id === id;
            })[0]
        };
        this.asDTO = function () {
            return this.rooms.reduce(function (col, room) {
                col[room.id] = room.asDTO();
                return col;
            }, {})
        }
    }
}

class Room {

    constructor(index) {
        this.id = index;
        this.roomName = 'Room #' + (index + 1);
        this.players = [];
        this.projectiles = [];
    }

    join(player) {
        console.log(player)
        this.players.push(player);
        console.log('User: ' + player.name + ' has joined: ' + this.roomName);
        if (player.length === required_players) {
            // setInterval(this.startGame, 3)
        }
    }

    addProjctile(projectile) {
        this.projectiles.push(projectile);
    }

    startGame() {
        // todo implement start game logic!
    }

    leave(player) {
        this.players = this.players.filter(function (mPlayer) {
            return player !== mPlayer;
        });
    }

    asDTO(isFullDTO) {
        return {
            id: this.id,
            players: isFullDTO ? this.players.map(function (player) {
                return player.asDTO();
            }) : null,
            projectiles : isFullDTO ? this.projectiles : null,
            playerSize: this.players.length,
            roomName: this.roomName
        };
    }

}

class Player {

    constructor(socket) {
        this.id = playerNonce;
        this.x = 0;
        this.y = 0;
        this.rotationDegrees = 0;
        this.health = 100;
        this.socket = socket;
        this.name = 'cody mikol';
    }

    asDTO() {
        return {
            name: this.name,
            health: this.health,
            x: this.x,
            y: this.y,
            id: this.id,
            rotationDegrees: this.rotationDegrees
        }
    }

}

function init() {
    rooms = new RoomList();
    for (let i = 0; i < 10; i++) {
        rooms.add(new Room(i));
    }
}

init();

module.exports = {

    io: (socket) => {

        playerNonce++;
        const player = new Player(socket);
        var updater;
        var selectedRoom;

        socket.emit("rooms-available", rooms.asDTO());

        socket.on("join", function (room) {
            selectedRoom = rooms.byId(room.id);
            selectedRoom.join(player);
            socket.emit('joined-room', player.asDTO());

            updater = setInterval(function () {
                socket.emit('update-chosen-room', selectedRoom.asDTO(true));
            }, 15);

        });

        socket.on('update-player', function (client_player) {
            player.x = client_player.x;
            player.y = client_player.y;
            player.rotationDegrees = client_player.rotationDegrees;
        });

        socket.on('fire-projectile', function (projectile) {
            if (selectedRoom) {
                projectileNonce++;
                projectile.id = projectileNonce;
                selectedRoom.addProjctile(projectile)
            }
        });

        socket.on("disconnect", () => {
            if (selectedRoom) selectedRoom.leave(player);
            if (updater) clearInterval(updater);
        });

    },
};