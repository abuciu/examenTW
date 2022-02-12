const express = require('express')
const bodyParser = require('body-parser')
const Sequelize = require('sequelize')
const cors = require('cors')
const Op = Sequelize.Op
const PORT = process.env.PORT || 3000;

const sequelize = new Sequelize({
	dialect: 'sqlite',
	storage: './examen.db',
	define: {
		timestamps: false
	}
});

const VirtualShelf = sequelize.define('virtualshelf', {
	id: {
		type: Sequelize.INTEGER,
        autoIncrement:true,
		allowNull: false,
		primaryKey: true,
        
	},
	description: {
		type: Sequelize.STRING,
		allowNull: false
	},
	date: {
		type: Sequelize.DATE,
		allowNull: false
	},
});

const Book = sequelize.define('book', {
	id: {
		type: Sequelize.INTEGER,
		autoIncrement:true,
		allowNull: false,
		primaryKey: true,
        autoIncrement:true
	},
	title: {
		type: Sequelize.STRING,
		allowNull: false
	},
	genre: {
		type: Sequelize.ENUM,
        allowNull: false,
        values: ['COMEDY', 'TRAGEDY', 'SF']
	},
	url: {
		type: Sequelize.STRING,
		allowNull: false
	},
});

VirtualShelf.hasMany(Book)

const app = express()
app.use(cors())
app.use(bodyParser.json())

app.get('/', async (req, res) => {
  res.send('Examen TW Buciu Andrei grupa 1080 2022')
})

app.get('/sync', async (req, res) => {
  try {
    await sequelize.sync({ force: true })
    res.status(201).json({ message: 'created' })
  } catch (e) {
    console.warn(e)
    res.status(500).json({ message: 'server error' })
  }
})

app.get('/vshelfs', async (req, res) => {
    try {
        const query = {}
        
        const allowedFilters = ['description', 'date']
        const filterKeys = Object.keys(req.query).filter(e => allowedFilters.indexOf(e) !== -1)
        if (filterKeys.length > 0) {
        query.where = {}
            for (const key of filterKeys) {
                query.where[key] = {
                [Op.like]: `%${req.query[key]}%`
                }
            }
        }

        const sortField = req.query.sortField
        let sortOrder = 'ASC'
        if (req.query.sortOrder && req.query.sortOrder === '-1') {
        sortOrder = 'DESC'
        }

        if (sortField) {
            query.order = [[sortField, sortOrder]]
        }


        if (req.query.pageSize) {
            pageSize = parseInt(req.query.pageSize)
        }

        if (!isNaN(parseInt(req.query.page))) {
          query.limit = pageSize
          query.offset = pageSize * parseInt(req.query.page)
        }
        
		    const vshelfs = await VirtualShelf.findAll(query);
		if (vshelfs.length > 0) {
			res.status(200).json(vshelfs);
		} else {
			res.status(204).send();
		}
	} catch (error) {
		res.status(500).json(error);
	}
})

app.post('/vshelfs', async (req, res) => {
  try {  
    await VirtualShelf.create(req.body)
    res.status(201).json({ message: 'created' })
  } catch (e) {
    console.warn(e)
    res.status(500).json({ message: 'server error' })
  }
})


app.get('/vshelfs/:id', async (req, res) => {
  try {
    const vshelf = await VirtualShelf.findByPk(req.params.id)
    if (vshelf) {
      res.status(200).json(vshelf)
    } else {
      res.status(404).json({ message: 'not found' })
    }
  } catch (e) {
    console.warn(e)
    res.status(500).json({ message: 'server error' })
  }
})

app.put('/vshelfs/:id', async (req, res) => {
  try {
    const vshelf = await VirtualShelf.findByPk(req.params.id)
    if (vshelf) {
      await vshelf.update(req.body, { fields: ['description', 'date'] })
      res.status(202).json({ message: 'accepted' })
    } else {
      res.status(404).json({ message: 'not found' })
    }
  } catch (e) {
    console.warn(e)
    res.status(500).json({ message: 'server error' })
  }
})

app.delete('/vshelfs/:id', async (req, res) => {
  try {
    const vshelf = await VirtualShelf.findByPk(req.params.id, { include: Book })
    if (vshelf) {
      await vshelf.destroy()
      res.status(202).json({ message: 'accepted' })
    } else {
      res.status(404).json({ message: 'not found' })
    }
  } catch (e) {
    console.warn(e)
    res.status(500).json({ message: 'server error' })
  }
})

app.get('/vshelfs/:bid/books', async (req, res) => {
  try {
    const vshelf = await VirtualShelf.findByPk(req.params.bid)
    if (vshelf) {
      const books = await vshelf.getBooks()

      res.status(200).json(books)
    } else {
      res.status(404).json({ message: 'not found' })
    }
  } catch (e) {
    console.warn(e)
    res.status(500).json({ message: 'server error' })
  }
})

app.get('/vshelfs/:bid/books/:cid', async (req, res) => {
  try {
    const vshelf = await VirtualShelf.findByPk(req.params.bid)
    if (vshelf) {
      const books = await vshelf.getBooks({ where: { id: req.params.cid } })
      res.status(200).json(books.shift())
    } else {
      res.status(404).json({ message: 'not found' })
    }
  } catch (e) {
    console.warn(e)
    res.status(500).json({ message: 'server error' })
  }
})

app.post('/vshelfs/:bid/books', async (req, res) => {
  try {
    const vshelf = await VirtualShelf.findByPk(req.params.bid)
    if (vshelf) {
      const book = req.body
      book.virtualshelfId = vshelf.id
      console.warn(book)
      await Book.create(book)
      res.status(201).json({ message: 'created' })
    } else {
      res.status(404).json({ message: 'not found' })
    }
  } catch (e) {
    console.warn(e)
    res.status(500).json({ message: 'server error' })
  }
})

app.put('/vshelfs/:bid/books/:cid', async (req, res) => {
  try {
    const vshelf = await VirtualShelf.findByPk(req.params.bid)
    if (vshelf) {
      const books = await vshelf.getBooks({ where: { id: req.params.cid } })
      const book = books.shift()
      if (book) {
        await book.update(req.body)
        res.status(202).json({ message: 'accepted' })
      } else {
        res.status(404).json({ message: 'not found' })
      }
    } else {
      res.status(404).json({ message: 'not found' })
    }
  } catch (e) {
    console.warn(e)
    res.status(500).json({ message: 'server error' })
  }
})

app.delete('/vshelfs/:bid/books/:cid', async (req, res) => {
  try {
    const vshelf = await VirtualShelf.findByPk(req.params.bid)
    if (vshelf) {
      const books = await vshelf.getBooks({ where: { id: req.params.cid } })
      const book = books.shift()
      if (book) {
        await book.destroy(req.body)
        res.status(202).json({ message: 'accepted' })
      } else {
        res.status(404).json({ message: 'not found' })
      }
    } else {
      res.status(404).json({ message: 'not found' })
    }
  } catch (e) {
    console.warn(e)
    res.status(500).json({ message: 'server error' })
  }
})

app.listen(PORT)