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
