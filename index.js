const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const rethinkdb = require('rethinkdb');
const bcrypt = require('bcrypt');

const app = express();
const port = 5000;

app.use(bodyParser.json()); // Middleware
app.use(cors());

let connection = null;
rethinkdb.connect({ host: 'localhost', port: 28015, db: 'test' }, (err, conn) => {
	if (err) throw err;
	connection = conn;
	console.log('Db connected');
});

// Notes endpoints
app.get('/notes', async (req, res) => {
	const owner = req.query.owner;
    if (!owner) {
        return res.status(400).send('Owner query parameter is missing');
    }
	try {
		const cursor = await rethinkdb.table('notes').filter(note =>note('owner').match(owner)).orderBy(rethinkdb.desc('priority')).run(connection);
		const notes = await cursor.toArray();
		res.json(notes);
	} catch (error) {
		console.error('Fetch error', error);
		res.status(500).json({ error: 'Fetch error' });
	}
});

app.post('/notes', async (req, res) => {
	const { title, content, priority, lockStatus ,owner ,password} = req.body;
	try {
		const result = await rethinkdb.table('notes').insert({
			id: uuidv4(),
			title,
			content,
			priority,
			lockStatus,
			owner,
			password
		}).run(connection);
		const insertedNote = await rethinkdb.table('notes').get(result.generated_keys[0]).run(connection);
		res.status(201).json(insertedNote);
	} catch (error) {
		console.error('Note creation error:', error);
		res.status(500).json({ error: 'Note creation error' });
	}
});

app.put('/notes/:id', async (req, res) => {
	const { id } = req.params;
	const { title, content, priority, lockStatus , password} = req.body;
	try {
		await rethinkdb.table('notes').get(id).update({ title, content, priority, lockStatus  ,password}).run(connection);
		const updatedNote = await rethinkdb.table('notes').get(id).run(connection);
		res.json(updatedNote);
	} catch (error) {
		console.error('Note update error:', error);
		res.status(500).json({ error: 'Note update error' });
	}
});

app.delete('/notes/:id', async (req, res) => {
	const { id } = req.params;
	try {
		await rethinkdb.table('notes').get(id).delete().run(connection);
		res.json({ message: 'Note deleted' });
	} catch (error) {
		console.error('Note delete error:', error);
		res.status(500).json({ error: 'Note delete error' });
	}
});

app.get('/search', async (req, res) => {
	const { query ,owner} = req.query;
	try {
		const cursor = await rethinkdb.table('notes')
			.filter(note =>
				note('title').match(query).or(note('content').match(query))
			)
			.filter(note =>
				note('owner').match(owner))
			.orderBy(rethinkdb.desc('priority'))
			.run(connection);
		const notes = await cursor.toArray();
		res.json(notes);
	} catch (error) {
		console.error('Search error:', error);
		res.status(500).json({ error: 'Search error' });
	}
});

// User authentication endpoint
app.post('/register', async (req, res) => {
	const { username, password } = req.body;
	try {
		const hashedPassword = await bcrypt.hash(password, 10);
		const result = await rethinkdb.table('users').insert({
			id: uuidv4(),
			username,
			password: hashedPassword,
		}).run(connection);
		const insertedUser = await rethinkdb.table('users').get(result.generated_keys[0]).run(connection);
		res.status(201).json({ user: insertedUser });
	} catch (error) {
		console.error('Registration error:', error);
		res.status(500).json({ error: 'Registration error' });
	}
});

// User login endpoint
app.post('/login', async (req, res) => {
	const { username, password } = req.body;
	try {
		const cursor = await rethinkdb.table('users').filter({ username }).run(connection);
		const users = await cursor.toArray();
		if (users.length === 0) {
			return res.status(401).json({ error: 'User not found' });
		}

		const user = users[0];
		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
			return res.status(401).json({ error: 'Invalid password' });
		}

		res.json({ message: 'Login successful', user });
	} catch (error) {
		console.error('Login error:', error);
		res.status(500).json({ error: 'Login error' });
	}
});

app.listen(port, () => {
	console.log(`Server running on port: http://localhost:${port}`);
});
