const globals = {};
const connection = {};

let socket;
const establishSocket = ipString => {
    if (!ipString) ipString = params.defaultIP;
    console.log(ipString)
    socket = io.connect(ipString, { reconnection: false });
    connection.socket = socket;
    connection.isConnected = false;

    socket.on("connect", _ => {
        connection.isConnected = true;
        console.log("Connected to the server.");
    });
    socket.on("connect_error", _ => {
        connection.isConnected = false;
        console.error("Failed to connect the server!");
    });
    socket.on("disconnect", _ => {
        connection.isConnected = false;
        console.log("Disconnected from the server.");
    });
    socket.on("log", console.log);
    socket.on("error", console.error);
};
establishSocket();

const dbFind = (db, collection, query, callback) => {
    if (!connection.isConnected) return alert("Not connected to the server!");
    console.log(db, collection, query)
    socket.emit("find", { db, collection, query });
    socket.once("find", callback);
}

const dbFindAll = (callback, db = "genetic-modeling", collection = "histogramData") =>
    dbFind(db, collection, {}, callback);

const dbFindAllAndLog = (db = "genetic-modeling", collection = "histogramData") =>
    dbFindAll(console.log, db, collection);

const dbFindAllAndGlobalStore = (db = "genetic-modeling", collection = "histogramData") => {
    globals.data = undefined;
    dbFindAll(db, collection, data => globals.data = data);
};

