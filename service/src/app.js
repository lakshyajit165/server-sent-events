const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let clients = [];
let facts = [];
const PORT = 5000;

app.get("/status", (request, response) => response.json({ clients: clients.length }));

function eventsHandler(request, response, next) {
	const headers = {
		"Content-Type": "text/event-stream",
		Connection: "keep-alive",
		"Cache-Control": "no-cache",
	};
	response.writeHead(200, headers);

	const data = `data: ${JSON.stringify(facts)}\n\n`;

	/**
	 * Reference: https://stackoverflow.com/questions/44692048/what-is-the-difference-between-res-send-and-res-write-in-express#:~:text=end%20So%20the%20key%20difference,end%20.
	 * res.send is equivalent to res.write + res.end So the key difference is res.send can be called only once where as res.write can be called multiple times followed by a res.end.
	But apart from that res.send is part of Express. It can automatically detect the length of response header. But there may be be a chance of memory spike with res.send(), in case of large files, our application hangs in between .
	*/
	response.write(data);

	const clientId = Date.now();

	const newClient = {
		id: clientId,
		response,
	};

	clients.push(newClient);

	request.on("close", () => {
		console.log(`${clientId} Connection closed`);
		clients = clients.filter((client) => client.id !== clientId);
	});
}

function sendEventsToAll(newFact) {
	clients.forEach((client) => client.response.write(`data: ${JSON.stringify(newFact)}\n\n`));
}

async function addFact(request, respsonse, next) {
	const newFact = request.body;
	facts.push(newFact);
	respsonse.json(newFact);
	return sendEventsToAll(newFact);
}

app.post("/fact", addFact);

app.get("/events", eventsHandler);

app.listen(PORT, () => {
	console.log(`Facts Events service listening at http://localhost:${PORT}`);
});
