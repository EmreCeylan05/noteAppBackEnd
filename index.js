const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const rethinkdb = require('rethinkdb');

const app = express();
const port = 5000;


app.use(bodyParser.json());// Middleware
app.use(cors());

let connection = null;
rethinkdb.connect({ host: 'localhost', port: 28015, db: 'test' }, (err, conn) => {
	if (err) throw err;
	connection = conn;
	console.log('Db baglandi');
});

app.get('/notes', async (req, res) => {
	try {
		const cursor = await rethinkdb.table('notes').run(connection);
		const notes = await cursor.toArray();
		res.json(notes);
	} catch (error) {
		console.error('fetch hatasi', error);
		res.status(500).json({ error: 'fetch hatasi' });
	}
});

app.post('/notes', async (req, res) => {
	const { title, content } = req.body;
	try {
		const result = await rethinkdb.table('notes').insert({
			id: uuidv4(),
			title,
			content,
		}).run(connection);
		const insertedNote = await rethinkdb.table('notes').get(result.generated_keys[0]).run(connection);
		res.status(201).json(insertedNote);
	} catch (error) {
		console.error('not ekleme hatasi:', error);
		res.status(500).json({ error: 'not ekleme hatasi' });
	}
});

app.put('/notes/:id', async (req, res) => {
	const { id } = req.params;
	const { title, content } = req.body;
	try {
		await rethinkdb.table('notes').get(id).update({ title, content }).run(connection);
		const updatedNote = await rethinkdb.table('notes').get(id).run(connection);
		res.json(updatedNote);
	} catch (error) {
		console.error('not güncelleme hatasi:', error);
		res.status(500).json({ error: 'not güncellenme hatasi' });
	}
});

app.delete('/notes/:id', async (req, res) => {
	const { id } = req.params;
	try {
		await rethinkdb.table('notes').get(id).delete().run(connection);
		res.json({ message: 'Not silindi' });
	} catch (error) {
		console.error('not silme hatasi:', error);
		res.status(500).json({ error: 'not silme hatasi:' });
	}
});

app.get('/search', async (req, res) => {
	const { query } = req.query;
	try {
		const cursor = await rethinkdb.table('notes')
			.filter(note =>
				note('title').match(query).or(note('content').match(query))
			)
			.run(connection);
		const notes = await cursor.toArray();
		res.json(notes);
	} catch (error) {
		console.error('not arama hatasi:', error);
		res.status(500).json({ error: 'not arama hatasi' });
	}
});

app.listen(port, () => {
	console.log(`Server port üzerinde açıldı: http://localhost:${port}`);
});
